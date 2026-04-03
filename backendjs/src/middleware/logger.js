const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Tạo thư mục logs nếu chưa có
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Tạo write stream cho access log
const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'),
    { flags: 'a' }
);

// Tạo write stream cho error log
const errorLogStream = fs.createWriteStream(
    path.join(logsDir, 'error.log'),
    { flags: 'a' }
);

// Custom morgan format
const customFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Morgan middleware cho access logs
const accessLogger = morgan(customFormat, {
    stream: accessLogStream,
    skip: (req, res) => res.statusCode >= 400 // Chỉ log successful requests
});

// Morgan middleware cho error logs
const errorLogger = morgan(customFormat, {
    stream: errorLogStream,
    skip: (req, res) => res.statusCode < 400 // Chỉ log error requests
});

// Console logger cho development
const consoleLogger = morgan('dev');

// Custom logger function
const logger = {
    info: (message, meta = {}) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message,
            ...meta
        };
        console.log(JSON.stringify(logEntry));
    },

    error: (message, error = null, meta = {}) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            message,
            error: error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : null,
            ...meta
        };
        console.error(JSON.stringify(logEntry));
        
        // Ghi vào file error log
        errorLogStream.write(JSON.stringify(logEntry) + '\n');
    },

    warn: (message, meta = {}) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: 'WARN',
            message,
            ...meta
        };
        console.warn(JSON.stringify(logEntry));
    },

    debug: (message, meta = {}) => {
        if (process.env.NODE_ENV === 'development') {
            const logEntry = {
                timestamp: new Date().toISOString(),
                level: 'DEBUG',
                message,
                ...meta
            };
            console.log(JSON.stringify(logEntry));
        }
    }
};

module.exports = {
    accessLogger,
    errorLogger,
    consoleLogger,
    logger
};