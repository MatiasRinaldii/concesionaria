import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function main() {
    await app.prepare();

    const server = createServer((req, res) => handle(req, res));

    const io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN?.split(',') || '*',
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Redis adapter for multiple instances (production only)
    if (process.env.REDIS_URL) {
        try {
            const { createClient } = await import('redis');
            const { createAdapter } = await import('@socket.io/redis-adapter');

            const pubClient = createClient({ url: process.env.REDIS_URL });
            const subClient = pubClient.duplicate();

            pubClient.on('error', (err) => console.error('Redis Pub Error:', err));
            subClient.on('error', (err) => console.error('Redis Sub Error:', err));

            await Promise.all([pubClient.connect(), subClient.connect()]);

            io.adapter(createAdapter(pubClient, subClient));
            console.log('📡 Socket.io using Redis adapter');
        } catch (err) {
            console.warn('⚠️ Redis connection failed, using in-memory adapter');
            console.warn('   Error:', err.message);
        }
    } else {
        console.log('📡 Socket.io using in-memory adapter (dev mode)');
    }

    // Socket event handlers
    io.on('connection', (socket) => {
        console.log('🔌 Client connected:', socket.id);

        // Join client chat room
        socket.on('join-client', (clientId) => {
            socket.join(`client:${clientId}`);
            console.log(`Socket ${socket.id} joined client:${clientId}`);
        });

        // Leave client chat room
        socket.on('leave-client', (clientId) => {
            socket.leave(`client:${clientId}`);
        });

        // Join team chat room
        socket.on('join-team', (teamId) => {
            socket.join(`team:${teamId}`);
            console.log(`Socket ${socket.id} joined team:${teamId}`);
        });

        // Leave team chat room
        socket.on('leave-team', (teamId) => {
            socket.leave(`team:${teamId}`);
        });

        socket.on('disconnect', (reason) => {
            console.log('🔌 Client disconnected:', socket.id, reason);
        });
    });

    // Make io available globally for API routes
    global.io = io;

    // Graceful shutdown
    const shutdown = (signal) => {
        console.log(`${signal} received, shutting down...`);
        server.close(() => {
            console.log('HTTP server closed');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    server.listen(port, () => {
        console.log(`🚀 Server running on http://${hostname}:${port}`);
        console.log(`📡 Socket.io ready`);
        console.log(`🌍 Environment: ${dev ? 'development' : 'production'}`);
    });
}

main().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
