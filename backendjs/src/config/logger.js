const winston = require('winston');
const path = require('path');
const config = require('./app');

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync(config.paths.logs)) {
    fs.mkdirSync(config.paths.logs, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} [${level}]: ${stack || message}`;
    })
);

// Create logger
const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'face-attendance-api' },
    transports: [
        // Error log
        new winston.transports.File({
            filename: path.join(config.paths.logs, 'error.log'),
            level: 'error',
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles
        }),
        // Combined log
        new winston.transports.File({
            filename: path.join(config.paths.logs, 'combined.log'),
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles
        })
    ]
});

// Add console transport in development
if (config.isDevelopment) {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Stream for Morgan HTTP logging
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

module.exports = logger;
