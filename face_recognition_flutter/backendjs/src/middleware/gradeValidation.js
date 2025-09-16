/**
 * Validation middleware for grade-related operations
 */

const validateStudentAccess = (req, res, next) => {
    const { userId } = req.params;
    const requestedUserId = parseInt(userId);
    
    // Students can only access their own grades
    if (req.user.role === 'student' && req.user.id !== requestedUserId) {
        return res.status(403).json({
            success: false,
            message: 'Access denied: You can only view your own grades'
        });
    }
    
    // Teachers and admins can access any student's grades
    if (['teacher', 'admin'].includes(req.user.role)) {
        return next();
    }
    
    // Students accessing their own grades
    if (req.user.role === 'student' && req.user.id === requestedUserId) {
        return next();
    }
    
    return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions'
    });
};

const validateUserId = (req, res, next) => {
    const { userId } = req.params;
    
    if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID'
        });
    }
    
    next();
};

const validateCourseSectionId = (req, res, next) => {
    const { courseSectionId } = req.params;
    
    if (!courseSectionId || isNaN(parseInt(courseSectionId))) {
        return res.status(400).json({
            success: false,
            message: 'Invalid course section ID'
        });
    }
    
    next();
};

const validateGradeScore = (req, res, next) => {
    const { score } = req.body;
    
    if (score !== undefined && score !== null) {
        const numericScore = parseFloat(score);
        
        if (isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
            return res.status(400).json({
                success: false,
                message: 'Score must be a number between 0 and 10'
            });
        }
    }
    
    next();
};

const validateGradeConfiguration = (req, res, next) => {
    const { assignment_weight, exam_weight, attendance_weight, passing_score } = req.body;
    
    // Validate weights
    if (assignment_weight !== undefined) {
        const weight = parseFloat(assignment_weight);
        if (isNaN(weight) || weight < 0 || weight > 100) {
            return res.status(400).json({
                success: false,
                message: 'Assignment weight must be between 0 and 100'
            });
        }
    }
    
    if (exam_weight !== undefined) {
        const weight = parseFloat(exam_weight);
        if (isNaN(weight) || weight < 0 || weight > 100) {
            return res.status(400).json({
                success: false,
                message: 'Exam weight must be between 0 and 100'
            });
        }
    }
    
    if (attendance_weight !== undefined) {
        const weight = parseFloat(attendance_weight);
        if (isNaN(weight) || weight < 0 || weight > 100) {
            return res.status(400).json({
                success: false,
                message: 'Attendance weight must be between 0 and 100'
            });
        }
    }
    
    // Validate total weights = 100%
    if (assignment_weight !== undefined && exam_weight !== undefined && attendance_weight !== undefined) {
        const totalWeight = parseFloat(assignment_weight) + parseFloat(exam_weight) + parseFloat(attendance_weight);
        if (Math.abs(totalWeight - 100) > 0.01) {
            return res.status(400).json({
                success: false,
                message: 'Total weights must equal 100%'
            });
        }
    }
    
    // Validate passing score
    if (passing_score !== undefined) {
        const score = parseFloat(passing_score);
        if (isNaN(score) || score < 0 || score > 10) {
            return res.status(400).json({
                success: false,
                message: 'Passing score must be between 0 and 10'
            });
        }
    }
    
    next();
};

const validateSemesterParams = (req, res, next) => {
    const { semester, academicYear } = req.query;
    
    if (semester && !['HK1', 'HK2', 'HK3'].includes(semester)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid semester. Must be HK1, HK2, or HK3'
        });
    }
    
    if (academicYear && !/^\d{4}-\d{4}$/.test(academicYear)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid academic year format. Must be YYYY-YYYY (e.g., 2023-2024)'
        });
    }
    
    next();
};

const validatePaginationParams = (req, res, next) => {
    const { page, limit } = req.query;
    
    if (page !== undefined) {
        const pageNum = parseInt(page);
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({
                success: false,
                message: 'Page must be a positive integer'
            });
        }
    }
    
    if (limit !== undefined) {
        const limitNum = parseInt(limit);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                message: 'Limit must be between 1 and 100'
            });
        }
    }
    
    next();
};

const sanitizeGradeInput = (req, res, next) => {
    // Sanitize numeric inputs
    if (req.body.score !== undefined) {
        req.body.score = parseFloat(req.body.score);
    }
    
    if (req.body.assignment_weight !== undefined) {
        req.body.assignment_weight = parseFloat(req.body.assignment_weight);
    }
    
    if (req.body.exam_weight !== undefined) {
        req.body.exam_weight = parseFloat(req.body.exam_weight);
    }
    
    if (req.body.attendance_weight !== undefined) {
        req.body.attendance_weight = parseFloat(req.body.attendance_weight);
    }
    
    if (req.body.passing_score !== undefined) {
        req.body.passing_score = parseFloat(req.body.passing_score);
    }
    
    // Sanitize string inputs
    if (req.body.feedback) {
        req.body.feedback = req.body.feedback.trim();
    }
    
    next();
};

const validateGradeUpdate = (req, res, next) => {
    const { score, feedback, status } = req.body;
    
    // At least one field must be provided for update
    if (score === undefined && !feedback && !status) {
        return res.status(400).json({
            success: false,
            message: 'At least one field (score, feedback, or status) must be provided for update'
        });
    }
    
    // Validate status if provided
    if (status && !['not_submitted', 'submitted', 'graded', 'late'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status. Must be one of: not_submitted, submitted, graded, late'
        });
    }
    
    next();
};

const logGradeAccess = (req, res, next) => {
    // Log grade access for auditing purposes
    const { userId, courseSectionId } = req.params;
    const userRole = req.user.role;
    const accessorId = req.user.id;
    
    console.log(`Grade access: ${userRole} (ID: ${accessorId}) accessing grades for user ${userId}${courseSectionId ? ` in course section ${courseSectionId}` : ''}`);
    
    next();
};

module.exports = {
    validateStudentAccess,
    validateUserId,
    validateCourseSectionId,
    validateGradeScore,
    validateGradeConfiguration,
    validateSemesterParams,
    validatePaginationParams,
    sanitizeGradeInput,
    validateGradeUpdate,
    logGradeAccess
};