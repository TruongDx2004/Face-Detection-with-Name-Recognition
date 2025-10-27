require('dotenv').config();

const http = require('http');
const App = require('./config/app');
const { SERVER } = require('./config/constants');
const { logger } = require('./middleware/logger');
const { initSocket } = require('./services/socket'); // Import socket init function

// Khởi tạo Express app
const appInstance = new App();
const app = appInstance.getApp();

const PORT = SERVER.PORT || 3000;

// ⚙️ Tạo HTTP server từ app (thay vì app.listen trực tiếp)
const server = http.createServer(app);

// ⚡ Khởi tạo Socket.IO
initSocket(server);

// 🚀 Khởi động server
server.listen(PORT, () => {
    logger.info(`🚀 Server is running on http://localhost:${PORT}`);
    logger.info(`📚 API Documentation: http://localhost:${PORT}/docs`);
    logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
    logger.info(`🌍 Environment: ${SERVER.NODE_ENV}`);
});

// 🧹 Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

// ⚠️ Xử lý lỗi promise / exception
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

module.exports = app;
