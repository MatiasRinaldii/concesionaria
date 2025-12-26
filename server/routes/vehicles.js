import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { vehicleSchema, vehicleUpdateSchema, idParamSchema } from '../schemas/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /vehicles
 * Get all vehicles with optional filters
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const { status, make, minPrice, maxPrice, minYear, maxYear } = req.query;

    let query = 'SELECT * FROM vehicles WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (status) {
        query += ` AND status = $${paramCount++}`;
        values.push(status);
    }
    if (make) {
        query += ` AND make ILIKE $${paramCount++}`;
        values.push(`%${make}%`);
    }
    if (minPrice) {
        query += ` AND price >= $${paramCount++}`;
        values.push(parseFloat(minPrice));
    }
    if (maxPrice) {
        query += ` AND price <= $${paramCount++}`;
        values.push(parseFloat(maxPrice));
    }
    if (minYear) {
        query += ` AND year >= $${paramCount++}`;
        values.push(parseInt(minYear));
    }
    if (maxYear) {
        query += ` AND year <= $${paramCount++}`;
        values.push(parseInt(maxYear));
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, values);

    res.json(rows);
}));

/**
 * GET /vehicles/:id
 * Get single vehicle
 */
router.get('/:id', authenticate, validateParams(idParamSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { rows } = await pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);

    if (rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(rows[0]);
}));

/**
 * POST /vehicles
 * Create a new vehicle
 */
router.post('/', authenticate, validateBody(vehicleSchema), asyncHandler(async (req, res) => {
    const { make, model, year, price, mileage, color, status, description, images } = req.body;

    const { rows } = await pool.query(`
        INSERT INTO vehicles (make, model, year, price, mileage, color, status, description, images)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    `, [make, model, year, price, mileage, color, status, description, JSON.stringify(images)]);

    res.status(201).json(rows[0]);
}));

/**
 * PATCH /vehicles/:id
 * Update a vehicle
 */
router.patch('/:id', authenticate, validateParams(idParamSchema), validateBody(vehicleUpdateSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    const setClauses = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
        if (key === 'images') {
            setClauses.push(`${key} = $${paramCount++}`);
            values.push(JSON.stringify(value));
        } else {
            setClauses.push(`${key} = $${paramCount++}`);
            values.push(value);
        }
    }

    values.push(id);

    const { rows } = await pool.query(`
        UPDATE vehicles 
        SET ${setClauses.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
    `, values);

    if (rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(rows[0]);
}));

/**
 * DELETE /vehicles/:id
 * Delete a vehicle
 */
router.delete('/:id', authenticate, validateParams(idParamSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { rowCount } = await pool.query('DELETE FROM vehicles WHERE id = $1', [id]);

    if (rowCount === 0) {
        return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.status(204).send();
}));

export default router;
