const Joi = require('joi');

const courseSectionValidator = {
    create: (req, res, next) => {
        const schema = Joi.object({
            name: Joi.string()
                .min(3)
                .max(100)
                .required()
                .messages({
                    'string.empty': 'Course section name is required',
                    'string.min': 'Course section name must be at least 3 characters',
                    'string.max': 'Course section name must not exceed 100 characters'
                }),
            
            code: Joi.string()
                .min(3)
                .max(20)
                .pattern(/^[A-Z0-9_]+$/)
                .required()
                .messages({
                    'string.empty': 'Course section code is required',
                    'string.min': 'Course section code must be at least 3 characters',
                    'string.max': 'Course section code must not exceed 20 characters',
                    'string.pattern.base': 'Course section code must contain only uppercase letters, numbers, and underscores'
                }),
            
            class_id: Joi.number()
                .integer()
                .positive()
                .required()
                .messages({
                    'number.base': 'Class ID must be a number',
                    'number.integer': 'Class ID must be an integer',
                    'number.positive': 'Class ID must be positive',
                    'any.required': 'Class ID is required'
                }),
            
            subject_id: Joi.number()
                .integer()
                .positive()
                .required()
                .messages({
                    'number.base': 'Subject ID must be a number',
                    'number.integer': 'Subject ID must be an integer',
                    'number.positive': 'Subject ID must be positive',
                    'any.required': 'Subject ID is required'
                }),
            
            teacher_id: Joi.number()
                .integer()
                .positive()
                .required()
                .messages({
                    'number.base': 'Teacher ID must be a number',
                    'number.integer': 'Teacher ID must be an integer',
                    'number.positive': 'Teacher ID must be positive',
                    'any.required': 'Teacher ID is required'
                }),
            
            semester: Joi.string()
                .valid('HK1', 'HK2', 'HK3', 'Summer')
                .required()
                .messages({
                    'any.only': 'Semester must be one of: HK1, HK2, HK3, Summer',
                    'any.required': 'Semester is required'
                }),
            
            academic_year: Joi.string()
                .pattern(/^\d{4}-\d{4}$/)
                .required()
                .messages({
                    'string.pattern.base': 'Academic year must be in format YYYY-YYYY (e.g., 2024-2025)',
                    'any.required': 'Academic year is required'
                }),
            
            max_students: Joi.number()
                .integer()
                .min(1)
                .max(200)
                .default(50)
                .messages({
                    'number.base': 'Max students must be a number',
                    'number.integer': 'Max students must be an integer',
                    'number.min': 'Max students must be at least 1',
                    'number.max': 'Max students must not exceed 200'
                }),
            
            description: Joi.string()
                .max(500)
                .allow('')
                .messages({
                    'string.max': 'Description must not exceed 500 characters'
                })
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => detail.message)
            });
        }
        next();
    },

    update: (req, res, next) => {
        const schema = Joi.object({
            name: Joi.string()
                .min(3)
                .max(100)
                .messages({
                    'string.min': 'Course section name must be at least 3 characters',
                    'string.max': 'Course section name must not exceed 100 characters'
                }),
            
            code: Joi.string()
                .min(3)
                .max(20)
                .pattern(/^[A-Z0-9_]+$/)
                .messages({
                    'string.min': 'Course section code must be at least 3 characters',
                    'string.max': 'Course section code must not exceed 20 characters',
                    'string.pattern.base': 'Course section code must contain only uppercase letters, numbers, and underscores'
                }),
            
            class_id: Joi.number()
                .integer()
                .positive()
                .messages({
                    'number.base': 'Class ID must be a number',
                    'number.integer': 'Class ID must be an integer',
                    'number.positive': 'Class ID must be positive'
                }),
            
            subject_id: Joi.number()
                .integer()
                .positive()
                .messages({
                    'number.base': 'Subject ID must be a number',
                    'number.integer': 'Subject ID must be an integer',
                    'number.positive': 'Subject ID must be positive'
                }),
            
            teacher_id: Joi.number()
                .integer()
                .positive()
                .messages({
                    'number.base': 'Teacher ID must be a number',
                    'number.integer': 'Teacher ID must be an integer',
                    'number.positive': 'Teacher ID must be positive'
                }),
            
            semester: Joi.string()
                .valid('HK1', 'HK2', 'HK3', 'Summer')
                .messages({
                    'any.only': 'Semester must be one of: HK1, HK2, HK3, Summer'
                }),
            
            academic_year: Joi.string()
                .pattern(/^\d{4}-\d{4}$/)
                .messages({
                    'string.pattern.base': 'Academic year must be in format YYYY-YYYY (e.g., 2024-2025)'
                }),
            
            max_students: Joi.number()
                .integer()
                .min(1)
                .max(200)
                .messages({
                    'number.base': 'Max students must be a number',
                    'number.integer': 'Max students must be an integer',
                    'number.min': 'Max students must be at least 1',
                    'number.max': 'Max students must not exceed 200'
                }),
            
            description: Joi.string()
                .max(500)
                .allow('')
                .messages({
                    'string.max': 'Description must not exceed 500 characters'
                }),
            
            is_active: Joi.boolean()
                .messages({
                    'boolean.base': 'Is active must be a boolean'
                })
        }).min(1).messages({
            'object.min': 'At least one field must be provided for update'
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => detail.message)
            });
        }
        next();
    }
};

module.exports = { courseSectionValidator };