import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';

// Config
import pool from './config/db.js';
import { connectRedis, socketClient, socketSubClient } from './config/redis.js';

// Middleware
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './utils/logger.js';
import logger from './utils/logger.js';

// Routes
import authRoutes from './routes/auth.js';
import clientsRoutes from './routes/clients.js';
import messagesRoutes, { setSocketIO as setMessagesIO } from './routes/messages.js';
import teamsRoutes, { setSocketIO as setTeamsIO } from './routes/teams.js';
import eventsRoutes from './routes/events.js';
import vehiclesRoutes from './routes/vehicles.js';
import labelsRoutes from './routes/labels.js';
import uploadRoutes from './routes/upload.js';
import healthRoutes from './routes/health.js';

// Socket handlers
import { setupSocketHandlers } from './socket/handlers.js';

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

async function startServer() {
    try {
        // Connect to Redis (optional)
        const redisConnected = await connectRedis();

        // Test PostgreSQL connection
        try {
            await pool.query('SELECT 1');
            logger.info('📦 PostgreSQL connected');
        } catch (dbError) {
            logger.warn('⚠️ PostgreSQL not available - some features will fail');
            logger.warn('   Error: ' + dbError.message);
        }

        // Create Express app
        const app = express();
        const httpServer = createServer(app);

        // Create Socket.io server
        const io = new Server(httpServer, {
            cors: {
                origin: CORS_ORIGIN.split(','),
                methods: ['GET', 'POST'],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });

        // Use Redis adapter for Socket.io if Redis is connected
        if (redisConnected && socketClient && socketSubClient) {
            try {
                const { createAdapter } = await import('@socket.io/redis-adapter');
                io.adapter(createAdapter(socketClient, socketSubClient));
                logger.info('📡 Socket.io using Redis adapter');
            } catch {
                logger.warn('📡 Socket.io using in-memory adapter');
            }
        } else {
            logger.info('📡 Socket.io using in-memory adapter (single instance only)');
        }

        // Pass io to routes that need it
        setMessagesIO(io);
        setTeamsIO(io);

        // Setup socket handlers
        setupSocketHandlers(io);

        // Middleware
        app.use(helmet({
            contentSecurityPolicy: false // Disable for API
        }));

        app.use(cors({
            origin: CORS_ORIGIN.split(','),
            credentials: true
        }));

        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true }));

        // Request logging
        app.use(requestLogger);

        // Rate limiting (skip health checks)
        app.use((req, res, next) => {
            if (req.path.startsWith('/health')) {
                return next();
            }
            apiLimiter(req, res, next);
        });

        // Routes
        app.use('/auth', authRoutes);
        app.use('/clients', clientsRoutes);
        app.use('/messages', messagesRoutes);
        app.use('/teams', teamsRoutes);
        app.use('/events', eventsRoutes);
        app.use('/vehicles', vehiclesRoutes);
        app.use('/labels', labelsRoutes);
        app.use('/upload', uploadRoutes);
        app.use('/health', healthRoutes);

        // Root route
        app.get('/', (req, res) => {
            res.json({
                name: 'Concesionaria API',
                version: '1.0.0',
                status: 'running',
                redis: redisConnected ? 'connected' : 'in-memory'
            });
        });

        // Error handlers
        app.use(notFoundHandler);
        app.use(errorHandler);

        // Graceful shutdown
        const shutdown = async (signal) => {
            logger.info(`${signal} received, shutting down gracefully...`);

            httpServer.close(() => {
                logger.info('HTTP server closed');
            });

            io.close(() => {
                logger.info('Socket.io closed');
            });

            await pool.end();
            logger.info('PostgreSQL pool closed');

            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // Start server
        httpServer.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`📡 Socket.io ready`);
            logger.info(`🔒 CORS enabled for: ${CORS_ORIGIN}`);
        });

    } catch (err) {
        logger.error('Failed to start server', { error: err.message, stack: err.stack });
        process.exit(1);
    }
}

startServer();
