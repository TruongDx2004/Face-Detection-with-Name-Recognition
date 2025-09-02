const { ERROR_MESSAGES } = require('../config/constants');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            error: ERROR_MESSAGES.VALIDATION_ERROR,
            details: errors
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: ERROR_MESSAGES.UNAUTHORIZED,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: ERROR_MESSAGES.UNAUTHORIZED,
            message: 'Token expired'
        });
    }

    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: 'File too large',
            message: 'File size exceeds the allowed limit'
        });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            error: 'Invalid file field',
            message: 'Unexpected file field'
        });
    }

    // Database errors
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            error: 'Duplicate entry',
            message: 'Resource already exists'
        });
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            error: 'Invalid reference',
            message: 'Referenced resource does not exist'
        });
    }

    // Custom application errors
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            error: err.message || ERROR_MESSAGES.INTERNAL_ERROR
        });
    }

    // Default error
    res.status(500).json({
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
};

// 404 handler
const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: ERROR_MESSAGES.NOT_FOUND,
        message: `Route ${req.originalUrl} not found`
    });
};

// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler
};