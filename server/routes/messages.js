import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { messageLimiter } from '../middleware/rateLimiter.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { messageSchema, idParamSchema } from '../schemas/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Socket.io instance will be set from index.js
let io = null;
export const setSocketIO = (socketIO) => { io = socketIO; };

/**
 * GET /messages/:clientId
 * Get messages for a client
 */
router.get('/:clientId', authenticate, asyncHandler(async (req, res) => {
    const { clientId } = req.params;

    const { rows } = await pool.query(`
        SELECT 
            m.*,
            u.full_name as agent_name,
            u.avatar_url as agent_avatar
        FROM messages m
        LEFT JOIN users u ON m.agent_id = u.id
        WHERE m.session_id = $1
        ORDER BY m.created_at ASC
    `, [clientId]);

    res.json(rows);
}));

/**
 * POST /messages
 * Send a new message
 */
router.post('/', authenticate, messageLimiter, validateBody(messageSchema), asyncHandler(async (req, res) => {
    const { session_id, message, message_file, platform } = req.body;

    const { rows } = await pool.query(`
        INSERT INTO messages (session_id, agent_id, message, message_file, platform)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `, [session_id, req.user.id, message, JSON.stringify(message_file), platform]);

    const newMessage = rows[0];

    // Add agent info
    newMessage.agent_name = req.user.full_name;
    newMessage.agent_avatar = req.user.avatar_url;

    // Emit via Socket.io
    if (io) {
        io.to(`client:${session_id}`).emit('new_message', newMessage);
    }

    res.status(201).json(newMessage);
}));

/**
 * PATCH /messages/:clientId/read
 * Mark all messages as read for a client
 */
router.patch('/:clientId/read', authenticate, asyncHandler(async (req, res) => {
    const { clientId } = req.params;

    await pool.query(`
        UPDATE messages 
        SET read = true 
        WHERE session_id = $1 AND read = false AND agent_id IS NULL
    `, [clientId]);

    res.json({ message: 'Messages marked as read' });
}));

export default router;
