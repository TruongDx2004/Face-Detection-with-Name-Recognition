/**
 * Helper functions để chuẩn hóa response format
 */

class ResponseHelper {
    /**
     * Success response
     * @param {Object} res - Express response object
     * @param {*} data - Data to send
     * @param {string} message - Success message
     * @param {number} statusCode - HTTP status code
     */
    static success(res, data = null, message = 'Success', statusCode = 200) {
        const response = {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        };

        return res.status(statusCode).json(response);
    }

    /**
     * Error response
     * @param {Object} res - Express response object
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {*} errors - Detailed errors
     */
    static error(res, message = 'Error', statusCode = 500, errors = null) {
        const response = {
            success: false,
            message,
            errors,
            timestamp: new Date().toISOString()
        };

        return res.status(statusCode).json(response);
    }

    /**
     * Validation error response
     * @param {Object} res - Express response object
     * @param {*} errors - Validation errors
     */
    static validationError(res, errors) {
        return this.error(res, 'Validation failed', 400, errors);
    }

    /**
     * Unauthorized response
     * @param {Object} res - Express response object
     * @param {string} message - Error message
     */
    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, message, 401);
    }

    /**
     * Forbidden response
     * @param {Object} res - Express response object
     * @param {string} message - Error message
     */
    static forbidden(res, message = 'Forbidden') {
        return this.error(res, message, 403);
    }

    /**
     * Not found response
     * @param {Object} res - Express response object
     * @param {string} message - Error message
     */
    static notFound(res, message = 'Tính năng đang được phát triển') {
        return this.error(res, message, 404);
    }

    /**
     * Conflict response
     * @param {Object} res - Express response object
     * @param {string} message - Error message
     */
    static conflict(res, message = 'Resource already exists') {
        return this.error(res, message, 409);
    }

    /**
     * Paginated response
     * @param {Object} res - Express response object
     * @param {Array} data - Array of data
     * @param {Object} pagination - Pagination info
     * @param {string} message - Success message
     */
    static paginated(res, data, pagination, message = 'Success') {
        const response = {
            success: true,
            message,
            data,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: pagination.totalPages,
                hasNext: pagination.page < pagination.totalPages,
                hasPrev: pagination.page > 1
            },
            timestamp: new Date().toISOString()
        };

        return res.status(200).json(response);
    }

    /**
     * Created response
     * @param {Object} res - Express response object
     * @param {*} data - Created data
     * @param {string} message - Success message
     */
    static created(res, data, message = 'Created successfully') {
        return this.success(res, data, message, 201);
    }

    /**
     * No content response
     * @param {Object} res - Express response object
     */
    static noContent(res) {
        return res.status(204).send();
    }
}

module.exports = ResponseHelper;