import { ZodError } from 'zod';
import logger from '../utils/logger.js';

/**
 * Validation middleware factory
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} source - Where to get data from
 */
export const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        try {
            const data = schema.parse(req[source]);
            req[source] = data; // Replace with parsed/transformed data
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                const errors = err.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }));

                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors
                });
            }

            logger.error('Validation error', { error: err.message });
            return res.status(400).json({ error: 'Invalid request data' });
        }
    };
};

/**
 * Validate request body
 */
export const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate query parameters
 */
export const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate URL parameters
 */
export const validateParams = (schema) => validate(schema, 'params');
