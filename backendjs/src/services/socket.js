const { Server } = require('socket.io');
const { logger } = require('../middleware/logger');

let io;

function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        logger.info(`✅ Client connected: ${socket.id}`);

        socket.on('join_session', ({ sessionId }) => {
            socket.join(`session_${sessionId}`);
            logger.info(`📚 Client ${socket.id} joined room session_${sessionId}`);
        });

        socket.on('disconnect', () => {
            logger.info(`❌ Client disconnected: ${socket.id}`);
        });
    });

    return io;
}

function getIO() {
    if (!io) throw new Error('Socket.io not initialized!');
    return io;
}

module.exports = { initSocket, getIO };
