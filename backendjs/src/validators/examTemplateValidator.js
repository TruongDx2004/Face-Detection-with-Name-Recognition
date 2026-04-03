const { body, param, query } = require('express-validator');

const examTemplateValidation = {
    // Validation cho tạo template mới
    create: [
        body('title')
            .notEmpty()
            .withMessage('Title is required')
            .isLength({ min: 3, max: 255 })
            .withMessage('Title must be between 3 and 255 characters'),
            
        body('description')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Description must not exceed 1000 characters'),
            
        body('subject_id')
            .notEmpty()
            .withMessage('Subject is required')
            .isInt({ min: 1 })
            .withMessage('Subject ID must be a valid positive integer'),
            
        body('difficulty_level')
            .notEmpty()
            .withMessage('Difficulty level is required')
            .isIn(['easy', 'medium', 'hard'])
            .withMessage('Difficulty level must be easy, medium, or hard'),
            
        body('duration_minutes')
            .notEmpty()
            .withMessage('Duration is required')
            .isInt({ min: 5, max: 600 })
            .withMessage('Duration must be between 5 and 600 minutes'),
            
        body('total_points')
            .notEmpty()
            .withMessage('Total points is required')
            .isFloat({ min: 0.1, max: 1000 })
            .withMessage('Total points must be between 0.1 and 1000'),
            
        body('questions')
            .isArray({ min: 1 })
            .withMessage('Questions must be an array with at least one question'),
            
        body('questions.*.id')
            .notEmpty()
            .withMessage('Question ID is required'),
            
        body('questions.*.questionText')
            .notEmpty()
            .withMessage('Question text is required')
            .isLength({ min: 3, max: 2000 })
            .withMessage('Question text must be between 3 and 2000 characters'),
            
        body('questions.*.questionType')
            .notEmpty()
            .withMessage('Question type is required')
            .isIn(['multiple_choice', 'true_false', 'short_answer'])
            .withMessage('Question type must be multiple_choice, true_false, or short_answer'),
            
        body('questions.*.points')
            .notEmpty()
            .withMessage('Question points is required')
            .isFloat({ min: 0.1, max: 100 })
            .withMessage('Question points must be between 0.1 and 100'),
            
        body('questions.*.options')
            .if(body('questions.*.questionType').equals('multiple_choice'))
            .isArray({ min: 2, max: 6 })
            .withMessage('Multiple choice questions must have 2-6 options'),
            
        body('questions.*.correctAnswer')
            .notEmpty()
            .withMessage('Correct answer is required'),
            
        body('tags')
            .optional()
            .isArray()
            .withMessage('Tags must be an array'),
            
        body('tags.*')
            .optional()
            .isLength({ min: 1, max: 50 })
            .withMessage('Each tag must be between 1 and 50 characters'),
            
        body('is_public')
            .optional()
            .isBoolean()
            .withMessage('is_public must be a boolean')
    ],

    // Validation cho cập nhật template
    update: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('Template ID must be a valid positive integer'),
            
        body('title')
            .optional()
            .isLength({ min: 3, max: 255 })
            .withMessage('Title must be between 3 and 255 characters'),
            
        body('description')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Description must not exceed 1000 characters'),
            
        body('subject_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Subject ID must be a valid positive integer'),
            
        body('difficulty_level')
            .optional()
            .isIn(['easy', 'medium', 'hard'])
            .withMessage('Difficulty level must be easy, medium, or hard'),
            
        body('duration_minutes')
            .optional()
            .isInt({ min: 5, max: 600 })
            .withMessage('Duration must be between 5 and 600 minutes'),
            
        body('total_points')
            .optional()
            .isFloat({ min: 0.1, max: 1000 })
            .withMessage('Total points must be between 0.1 and 1000'),
            
        body('questions')
            .optional()
            .isArray({ min: 1 })
            .withMessage('Questions must be an array with at least one question'),
            
        body('questions.*.id')
            .if(body('questions').exists())
            .notEmpty()
            .withMessage('Question ID is required'),
            
        body('questions.*.questionText')
            .if(body('questions').exists())
            .notEmpty()
            .withMessage('Question text is required')
            .isLength({ min: 3, max: 2000 })
            .withMessage('Question text must be between 3 and 2000 characters'),
            
        body('questions.*.questionType')
            .if(body('questions').exists())
            .notEmpty()
            .withMessage('Question type is required')
            .isIn(['multiple_choice', 'true_false', 'short_answer'])
            .withMessage('Question type must be multiple_choice, true_false, or short_answer'),
            
        body('questions.*.points')
            .if(body('questions').exists())
            .notEmpty()
            .withMessage('Question points is required')
            .isFloat({ min: 0.1, max: 100 })
            .withMessage('Question points must be between 0.1 and 100'),
            
        body('questions.*.options')
            .if(body('questions.*.questionType').equals('multiple_choice'))
            .isArray({ min: 2, max: 6 })
            .withMessage('Multiple choice questions must have 2-6 options'),
            
        body('questions.*.correctAnswer')
            .if(body('questions').exists())
            .notEmpty()
            .withMessage('Correct answer is required'),
            
        body('tags')
            .optional()
            .isArray()
            .withMessage('Tags must be an array'),
            
        body('tags.*')
            .optional()
            .isLength({ min: 1, max: 50 })
            .withMessage('Each tag must be between 1 and 50 characters'),
            
        body('is_public')
            .optional()
            .isBoolean()
            .withMessage('is_public must be a boolean')
    ],

    // Validation cho tạo exam từ template
    createExam: [
        param('templateId')
            .isInt({ min: 1 })
            .withMessage('Template ID must be a valid positive integer'),
            
        body('title')
            .optional()
            .isLength({ min: 3, max: 255 })
            .withMessage('Title must be between 3 and 255 characters'),
            
        body('description')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Description must not exceed 1000 characters'),
            
        body('class_id')
            .notEmpty()
            .withMessage('Class is required')
            .isInt({ min: 1 })
            .withMessage('Class ID must be a valid positive integer'),
            
        body('start_time')
            .notEmpty()
            .withMessage('Start time is required')
            .isISO8601()
            .withMessage('Start time must be a valid ISO 8601 date'),
            
        body('end_time')
            .notEmpty()
            .withMessage('End time is required')
            .isISO8601()
            .withMessage('End time must be a valid ISO 8601 date')
            .custom((value, { req }) => {
                if (new Date(value) <= new Date(req.body.start_time)) {
                    throw new Error('End time must be after start time');
                }
                return true;
            })
    ],

    // Validation cho query parameters
    query: [
        query('subject_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Subject ID must be a valid positive integer'),
            
        query('difficulty_level')
            .optional()
            .isIn(['easy', 'medium', 'hard'])
            .withMessage('Difficulty level must be easy, medium, or hard'),
            
        query('search')
            .optional()
            .isLength({ min: 1, max: 100 })
            .withMessage('Search term must be between 1 and 100 characters'),
            
        query('tags')
            .optional()
            .custom((value) => {
                if (typeof value === 'string') {
                    const tags = value.split(',');
                    if (tags.length > 10) {
                        throw new Error('Maximum 10 tags allowed');
                    }
                    for (const tag of tags) {
                        if (tag.trim().length === 0 || tag.trim().length > 50) {
                            throw new Error('Each tag must be between 1 and 50 characters');
                        }
                    }
                }
                return true;
            }),
            
        query('exclude_own')
            .optional()
            .isBoolean()
            .withMessage('exclude_own must be a boolean')
    ]
};

module.exports = { examTemplateValidation };