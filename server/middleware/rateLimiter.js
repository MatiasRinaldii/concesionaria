import rateLimit from 'express-rate-limit';

// Redis store is optional - only use if Redis is configured
let RedisStore = null;
let cacheClient = null;

const useRedis = process.env.REDIS_CACHE_URL;

if (useRedis) {
    try {
        const redisModule = await import('rate-limit-redis');
        RedisStore = redisModule.default;
        const redisConfig = await import('../config/redis.js');
        cacheClient = redisConfig.cacheClient;
    } catch (e) {
        console.warn('Redis not available, using in-memory rate limiting');
    }
}

/**
 * Create rate limiter with optional Redis store
 */
const createLimiter = (options) => {
    const config = {
        windowMs: options.windowMs,
        max: options.max,
        message: options.message,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: options.keyGenerator,
        skipSuccessfulRequests: options.skipSuccessfulRequests || false
    };

    // Use Redis store if available
    if (RedisStore && cacheClient) {
        config.store = new RedisStore({
            sendCommand: (...args) => cacheClient.sendCommand(args),
            prefix: options.prefix
        });
    }

    return rateLimit(config);
};

/**
 * General API rate limiter
 * 100 requests per minute per IP/user
 */
export const apiLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later' },
    keyGenerator: (req) => req.user?.id || req.ip,
    prefix: 'rl:api:'
});

/**
 * Strict rate limiter for auth endpoints
 * 5 attempts per 15 minutes per IP
 */
export const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts, please try again in 15 minutes' },
    keyGenerator: (req) => req.ip,
    skipSuccessfulRequests: true,
    prefix: 'rl:auth:'
});

/**
 * Upload rate limiter
 * 20 uploads per hour per user
 */
export const uploadLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: { error: 'Upload limit reached, please try again later' },
    keyGenerator: (req) => req.user?.id || req.ip,
    prefix: 'rl:upload:'
});

/**
 * Message sending rate limiter
 * 30 messages per minute per user
 */
export const messageLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Message limit reached, please slow down' },
    keyGenerator: (req) => req.user?.id || req.ip,
    prefix: 'rl:msg:'
});
