const express = require('express');
const router = express.Router();
const ExamTemplateController = require('../controllers/ExamTemplateController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { examTemplateValidation } = require('../validators/examTemplateValidator');

// Middleware để đảm bảo chỉ teacher mới truy cập
const teacherOnly = authorize('teacher');

// GET /api/exam-templates/my - Lấy templates của teacher hiện tại
router.get('/my', 
    authenticateToken, 
    teacherOnly, 
    ExamTemplateController.getMyTemplates
);

// GET /api/exam-templates/public - Lấy templates công khai
router.get('/public', 
    authenticateToken, 
    teacherOnly, 
    ExamTemplateController.getPublicTemplates
);

// GET /api/exam-templates/tags - Lấy tất cả tags
router.get('/tags', 
    authenticateToken, 
    teacherOnly, 
    ExamTemplateController.getAllTags
);

// GET /api/exam-templates/search - Tìm kiếm theo tags
router.get('/search', 
    authenticateToken, 
    teacherOnly, 
    ExamTemplateController.searchByTags
);

// GET /api/exam-templates/statistics - Thống kê templates
router.get('/statistics', 
    authenticateToken, 
    teacherOnly, 
    ExamTemplateController.getStatistics
);

// GET /api/exam-templates/:id - Lấy template theo ID
router.get('/:id', 
    authenticateToken, 
    teacherOnly, 
    ExamTemplateController.getById
);

// POST /api/exam-templates - Tạo template mới
router.post('/', 
    authenticateToken, 
    teacherOnly, 
    examTemplateValidation.create,
    ExamTemplateController.create
);

// PUT /api/exam-templates/:id - Cập nhật template
router.put('/:id', 
    authenticateToken, 
    teacherOnly, 
    examTemplateValidation.update,
    ExamTemplateController.update
);

// DELETE /api/exam-templates/:id - Xóa template
router.delete('/:id', 
    authenticateToken, 
    teacherOnly, 
    ExamTemplateController.delete
);

// POST /api/exam-templates/:templateId/create-exam - Tạo exam từ template
router.post('/:templateId/create-exam', 
    authenticateToken, 
    teacherOnly, 
    examTemplateValidation.createExam,
    ExamTemplateController.createExamFromTemplate
);

// POST /api/exam-templates/:id/duplicate - Duplicate template
router.post('/:id/duplicate', 
    authenticateToken, 
    teacherOnly, 
    ExamTemplateController.duplicate
);

module.exports = router;