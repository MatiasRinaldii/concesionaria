import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { sessions } from '../config/redis.js';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';

/**
 * Middleware to verify JWT access token
 */
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get user from database
        const { rows } = await pool.query(
            'SELECT id, email, full_name, role, avatar_url FROM users WHERE id = $1 AND is_active = true',
            [decoded.userId]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'User not found or inactive' });
        }

        req.user = rows[0];
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        logger.error('Auth middleware error', { error: err.message });
        return res.status(500).json({ error: 'Authentication error' });
    }
};

/**
 * Optional authentication - continues if no token, sets user if valid token
 */
export const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const { rows } = await pool.query(
            'SELECT id, email, full_name, role, avatar_url FROM users WHERE id = $1 AND is_active = true',
            [decoded.userId]
        );

        if (rows.length > 0) {
            req.user = rows[0];
        }
    } catch {
        // Ignore errors, just continue without user
    }

    next();
};

/**
 * Require specific role(s)
 */
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

/**
 * Generate access and refresh tokens
 */
export const generateTokens = async (user) => {
    const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_ACCESS_EXPIRES }
    );

    const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    // Store refresh token hash in Redis
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await sessions.setRefreshToken(user.id, tokenHash);

    return { accessToken, refreshToken };
};

/**
 * Verify and validate refresh token
 */
export const verifyRefreshToken = async (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET);

        if (decoded.type !== 'refresh') {
            return null;
        }

        // Verify token exists in Redis
        const crypto = await import('crypto');
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const isValid = await sessions.validateRefreshToken(decoded.userId, tokenHash);

        if (!isValid) {
            return null;
        }

        return decoded;
    } catch {
        return null;
    }
};

/**
 * Revoke a refresh token
 */
export const revokeRefreshToken = async (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET, { ignoreExpiration: true });
        const crypto = await import('crypto');
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await sessions.revokeRefreshToken(decoded.userId, tokenHash);
    } catch {
        // Ignore errors
    }
};
