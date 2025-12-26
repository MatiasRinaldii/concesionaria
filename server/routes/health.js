import { Router } from 'express';
import pool from '../config/db.js';
import { sessionClient, cacheClient, socketClient } from '../config/redis.js';

const router = Router();

/**
 * GET /health
 * Health check endpoint for load balancer
 */
router.get('/', async (req, res) => {
    const checks = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            postgres: false,
            redis_sessions: false,
            redis_cache: false,
            redis_socket: false
        }
    };

    // Check PostgreSQL
    try {
        await pool.query('SELECT 1');
        checks.services.postgres = true;
    } catch (err) {
        checks.services.postgres = err.message;
    }

    // Check Redis DB 0 (Sessions)
    try {
        await sessionClient.ping();
        checks.services.redis_sessions = true;
    } catch (err) {
        checks.services.redis_sessions = err.message;
    }

    // Check Redis DB 1 (Cache)
    try {
        await cacheClient.ping();
        checks.services.redis_cache = true;
    } catch (err) {
        checks.services.redis_cache = err.message;
    }

    // Check Redis DB 2 (Socket)
    try {
        await socketClient.ping();
        checks.services.redis_socket = true;
    } catch (err) {
        checks.services.redis_socket = err.message;
    }

    // Determine overall status
    const allHealthy = Object.values(checks.services).every(v => v === true);
    checks.status = allHealthy ? 'ok' : 'degraded';

    res.status(allHealthy ? 200 : 503).json(checks);
});

/**
 * GET /health/live
 * Kubernetes liveness probe
 */
router.get('/live', (req, res) => {
    res.status(200).json({ status: 'alive' });
});

/**
 * GET /health/ready
 * Kubernetes readiness probe
 */
router.get('/ready', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        await sessionClient.ping();
        res.status(200).json({ status: 'ready' });
    } catch {
        res.status(503).json({ status: 'not ready' });
    }
});

export default router;
