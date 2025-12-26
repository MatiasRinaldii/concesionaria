import logger from '../utils/logger.js';

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        userId: req.user?.id
    });

    // PostgreSQL errors
    if (err.code) {
        switch (err.code) {
            case '23505': // Unique violation
                return res.status(409).json({ error: 'Resource already exists' });
            case '23503': // Foreign key violation
                return res.status(400).json({ error: 'Referenced resource not found' });
            case '22P02': // Invalid UUID
                return res.status(400).json({ error: 'Invalid ID format' });
            default:
                break;
        }
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    res.status(statusCode).json({ error: message });
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req, res) => {
    res.status(404).json({ error: 'Route not found' });
};

/**
 * Async wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
