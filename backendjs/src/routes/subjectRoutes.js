const express = require('express');
const SubjectController = require('../controllers/SubjectController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');

const router = express.Router();

// Middleware: Yêu cầu authentication cho tất cả routes
router.use(authenticateToken);

// Template routes (đặt trước để tránh conflict với /:id)
router.get('/template', SubjectController.getSubjectsTemplate);

// Import routes
router.post('/import', authorize(USER_ROLES.ADMIN), SubjectController.importSubjects);

// Subject routes
router.get('/', SubjectController.getAllSubjects);
router.post('/', authorize(USER_ROLES.ADMIN), SubjectController.createSubject);
router.get('/:id', SubjectController.getSubjectById);
router.put('/:id', authorize(USER_ROLES.ADMIN), SubjectController.updateSubject);
router.delete('/:id', authorize(USER_ROLES.ADMIN), SubjectController.deleteSubject);

// Subject related data routes
router.get('/:id/course-sections', SubjectController.getSubjectCourseSections);
router.get('/:id/attendance-sessions', SubjectController.getSubjectAttendanceSessions);

module.exports = router;