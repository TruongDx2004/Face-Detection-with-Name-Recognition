const Joi = require('joi');
const { UserRole } = require('../config/constants');

// Validation schemas
const schemas = {
    login: Joi.object({
        username: Joi.string().alphanum().min(3).max(50).required(),
        password: Joi.string().min(6).required()
    }),

    createUser: Joi.object({
        username: Joi.string().alphanum().min(3).max(50).required(),
        password: Joi.string().min(6).required(),
        full_name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().max(100).required(),
        role: Joi.string().valid(...Object.values(UserRole)).required(),
        student_id: Joi.when('role', {
            is: UserRole.STUDENT,
            then: Joi.string().max(20).required(),
            otherwise: Joi.string().max(20).optional()
        }),
        class_name: Joi.when('role', {
            is: UserRole.STUDENT,
            then: Joi.string().max(50).required(),
            otherwise: Joi.string().max(50).optional()
        })
    }),

    updateUser: Joi.object({
        username: Joi.string().alphanum().min(3).max(50).optional(),
        full_name: Joi.string().min(2).max(100).optional(),
        email: Joi.string().email().max(100).optional(),
        role: Joi.string().valid(...Object.values(UserRole)).optional(),
        student_id: Joi.string().max(20).optional(),
        class_name: Joi.string().max(50).optional(),
        is_active: Joi.boolean().optional()
    }),

    createSession: Joi.object({
        subject: Joi.string().min(2).max(100).required(),
        class_name: Joi.string().min(1).max(50).required(),
        start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
    }),

    registerFace: Joi.object({
        user_id: Joi.number().integer().positive().required(),
        images: Joi.array().items(
            Joi.string().required() // Base64 encoded images
        ).min(1).max(10).required()
    }),

    attendance: Joi.object({
        user_id: Joi.number().integer().positive().required(),
        session_id: Joi.number().integer().positive().required(),
        image_data: Joi.string().required() // Base64 encoded image
    })
};

// Generic validation middleware factory
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const data = req[source];
        const { error, value } = schema.validate(data, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Validation failed',
                details
            });
        }

        // Replace the original data with validated data
        req[source] = value;
        next();
    };
};

// Specific validation middlewares
const validateLogin = validate(schemas.login);
const validateCreateUser = validate(schemas.createUser);
const validateUpdateUser = validate(schemas.updateUser);
const validateCreateSession = validate(schemas.createSession);
const validateRegisterFace = validate(schemas.registerFace);
const validateAttendance = validate(schemas.attendance);

// Custom validation for query parameters
const validatePagination = (req, res, next) => {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
            error: 'Page must be a positive integer'
        });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
            error: 'Limit must be between 1 and 100'
        });
    }

    req.query.page = pageNum;
    req.query.limit = limitNum;
    next();
};

// Validate image format for face recognition
const validateImageFormat = (req, res, next) => {
    const { image_data, images } = req.body;

    const validateBase64Image = (imageData) => {
        if (!imageData || typeof imageData !== 'string') {
            return false;
        }

        // Check if it's a valid base64 image format
        const base64Regex = /^data:image\/(jpeg|jpg|png|gif);base64,/;
        return base64Regex.test(imageData);
    };

    // For single image
    if (image_data && !validateBase64Image(image_data)) {
        return res.status(400).json({
            error: 'Invalid image format. Must be base64 encoded image.'
        });
    }

    // For multiple images
    if (images && Array.isArray(images)) {
        for (let i = 0; i < images.length; i++) {
            if (!validateBase64Image(images[i])) {
                return res.status(400).json({
                    error: `Invalid image format at index ${i}. Must be base64 encoded image.`
                });
            }
        }
    }

    next();
};

// Validate date range
const validateDateRange = (req, res, next) => {
    const { start_date, end_date } = req.query;

    if (start_date && !Date.parse(start_date)) {
        return res.status(400).json({
            error: 'Invalid start_date format. Use YYYY-MM-DD'
        });
    }

    if (end_date && !Date.parse(end_date)) {
        return res.status(400).json({
            error: 'Invalid end_date format. Use YYYY-MM-DD'
        });
    }

    if (start_date && end_date) {
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (startDate > endDate) {
            return res.status(400).json({
                error: 'start_date must be before or equal to end_date'
            });
        }

        // Check if date range is not too large (max 1 year)
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 365) {
            return res.status(400).json({
                error: 'Date range cannot exceed 365 days'
            });
        }
    }

    next();
};

// Validate user role permissions
const validateRolePermissions = (req, res, next) => {
    const { role } = req.body;

    if (!role) {
        return next();
    }

    // Only admins can create admin users
    if (role === UserRole.ADMIN && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({
            error: 'Only administrators can create admin users'
        });
    }

    next();
};

// Validate file upload
const validateFileUpload = (req, res, next) => {
    if (!req.file && !req.files) {
        return res.status(400).json({
            error: 'No file uploaded'
        });
    }

    const file = req.file || (req.files && req.files[0]);
    
    if (!file) {
        return res.status(400).json({
            error: 'Invalid file'
        });
    }

    // Check file size (max 10MB)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB
    if (file.size > maxSize) {
        return res.status(400).json({
            error: `File size too large. Maximum size is ${maxSize / 1048576}MB`
        });
    }

    // Check file type for images
    const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/jpg').split(',');
    if (file.mimetype && !allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
            error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        });
    }

    next();
};

// Validate session ownership
const validateSessionOwnership = async (req, res, next) => {
    try {
        const { session_id } = req.params;
        const { AttendanceSession } = require('../config/database');

        if (!session_id) {
            return res.status(400).json({
                error: 'Session ID is required'
            });
        }

        const session = await AttendanceSession.findByPk(session_id);
        
        if (!session) {
            return res.status(404).json({
                error: 'Session not found'
            });
        }

        // Check if user owns the session or is admin
        if (req.user.role !== UserRole.ADMIN && session.teacher_id !== req.user.id) {
            return res.status(403).json({
                error: 'Access denied. You can only access your own sessions.'
            });
        }

        req.session = session;
        next();

    } catch (error) {
        console.error('Session ownership validation error:', error);
        return res.status(500).json({
            error: 'Error validating session ownership'
        });
    }
};

// Validate bulk import data
const validateBulkImport = (req, res, next) => {
    const { users } = req.body;

    if (!users || !Array.isArray(users)) {
        return res.status(400).json({
            error: 'Users array is required'
        });
    }

    if (users.length === 0) {
        return res.status(400).json({
            error: 'Users array cannot be empty'
        });
    }

    if (users.length > 1000) {
        return res.status(400).json({
            error: 'Cannot import more than 1000 users at once'
        });
    }

    // Validate each user object has required fields
    const requiredFields = ['username', 'password', 'full_name', 'email', 'role'];
    
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        
        for (const field of requiredFields) {
            if (!user[field]) {
                return res.status(400).json({
                    error: `Missing required field '${field}' in user at index ${i}`
                });
            }
        }

        // Validate role
        if (!Object.values(UserRole).includes(user.role)) {
            return res.status(400).json({
                error: `Invalid role '${user.role}' in user at index ${i}`
            });
        }

        // Validate student-specific fields
        if (user.role === UserRole.STUDENT) {
            if (!user.student_id || !user.class_name) {
                return res.status(400).json({
                    error: `Student users must have student_id and class_name at index ${i}`
                });
            }
        }
    }

    next();
};

// Validate password strength
const validatePasswordStrength = (req, res, next) => {
    const { password, new_password } = req.body;
    const passwordToCheck = new_password || password;

    if (!passwordToCheck) {
        return next();
    }

    // Password strength requirements
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(passwordToCheck);
    const hasLowerCase = /[a-z]/.test(passwordToCheck);
    const hasNumbers = /\d/.test(passwordToCheck);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordToCheck);

    const errors = [];

    if (passwordToCheck.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (!hasUpperCase) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!hasLowerCase) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!hasNumbers) {
        errors.push('Password must contain at least one number');
    }

    if (!hasSpecialChar) {
        errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Password does not meet requirements',
            details: errors
        });
    }

    next();
};

// Sanitize input to prevent XSS
const sanitizeInput = (req, res, next) => {
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        
        return str
            .replace(/[<>]/g, '') // Remove < and >
            .trim();
    };

    const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'string') {
                    obj[key] = sanitizeString(obj[key]);
                } else if (typeof obj[key] === 'object') {
                    obj[key] = sanitizeObject(obj[key]);
                }
            }
        }
        
        return obj;
    };

    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);

    next();
};

module.exports = {
    validate,
    validateLogin,
    validateCreateUser,
    validateUpdateUser,
    validateCreateSession,
    validateRegisterFace,
    validateAttendance,
    validatePagination,
    validateImageFormat,
    validateDateRange,
    validateRolePermissions,
    validateFileUpload,
    validateSessionOwnership,
    validateBulkImport,
    validatePasswordStrength,
    sanitizeInput,
    schemas
};