import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Setup Socket.io event handlers
 * @param {import('socket.io').Server} io 
 */
export function setupSocketHandlers(io) {
    // Authentication middleware for sockets
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, JWT_SECRET);

            // Get user from database
            const { rows } = await pool.query(
                'SELECT id, email, full_name, role FROM users WHERE id = $1 AND is_active = true',
                [decoded.userId]
            );

            if (rows.length === 0) {
                return next(new Error('User not found'));
            }

            socket.user = rows[0];
            next();
        } catch (err) {
            logger.warn('Socket auth failed', { error: err.message });
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        logger.info('Socket connected', {
            userId: socket.user.id,
            socketId: socket.id
        });

        // Join user's personal room
        socket.join(`user:${socket.user.id}`);

        // Join client chat room
        socket.on('join_client', (clientId) => {
            socket.join(`client:${clientId}`);
            logger.debug('Joined client room', { clientId, userId: socket.user.id });
        });

        // Leave client chat room
        socket.on('leave_client', (clientId) => {
            socket.leave(`client:${clientId}`);
        });

        // Join team chat room
        socket.on('join_team', async (teamId) => {
            // Verify membership
            const { rows } = await pool.query(
                'SELECT 1 FROM team_users WHERE team_id = $1 AND user_id = $2',
                [teamId, socket.user.id]
            );

            if (rows.length > 0) {
                socket.join(`team:${teamId}`);
                logger.debug('Joined team room', { teamId, userId: socket.user.id });
            }
        });

        // Leave team chat room
        socket.on('leave_team', (teamId) => {
            socket.leave(`team:${teamId}`);
        });

        // Typing indicators
        socket.on('typing_start', ({ clientId }) => {
            socket.to(`client:${clientId}`).emit('user_typing', {
                userId: socket.user.id,
                userName: socket.user.full_name
            });
        });

        socket.on('typing_stop', ({ clientId }) => {
            socket.to(`client:${clientId}`).emit('user_stopped_typing', {
                userId: socket.user.id
            });
        });

        // Team typing indicators
        socket.on('team_typing_start', ({ teamId }) => {
            socket.to(`team:${teamId}`).emit('team_user_typing', {
                userId: socket.user.id,
                userName: socket.user.full_name
            });
        });

        socket.on('team_typing_stop', ({ teamId }) => {
            socket.to(`team:${teamId}`).emit('team_user_stopped_typing', {
                userId: socket.user.id
            });
        });

        // Disconnect
        socket.on('disconnect', (reason) => {
            logger.info('Socket disconnected', {
                userId: socket.user.id,
                socketId: socket.id,
                reason
            });
        });
    });
}
