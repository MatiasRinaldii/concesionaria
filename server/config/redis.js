import { createClient } from 'redis';

const useRedis = process.env.REDIS_SESSIONS_URL || process.env.REDIS_CACHE_URL;

// Redis clients - only created if Redis is configured
let sessionClient = null;
let cacheClient = null;
let socketClient = null;
let socketSubClient = null;

if (useRedis) {
    // DB 0 - Sessions (JWT refresh tokens)
    sessionClient = createClient({
        url: process.env.REDIS_SESSIONS_URL || 'redis://localhost:6379/0'
    });

    // DB 1 - Cache (labels, users, event_types) + Rate Limiting
    cacheClient = createClient({
        url: process.env.REDIS_CACHE_URL || 'redis://localhost:6379/1'
    });

    // DB 2 - Socket.io adapter
    socketClient = createClient({
        url: process.env.REDIS_SOCKET_URL || 'redis://localhost:6379/2'
    });

    // Duplicate for Socket.io pub/sub
    socketSubClient = socketClient.duplicate();

    // Error handlers
    sessionClient.on('error', (err) => console.error('Redis Session Error:', err));
    cacheClient.on('error', (err) => console.error('Redis Cache Error:', err));
    socketClient.on('error', (err) => console.error('Redis Socket Error:', err));
}

export { sessionClient, cacheClient, socketClient, socketSubClient };

// Connect all clients
export async function connectRedis() {
    if (!useRedis) {
        console.log('⚠️ Redis not configured - using in-memory fallbacks');
        return false;
    }

    try {
        await Promise.all([
            sessionClient.connect(),
            cacheClient.connect(),
            socketClient.connect(),
            socketSubClient.connect()
        ]);
        console.log('🔴 Redis connected (DB 0, 1, 2)');
        return true;
    } catch (err) {
        console.error('❌ Redis connection error:', err);
        console.log('⚠️ Falling back to in-memory storage');
        return false;
    }
}

// In-memory cache fallback
const memoryCache = new Map();
const memorySessions = new Map();

// Cache helpers with fallback
export const cache = {
    async get(key) {
        if (cacheClient?.isReady) {
            const data = await cacheClient.get(key);
            return data ? JSON.parse(data) : null;
        }
        // In-memory fallback
        const item = memoryCache.get(key);
        if (item && item.expires > Date.now()) {
            return item.value;
        }
        memoryCache.delete(key);
        return null;
    },

    async set(key, value, ttlSeconds = 3600) {
        if (cacheClient?.isReady) {
            await cacheClient.setEx(key, ttlSeconds, JSON.stringify(value));
        } else {
            // In-memory fallback
            memoryCache.set(key, {
                value,
                expires: Date.now() + (ttlSeconds * 1000)
            });
        }
    },

    async del(key) {
        if (cacheClient?.isReady) {
            await cacheClient.del(key);
        } else {
            memoryCache.delete(key);
        }
    },

    async invalidatePattern(pattern) {
        if (cacheClient?.isReady) {
            const keys = await cacheClient.keys(pattern);
            if (keys.length > 0) {
                await cacheClient.del(keys);
            }
        } else {
            // Simple pattern matching for in-memory
            const regex = new RegExp(pattern.replace('*', '.*'));
            for (const key of memoryCache.keys()) {
                if (regex.test(key)) {
                    memoryCache.delete(key);
                }
            }
        }
    }
};

// Session helpers with fallback
export const sessions = {
    async setRefreshToken(userId, tokenHash, ttlSeconds = 604800) {
        if (sessionClient?.isReady) {
            await sessionClient.setEx(`refresh:${userId}:${tokenHash}`, ttlSeconds, 'valid');
        } else {
            memorySessions.set(`refresh:${userId}:${tokenHash}`, {
                value: 'valid',
                expires: Date.now() + (ttlSeconds * 1000)
            });
        }
    },

    async validateRefreshToken(userId, tokenHash) {
        const key = `refresh:${userId}:${tokenHash}`;
        if (sessionClient?.isReady) {
            return await sessionClient.get(key) === 'valid';
        }
        const item = memorySessions.get(key);
        if (item && item.expires > Date.now()) {
            return item.value === 'valid';
        }
        memorySessions.delete(key);
        return false;
    },

    async revokeRefreshToken(userId, tokenHash) {
        const key = `refresh:${userId}:${tokenHash}`;
        if (sessionClient?.isReady) {
            await sessionClient.del(key);
        } else {
            memorySessions.delete(key);
        }
    },

    async revokeAllUserSessions(userId) {
        if (sessionClient?.isReady) {
            const keys = await sessionClient.keys(`refresh:${userId}:*`);
            if (keys.length > 0) {
                await sessionClient.del(keys);
            }
        } else {
            const prefix = `refresh:${userId}:`;
            for (const key of memorySessions.keys()) {
                if (key.startsWith(prefix)) {
                    memorySessions.delete(key);
                }
            }
        }
    }
};
