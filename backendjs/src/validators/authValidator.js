const Joi = require('joi');

const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

const registerSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('student', 'teacher', 'admin').required(),
    student_id: Joi.string().when('role', {
        is: 'student',
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    class_name: Joi.string().when('role', {
        is: 'student',
        then: Joi.required(),
        otherwise: Joi.optional()
    })
});

module.exports = {
    loginSchema,
    registerSchema
};