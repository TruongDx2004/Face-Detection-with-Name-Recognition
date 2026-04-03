const express = require('express');
const ScheduleController = require('../controllers/ScheduleController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');

const router = express.Router();

// Middleware: Yêu cầu authentication cho tất cả routes
router.use(authenticateToken);

// Template routes (đặt trước để tránh conflict với /:id)
router.get('/template', ScheduleController.getSchedulesTemplate);

// General schedule routes
router.get('/', ScheduleController.getAllSchedules);
router.post('/', authorize(USER_ROLES.ADMIN, USER_ROLES.TEACHER), ScheduleController.createSchedule);
router.get('/options', ScheduleController.getScheduleOptions);
router.get('/weekly', ScheduleController.getWeeklySchedule);

// Import routes
router.post('/import', authorize(USER_ROLES.ADMIN, USER_ROLES.TEACHER), ScheduleController.importSchedules);

// Course section specific routes
router.get('/course/:course_section_id', ScheduleController.getCourseSchedules);

// Individual schedule routes
router.put('/:id', authorize(USER_ROLES.ADMIN, USER_ROLES.TEACHER), ScheduleController.updateSchedule);
router.delete('/:id', authorize(USER_ROLES.ADMIN, USER_ROLES.TEACHER), ScheduleController.deleteSchedule);

module.exports = router;