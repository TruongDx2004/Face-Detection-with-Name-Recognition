require('dotenv').config();

const App = require('./config/app');
const { SERVER } = require('./config/constants');
const { logger } = require('./middleware/logger');

// Tạo app instance
const appInstance = new App();
const app = appInstance.getApp();

const PORT = SERVER.PORT;

// Khởi động server
const server = app.listen(PORT, () => {
    logger.info(`🚀 Server is running on http://localhost:${PORT}`);
    logger.info(`📚 API Documentation: http://localhost:${PORT}/docs`);
    logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
    logger.info(`🌍 Environment: ${SERVER.NODE_ENV}`);
});

// Graceful shutdown
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

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

module.exports = app;
