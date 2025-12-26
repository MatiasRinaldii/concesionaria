import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { labelSchema, tagSchema, noteSchema, idParamSchema } from '../schemas/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { cache } from '../config/redis.js';

const router = Router();

const LABELS_CACHE_KEY = 'cache:labels';
const TAGS_CACHE_KEY = 'cache:tags';
const CACHE_TTL = 3600;

// ======== LABELS ========

/**
 * GET /labels
 * Get all labels (cached)
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
    let labels = await cache.get(LABELS_CACHE_KEY);

    if (!labels) {
        const { rows } = await pool.query('SELECT * FROM labels ORDER BY name');
        labels = rows;
        await cache.set(LABELS_CACHE_KEY, labels, CACHE_TTL);
    }

    res.json(labels);
}));

/**
 * POST /labels
 * Create a new label
 */
router.post('/', authenticate, validateBody(labelSchema), asyncHandler(async (req, res) => {
    const { name, description, color } = req.body;

    const { rows } = await pool.query(`
        INSERT INTO labels (name, description, color)
        VALUES ($1, $2, $3)
        RETURNING *
    `, [name, description, color]);

    await cache.del(LABELS_CACHE_KEY);

    res.status(201).json(rows[0]);
}));

/**
 * PATCH /labels/:id
 * Update a label
 */
router.patch('/:id', authenticate, validateParams(idParamSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, color } = req.body;

    const { rows } = await pool.query(`
        UPDATE labels 
        SET name = COALESCE($1, name), 
            description = COALESCE($2, description),
            color = COALESCE($3, color)
        WHERE id = $4
        RETURNING *
    `, [name, description, color, id]);

    if (rows.length === 0) {
        return res.status(404).json({ error: 'Label not found' });
    }

    await cache.del(LABELS_CACHE_KEY);

    res.json(rows[0]);
}));

/**
 * DELETE /labels/:id
 * Delete a label
 */
router.delete('/:id', authenticate, validateParams(idParamSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;

    await pool.query('DELETE FROM labels WHERE id = $1', [id]);
    await cache.del(LABELS_CACHE_KEY);

    res.status(204).send();
}));

// ======== TAGS ========

/**
 * GET /labels/tags
 * Get all tags (cached)
 */
router.get('/tags', authenticate, asyncHandler(async (req, res) => {
    let tags = await cache.get(TAGS_CACHE_KEY);

    if (!tags) {
        const { rows } = await pool.query('SELECT * FROM tags ORDER BY name');
        tags = rows;
        await cache.set(TAGS_CACHE_KEY, tags, CACHE_TTL);
    }

    res.json(tags);
}));

/**
 * POST /labels/tags
 * Create a new tag
 */
router.post('/tags', authenticate, validateBody(tagSchema), asyncHandler(async (req, res) => {
    const { name } = req.body;

    const { rows } = await pool.query(`
        INSERT INTO tags (name)
        VALUES ($1)
        RETURNING *
    `, [name]);

    await cache.del(TAGS_CACHE_KEY);

    res.status(201).json(rows[0]);
}));

/**
 * DELETE /labels/tags/:id
 * Delete a tag
 */
router.delete('/tags/:id', authenticate, validateParams(idParamSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;

    await pool.query('DELETE FROM tags WHERE id = $1', [id]);
    await cache.del(TAGS_CACHE_KEY);

    res.status(204).send();
}));

// ======== NOTES ========

/**
 * GET /labels/notes/:clientId
 * Get notes for a client
 */
router.get('/notes/:clientId', authenticate, asyncHandler(async (req, res) => {
    const { clientId } = req.params;

    const { rows } = await pool.query(`
        SELECT n.*, u.full_name as user_name
        FROM notes n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE n.client_id = $1
        ORDER BY n.created_at DESC
    `, [clientId]);

    res.json(rows);
}));

/**
 * POST /labels/notes
 * Create a new note
 */
router.post('/notes', authenticate, validateBody(noteSchema), asyncHandler(async (req, res) => {
    const { client_id, message } = req.body;

    const { rows } = await pool.query(`
        INSERT INTO notes (client_id, user_id, message)
        VALUES ($1, $2, $3)
        RETURNING *
    `, [client_id, req.user.id, message]);

    res.status(201).json(rows[0]);
}));

/**
 * DELETE /labels/notes/:id
 * Delete a note
 */
router.delete('/notes/:id', authenticate, validateParams(idParamSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;

    await pool.query('DELETE FROM notes WHERE id = $1', [id]);

    res.status(204).send();
}));

export default router;
