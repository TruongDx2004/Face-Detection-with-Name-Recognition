const { body, validationResult } = require('express-validator');
const { responseHelper } = require('../utils/responseHelper');

const validateAIGeneration = [
    body('question_count')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Question count must be between 1 and 20'),
    
    body('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be easy, medium, or hard'),
    
    body('language')
        .optional()
        .isIn(['vietnamese', 'english'])
        .withMessage('Language must be vietnamese or english'),
    
    body('assignment_type')
        .optional()
        .isIn(['homework', 'quiz', 'exam', 'practice'])
        .withMessage('Assignment type must be homework, quiz, exam, or practice'),
    
    body('question_types')
        .optional()
        .custom((value) => {
            if (typeof value === 'string') {
                const types = value.split(',').map(t => t.trim());
                const validTypes = ['multiple_choice', 'short_answer', 'true_false', 'essay'];
                return types.every(type => validTypes.includes(type));
            }
            return false;
        })
        .withMessage('Question types must be comma-separated values from: multiple_choice, short_answer, true_false, essay'),
    
    body('subject_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Subject ID must be a positive integer'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return responseHelper.error(res, 'Validation failed', 400, errors.array());
        }
        next();
    }
];

module.exports = {
    validateAIGeneration
};