// backendjs/src/validators/assignmentValidator.js
const Joi = require('joi');

// Validation schema for creating/updating assignments
const assignmentSchema = Joi.object({
    course_section_id: Joi.number().integer().positive().required(),
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000).allow('', null),
    assignment_type: Joi.string().valid('homework', 'project', 'lab', 'essay').default('homework'),
    max_score: Joi.number().positive().max(100).default(10),
    due_date: Joi.date().iso().greater('now').required(),
    instructions: Joi.string().max(2000).allow('', null),
    is_active: Joi.boolean().default(true)
});

// Validation schema for assignment submissions
const submissionSchema = Joi.object({
    assignment_id: Joi.number().integer().positive().required(),
    student_id: Joi.number().integer().positive().required(),
    submission_text: Joi.string().max(5000).allow('', null),
    // attachment_path will be handled by multer
});

// Validation schema for grading submissions
const gradingSchema = Joi.object({
    score: Joi.number().min(0).max(100).required(),
    feedback: Joi.string().max(1000).allow('', null)
});

// Validation schema for updating assignments (all fields optional)
const updateAssignmentSchema = Joi.object({
    title: Joi.string().min(1).max(200),
    description: Joi.string().max(1000).allow('', null),
    assignment_type: Joi.string().valid('homework', 'project', 'lab', 'essay'),
    max_score: Joi.number().positive().max(100),
    due_date: Joi.date().iso(),
    instructions: Joi.string().max(2000).allow('', null),
    is_active: Joi.boolean()
});

function validateAssignment(data) {
    return assignmentSchema.validate(data, { abortEarly: false });
}

function validateSubmission(data) {
    return submissionSchema.validate(data, { abortEarly: false });
}

function validateGrading(data) {
    return gradingSchema.validate(data, { abortEarly: false });
}

function validateUpdateAssignment(data) {
    return updateAssignmentSchema.validate(data, { abortEarly: false });
}

module.exports = {
    validateAssignment,
    validateSubmission,
    validateGrading,
    validateUpdateAssignment
};