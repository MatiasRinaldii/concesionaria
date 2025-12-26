import { io } from 'socket.io-client';

// Socket.io now runs on the same origin as Next.js
// No need for separate WS_URL - connects to same server

let socket = null;
let connectionPromise = null;

/**
 * Get or create Socket.io connection
 */
export const getSocket = () => {
    if (socket?.connected) {
        return socket;
    }

    // Connect to same origin (unified Next.js + Socket.io server)
    socket = io({
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        autoConnect: false
    });

    socket.on('connect', () => {
        console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
    });

    return socket;
};

/**
 * Connect to socket (called after login)
 */
export const connectSocket = () => {
    if (connectionPromise) return connectionPromise;

    connectionPromise = new Promise((resolve) => {
        const s = getSocket();
        if (!s) {
            resolve(null);
            return;
        }

        if (s.connected) {
            resolve(s);
            return;
        }

        s.connect();
        s.once('connect', () => resolve(s));
        s.once('connect_error', () => resolve(null));
    });

    return connectionPromise;
};

/**
 * Disconnect socket (called on logout)
 */
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    connectionPromise = null;
};

/**
 * Join a client chat room
 */
export const joinClientRoom = (clientId) => {
    const s = getSocket();
    if (s) {
        s.emit('join_client', clientId);
    }
};

/**
 * Leave a client chat room
 */
export const leaveClientRoom = (clientId) => {
    const s = getSocket();
    if (s) {
        s.emit('leave_client', clientId);
    }
};

/**
 * Join a team chat room
 */
export const joinTeamRoom = (teamId) => {
    const s = getSocket();
    if (s) {
        s.emit('join_team', teamId);
    }
};

/**
 * Leave a team chat room
 */
export const leaveTeamRoom = (teamId) => {
    const s = getSocket();
    if (s) {
        s.emit('leave_team', teamId);
    }
};

/**
 * Emit typing started
 */
export const startTyping = (clientId) => {
    const s = getSocket();
    if (s) {
        s.emit('typing_start', { clientId });
    }
};

/**
 * Emit typing stopped
 */
export const stopTyping = (clientId) => {
    const s = getSocket();
    if (s) {
        s.emit('typing_stop', { clientId });
    }
};

/**
 * Emit team typing started
 */
export const startTeamTyping = (teamId) => {
    const s = getSocket();
    if (s) {
        s.emit('team_typing_start', { teamId });
    }
};

/**
 * Emit team typing stopped
 */
export const stopTeamTyping = (teamId) => {
    const s = getSocket();
    if (s) {
        s.emit('team_typing_stop', { teamId });
    }
};

/**
 * Subscribe to new messages for a client
 */
export const onNewMessage = (callback) => {
    const s = getSocket();
    if (s) {
        s.on('new_message', callback);
        return () => s.off('new_message', callback);
    }
    return () => { };
};

/**
 * Subscribe to team messages
 */
export const onTeamMessage = (callback) => {
    const s = getSocket();
    if (s) {
        s.on('team_message', callback);
        return () => s.off('team_message', callback);
    }
    return () => { };
};

/**
 * Subscribe to typing events
 */
export const onUserTyping = (callback) => {
    const s = getSocket();
    if (s) {
        s.on('user_typing', callback);
        return () => s.off('user_typing', callback);
    }
    return () => { };
};

/**
 * Subscribe to stopped typing events
 */
export const onUserStoppedTyping = (callback) => {
    const s = getSocket();
    if (s) {
        s.on('user_stopped_typing', callback);
        return () => s.off('user_stopped_typing', callback);
    }
    return () => { };
};

export default {
    getSocket,
    connectSocket,
    disconnectSocket,
    joinClientRoom,
    leaveClientRoom,
    joinTeamRoom,
    leaveTeamRoom,
    startTyping,
    stopTyping,
    startTeamTyping,
    stopTeamTyping,
    onNewMessage,
    onTeamMessage,
    onUserTyping,
    onUserStoppedTyping
};
