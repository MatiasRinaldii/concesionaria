import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { eventSchema, eventTypeSchema, idParamSchema } from '../schemas/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { cache } from '../config/redis.js';

const router = Router();

const EVENT_TYPES_CACHE_KEY = 'cache:event_types';
const CACHE_TTL = 3600; // 1 hour

/**
 * GET /events
 * Get all events with relations
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const { from, to } = req.query;

    let query = `
        SELECT 
            e.*,
            json_build_object('id', et.id, 'name', et.name, 'color', et.color) as event_type,
            json_build_object('id', c.id, 'name', c.name) as client
        FROM events_calendar e
        LEFT JOIN event_types et ON e.event_type_id = et.id
        LEFT JOIN clients c ON e.client_id = c.id
    `;

    const values = [];
    const conditions = [];

    if (from) {
        values.push(from);
        conditions.push(`e.date >= $${values.length}`);
    }
    if (to) {
        values.push(to);
        conditions.push(`e.date <= $${values.length}`);
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY e.date ASC';

    const { rows } = await pool.query(query, values);

    res.json(rows);
}));

/**
 * GET /events/types
 * Get all event types (cached)
 */
router.get('/types', authenticate, asyncHandler(async (req, res) => {
    // Try cache first
    let eventTypes = await cache.get(EVENT_TYPES_CACHE_KEY);

    if (!eventTypes) {
        const { rows } = await pool.query(
            'SELECT * FROM event_types ORDER BY name'
        );
        eventTypes = rows;
        await cache.set(EVENT_TYPES_CACHE_KEY, eventTypes, CACHE_TTL);
    }

    res.json(eventTypes);
}));

/**
 * POST /events/types
 * Create a new event type
 */
router.post('/types', authenticate, validateBody(eventTypeSchema), asyncHandler(async (req, res) => {
    const { name, color } = req.body;

    const { rows } = await pool.query(`
        INSERT INTO event_types (name, color)
        VALUES ($1, $2)
        RETURNING *
    `, [name, color]);

    // Invalidate cache
    await cache.del(EVENT_TYPES_CACHE_KEY);

    res.status(201).json(rows[0]);
}));

/**
 * DELETE /events/types/:id
 * Delete an event type
 */
router.delete('/types/:id', authenticate, validateParams(idParamSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;

    await pool.query('DELETE FROM event_types WHERE id = $1', [id]);

    // Invalidate cache
    await cache.del(EVENT_TYPES_CACHE_KEY);

    res.status(204).send();
}));

/**
 * GET /events/:id
 * Get single event
 */
router.get('/:id', authenticate, validateParams(idParamSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { rows } = await pool.query(`
        SELECT 
            e.*,
            json_build_object('id', et.id, 'name', et.name, 'color', et.color) as event_type,
            json_build_object('id', c.id, 'name', c.name) as client
        FROM events_calendar e
        LEFT JOIN event_types et ON e.event_type_id = et.id
        LEFT JOIN clients c ON e.client_id = c.id
        WHERE e.id = $1
    `, [id]);

    if (rows.length === 0) {
        return res.status(404).json({ error: 'Event not found' });
    }

    res.json(rows[0]);
}));

/**
 * POST /events
 * Create a new event
 */
router.post('/', authenticate, validateBody(eventSchema), asyncHandler(async (req, res) => {
    const { title, description, date, duration, client_id, event_type_id } = req.body;

    const { rows } = await pool.query(`
        INSERT INTO events_calendar (title, description, date, duration, client_id, event_type_id, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `, [title, description, date, duration, client_id, event_type_id, req.user.id]);

    res.status(201).json(rows[0]);
}));

/**
 * PATCH /events/:id
 * Update an event
 */
router.patch('/:id', authenticate, validateParams(idParamSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, date, duration, client_id, event_type_id } = req.body;

    const { rows } = await pool.query(`
        UPDATE events_calendar 
        SET 
            title = COALESCE($1, title),
            description = COALESCE($2, description),
            date = COALESCE($3, date),
            duration = COALESCE($4, duration),
            client_id = $5,
            event_type_id = $6
        WHERE id = $7
        RETURNING *
    `, [title, description, date, duration, client_id, event_type_id, id]);

    if (rows.length === 0) {
        return res.status(404).json({ error: 'Event not found' });
    }

    res.json(rows[0]);
}));

/**
 * DELETE /events/:id
 * Delete an event
 */
router.delete('/:id', authenticate, validateParams(idParamSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { rowCount } = await pool.query('DELETE FROM events_calendar WHERE id = $1', [id]);

    if (rowCount === 0) {
        return res.status(404).json({ error: 'Event not found' });
    }

    res.status(204).send();
}));

export default router;
