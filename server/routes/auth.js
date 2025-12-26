import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { authenticate, generateTokens, verifyRefreshToken, revokeRefreshToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, registerSchema, refreshTokenSchema } from '../schemas/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sessions } from '../config/redis.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * POST /auth/login
 * Authenticate user and return tokens
 */
router.post('/login', authLimiter, validateBody(loginSchema), asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const { rows } = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email.toLowerCase()]
    );

    if (rows.length === 0) {
        logger.warn('Login failed - user not found', { email });
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
        logger.warn('Login failed - invalid password', { email });
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
    );

    // Generate tokens
    const tokens = await generateTokens(user);

    logger.info('User logged in', { userId: user.id, email: user.email });

    res.json({
        user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            avatar_url: user.avatar_url
        },
        ...tokens
    });
}));

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', authLimiter, validateBody(registerSchema), asyncHandler(async (req, res) => {
    const { email, password, full_name } = req.body;

    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const { rows } = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES ($1, $2, $3, 'agent')
         RETURNING id, email, full_name, role, avatar_url`,
        [email.toLowerCase(), password_hash, full_name]
    );

    const user = rows[0];

    // Generate tokens
    const tokens = await generateTokens(user);

    logger.info('User registered', { userId: user.id, email: user.email });

    res.status(201).json({
        user,
        ...tokens
    });
}));

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', validateBody(refreshTokenSchema), asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = await verifyRefreshToken(refreshToken);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Get user
    const { rows } = await pool.query(
        'SELECT id, email, full_name, role, avatar_url FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
    );

    if (rows.length === 0) {
        return res.status(401).json({ error: 'User not found or inactive' });
    }

    const user = rows[0];

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    // Generate new tokens
    const tokens = await generateTokens(user);

    res.json(tokens);
}));

/**
 * POST /auth/logout
 * Invalidate refresh token
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
    const refreshToken = req.body.refreshToken;

    if (refreshToken) {
        await revokeRefreshToken(refreshToken);
    }

    logger.info('User logged out', { userId: req.user.id });

    res.json({ message: 'Logged out successfully' });
}));

/**
 * POST /auth/logout-all
 * Invalidate all refresh tokens for user
 */
router.post('/logout-all', authenticate, asyncHandler(async (req, res) => {
    await sessions.revokeAllUserSessions(req.user.id);

    logger.info('User logged out from all devices', { userId: req.user.id });

    res.json({ message: 'Logged out from all devices' });
}));

/**
 * GET /auth/me
 * Get current user
 */
router.get('/me', authenticate, (req, res) => {
    res.json({ user: req.user });
});

/**
 * PATCH /auth/me
 * Update current user profile
 */
router.patch('/me', authenticate, asyncHandler(async (req, res) => {
    const { full_name, avatar_url } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (full_name !== undefined) {
        updates.push(`full_name = $${paramCount++}`);
        values.push(full_name);
    }
    if (avatar_url !== undefined) {
        updates.push(`avatar_url = $${paramCount++}`);
        values.push(avatar_url);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.user.id);

    const { rows } = await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} 
         RETURNING id, email, full_name, role, avatar_url`,
        values
    );

    res.json({ user: rows[0] });
}));

export default router;
