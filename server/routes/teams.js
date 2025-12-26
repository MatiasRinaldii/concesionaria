import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { teamSchema, teamMessageSchema, idParamSchema } from '../schemas/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Socket.io instance
let io = null;
export const setSocketIO = (socketIO) => { io = socketIO; };

/**
 * GET /teams
 * Get all teams for current user
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const { rows } = await pool.query(`
        SELECT 
            t.*,
            (SELECT COUNT(*) FROM team_users WHERE team_id = t.id)::int as member_count,
            (
                SELECT json_build_object(
                    'message', tm.message,
                    'created_at', tm.created_at
                )
                FROM team_messages tm
                WHERE tm.team_id = t.id
                ORDER BY tm.created_at DESC
                LIMIT 1
            ) as last_message
        FROM teams t
        INNER JOIN team_users tu ON t.id = tu.team_id
        WHERE tu.user_id = $1
        ORDER BY t.updated_at DESC
    `, [req.user.id]);

    res.json(rows);
}));

/**
 * GET /teams/:id
 * Get team details with members
 */
router.get('/:id', authenticate, validateParams(idParamSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verify user is member
    const membership = await pool.query(
        'SELECT role FROM team_users WHERE team_id = $1 AND user_id = $2',
        [id, req.user.id]
    );

    if (membership.rows.length === 0) {
        return res.status(403).json({ error: 'Not a member of this team' });
    }

    const { rows } = await pool.query(`
        SELECT 
            t.*,
            json_agg(
                json_build_object(
                    'id', u.id,
                    'email', u.email,
                    'full_name', u.full_name,
                    'avatar_url', u.avatar_url,
                    'role', tu.role,
                    'joined_at', tu.joined_at
                )
            ) as members
        FROM teams t
        LEFT JOIN team_users tu ON t.id = tu.team_id
        LEFT JOIN users u ON tu.user_id = u.id
        WHERE t.id = $1
        GROUP BY t.id
    `, [id]);

    if (rows.length === 0) {
        return res.status(404).json({ error: 'Team not found' });
    }

    res.json(rows[0]);
}));

/**
 * POST /teams
 * Create a new team
 */
router.post('/', authenticate, validateBody(teamSchema), asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const { member_ids = [] } = req.body;

    // Start transaction
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Create team
        const { rows: teamRows } = await client.query(`
            INSERT INTO teams (name, description, created_by)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [name, description, req.user.id]);

        const team = teamRows[0];

        // Add creator as admin
        await client.query(`
            INSERT INTO team_users (team_id, user_id, role)
            VALUES ($1, $2, 'admin')
        `, [team.id, req.user.id]);

        // Add other members
        for (const memberId of member_ids) {
            if (memberId !== req.user.id) {
                await client.query(`
                    INSERT INTO team_users (team_id, user_id, role)
                    VALUES ($1, $2, 'member')
                `, [team.id, memberId]);
            }
        }

        await client.query('COMMIT');

        res.status(201).json(team);
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}));

/**
 * PATCH /teams/:id
 * Update team details
 */
router.patch('/:id', authenticate, validateParams(idParamSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    // Verify user is admin
    const membership = await pool.query(
        'SELECT role FROM team_users WHERE team_id = $1 AND user_id = $2',
        [id, req.user.id]
    );

    if (membership.rows.length === 0 || membership.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can update the team' });
    }

    const { rows } = await pool.query(`
        UPDATE teams SET name = COALESCE($1, name), description = COALESCE($2, description)
        WHERE id = $3
        RETURNING *
    `, [name, description, id]);

    res.json(rows[0]);
}));

/**
 * DELETE /teams/:id
 * Delete a team
 */
router.delete('/:id', authenticate, validateParams(idParamSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verify user is admin
    const membership = await pool.query(
        'SELECT role FROM team_users WHERE team_id = $1 AND user_id = $2',
        [id, req.user.id]
    );

    if (membership.rows.length === 0 || membership.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can delete the team' });
    }

    await pool.query('DELETE FROM teams WHERE id = $1', [id]);

    res.status(204).send();
}));

/**
 * POST /teams/:id/members
 * Add member to team
 */
router.post('/:id/members', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { user_id, role = 'member' } = req.body;

    // Verify user is admin
    const membership = await pool.query(
        'SELECT role FROM team_users WHERE team_id = $1 AND user_id = $2',
        [id, req.user.id]
    );

    if (membership.rows.length === 0 || membership.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can add members' });
    }

    await pool.query(`
        INSERT INTO team_users (team_id, user_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (team_id, user_id) DO NOTHING
    `, [id, user_id, role]);

    res.json({ message: 'Member added' });
}));

/**
 * DELETE /teams/:id/members/:userId
 * Remove member from team
 */
router.delete('/:id/members/:userId', authenticate, asyncHandler(async (req, res) => {
    const { id, userId } = req.params;

    // Verify user is admin (or removing themselves)
    if (userId !== req.user.id) {
        const membership = await pool.query(
            'SELECT role FROM team_users WHERE team_id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (membership.rows.length === 0 || membership.rows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can remove members' });
        }
    }

    await pool.query(
        'DELETE FROM team_users WHERE team_id = $1 AND user_id = $2',
        [id, userId]
    );

    res.status(204).send();
}));

/**
 * GET /teams/:id/messages
 * Get team messages
 */
router.get('/:id/messages', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verify membership
    const membership = await pool.query(
        'SELECT 1 FROM team_users WHERE team_id = $1 AND user_id = $2',
        [id, req.user.id]
    );

    if (membership.rows.length === 0) {
        return res.status(403).json({ error: 'Not a member of this team' });
    }

    const { rows } = await pool.query(`
        SELECT 
            tm.*,
            u.full_name as sender_name,
            u.avatar_url as sender_avatar
        FROM team_messages tm
        LEFT JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id = $1
        ORDER BY tm.created_at ASC
    `, [id]);

    res.json(rows);
}));

/**
 * POST /teams/:id/messages
 * Send message to team
 */
router.post('/:id/messages', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { message, message_file = [] } = req.body;

    // Verify membership
    const membership = await pool.query(
        'SELECT 1 FROM team_users WHERE team_id = $1 AND user_id = $2',
        [id, req.user.id]
    );

    if (membership.rows.length === 0) {
        return res.status(403).json({ error: 'Not a member of this team' });
    }

    const { rows } = await pool.query(`
        INSERT INTO team_messages (team_id, user_id, message, message_file)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `, [id, req.user.id, message, JSON.stringify(message_file)]);

    const newMessage = rows[0];
    newMessage.sender_name = req.user.full_name;
    newMessage.sender_avatar = req.user.avatar_url;

    // Emit via Socket.io
    if (io) {
        io.to(`team:${id}`).emit('team_message', newMessage);
    }

    res.status(201).json(newMessage);
}));

/**
 * GET /teams/users/available
 * Get users available to add to teams
 */
router.get('/users/available', authenticate, asyncHandler(async (req, res) => {
    const { rows } = await pool.query(`
        SELECT id, email, full_name, avatar_url
        FROM users
        WHERE is_active = true
        ORDER BY full_name
    `);

    res.json(rows);
}));

export default router;
