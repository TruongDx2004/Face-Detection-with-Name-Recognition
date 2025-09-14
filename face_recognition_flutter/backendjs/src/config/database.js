const mysql = require('mysql2/promise');
const { DATABASE } = require('./constants');
const { logger } = require('../middleware/logger');

// Cấu hình database
const dbConfig = {
    host: DATABASE.HOST,
    port: DATABASE.PORT,
    user: DATABASE.USER,
    password: DATABASE.PASSWORD,
    database: DATABASE.NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '+00:00', // Force UTC to prevent timezone issues
    dateStrings: true   // Return dates as strings to prevent auto conversion
};

// Tạo connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        logger.info('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        logger.error('❌ Database connection failed:', error);
        return false;
    }
};

// Initialize database connection
const initDatabase = async () => {
    const isConnected = await testConnection();
    if (!isConnected) {
        logger.error('Failed to connect to database. Exiting...');
        process.exit(1);
    }
};

// Graceful shutdown
const closeDatabase = async () => {
    try {
        await pool.end();
        logger.info('Database connection pool closed');
    } catch (error) {
        logger.error('Error closing database connection:', error);
    }
};

// Handle database errors
pool.on('connection', (connection) => {
    logger.info(`New database connection established as id ${connection.threadId}`);
});

pool.on('error', (err) => {
    logger.error('Database pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        logger.info('Attempting to reconnect to database...');
    } else {
        throw err;
    }
});

module.exports = {
    pool,
    testConnection,
    initDatabase,
    closeDatabase
};


module.exports = pool;