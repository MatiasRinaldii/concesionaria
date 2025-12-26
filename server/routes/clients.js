import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { clientSchema, clientUpdateSchema, idParamSchema } from '../schemas/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { cache } from '../config/redis.js';

const router = Router();

/**
 * GET /clients
 * Get all clients with labels and tags
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const { rows } = await pool.query(`
        SELECT 
            c.*,
            l.id as label_id, l.name as label_name, l.color as label_color,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object('id', t.id, 'name', t.name)
                ) FILTER (WHERE t.id IS NOT NULL),
                '[]'
            ) as tags,
            (
                SELECT json_build_object(
                    'id', m.id,
                    'message', m.message,
                    'created_at', m.created_at,
                    'platform', m.platform
                )
                FROM messages m 
                WHERE m.session_id = c.id 
                ORDER BY m.created_at DESC 
                LIMIT 1
            ) as last_message,
            (
                SELECT COUNT(*) 
                FROM messages m 
                WHERE m.session_id = c.id AND m.read = false AND m.agent_id IS NULL
            )::int as unread_count
        FROM clients c
        LEFT JOIN labels l ON c.label_id = l.id
        LEFT JOIN tag_client tc ON c.id = tc.client_id
        LEFT JOIN tags t ON tc.tag_id = t.id
        GROUP BY c.id, l.id
        ORDER BY c.updated_at DESC
    `);

    res.json(rows);
}));

/**
 * GET /clients/:id
 * Get single client with all details
 */
router.get('/:id', authenticate, validateParams(idParamSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { rows } = await pool.query(`
        SELECT 
            c.*,
            json_build_object('id', l.id, 'name', l.name, 'color', l.color) as label,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object('id', t.id, 'name', t.name)
                ) FILTER (WHERE t.id IS NOT NULL),
                '[]'
            ) as tags
        FROM clients c
        LEFT JOIN labels l ON c.label_id = l.id
        LEFT JOIN tag_client tc ON c.id = tc.client_id
        LEFT JOIN tags t ON tc.tag_id = t.id
        WHERE c.id = $1
        GROUP BY c.id, l.id
    `, [id]);

    if (rows.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
    }

    res.json(rows[0]);
}));

/**
 * POST /clients
 * Create a new client
 */
router.post('/', authenticate, validateBody(clientSchema), asyncHandler(async (req, res) => {
    const { name, phone, email, platform, agent, status, auto_interes, auto_entrega, label_id } = req.body;

    const { rows } = await pool.query(`
        INSERT INTO clients (name, phone, email, platform, agent, status, auto_interes, auto_entrega, label_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    `, [name, phone, email, platform, agent, status, auto_interes, auto_entrega, label_id]);

    res.status(201).json(rows[0]);
}));

/**
 * PATCH /clients/:id
 * Update a client
 */
router.patch('/:id', authenticate, validateParams(idParamSchema), validateBody(clientUpdateSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    const setClauses = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
        setClauses.push(`${key} = $${paramCount++}`);
        values.push(value);
    }

    values.push(id);

    const { rows } = await pool.query(`
        UPDATE clients 
        SET ${setClauses.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
    `, values);

    if (rows.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
    }

    res.json(rows[0]);
}));

/**
 * DELETE /clients/:id
 * Delete a client
 */
router.delete('/:id', authenticate, validateParams(idParamSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { rowCount } = await pool.query('DELETE FROM clients WHERE id = $1', [id]);

    if (rowCount === 0) {
        return res.status(404).json({ error: 'Client not found' });
    }

    res.status(204).send();
}));

/**
 * POST /clients/:id/tags
 * Add tags to a client
 */
router.post('/:id/tags', authenticate, validateParams(idParamSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { tag_ids } = req.body;

    if (!Array.isArray(tag_ids) || tag_ids.length === 0) {
        return res.status(400).json({ error: 'tag_ids array is required' });
    }

    // Insert tags (ignore duplicates)
    const values = tag_ids.map((tagId, i) => `($1, $${i + 2})`).join(', ');
    await pool.query(`
        INSERT INTO tag_client (client_id, tag_id)
        VALUES ${values}
        ON CONFLICT (client_id, tag_id) DO NOTHING
    `, [id, ...tag_ids]);

    res.json({ message: 'Tags added' });
}));

/**
 * DELETE /clients/:id/tags/:tagId
 * Remove a tag from a client
 */
router.delete('/:id/tags/:tagId', authenticate, asyncHandler(async (req, res) => {
    const { id, tagId } = req.params;

    await pool.query(
        'DELETE FROM tag_client WHERE client_id = $1 AND tag_id = $2',
        [id, tagId]
    );

    res.status(204).send();
}));

export default router;
