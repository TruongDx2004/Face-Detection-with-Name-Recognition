/**
 * Notification Routes
 * 
 * API routes for notifications and events system
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const notificationController = require('../controllers/NotificationController');
const { authenticateToken, authorize } = require('../middleware/auth');
const config = require('../config/notifications');

// Initialize models for the controller (this will be called from main server)
const initializeController = (models) => {
    notificationController.initializeService(models);
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadDir;
        
        if (file.fieldname === 'image') {
            uploadDir = config.UPLOAD_SETTINGS.IMAGE_UPLOAD_DIR;
        } else if (file.fieldname === 'attachment') {
            uploadDir = config.UPLOAD_SETTINGS.ATTACHMENT_UPLOAD_DIR;
        } else {
            return cb(new Error('Invalid field name'), null);
        }

        // Create directory if it doesn't exist
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${name}_${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'image') {
        if (config.UPLOAD_SETTINGS.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid image file type'), false);
        }
    } else if (file.fieldname === 'attachment') {
        if (config.UPLOAD_SETTINGS.ALLOWED_ATTACHMENT_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid attachment file type'), false);
        }
    } else {
        cb(new Error('Invalid field name'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: Math.max(
            config.UPLOAD_SETTINGS.MAX_IMAGE_SIZE,
            config.UPLOAD_SETTINGS.MAX_ATTACHMENT_SIZE
        )
    }
});

// Upload middleware for notifications
const uploadNotificationFiles = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'attachment', maxCount: 1 }
]);

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                error: 'File quá lớn. Vui lòng chọn file nhỏ hơn.' 
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
                error: 'Quá nhiều file hoặc tên field không hợp lệ.' 
            });
        }
    }
    
    if (err.message.includes('Invalid') && err.message.includes('file type')) {
        return res.status(400).json({ 
            error: 'Định dạng file không được hỗ trợ.' 
        });
    }
    
    next(err);
};

// ==================== PUBLIC ROUTES ====================

// Get system configuration (no auth required)
router.get('/config', notificationController.getConfig.bind(notificationController));

// Get categories (no auth required)
router.get('/categories', notificationController.getCategories.bind(notificationController));

// ==================== STUDENT ROUTES ====================

// Get notifications list (requires authentication)
router.get('/', 
    authenticateToken, 
    notificationController.getNotifications.bind(notificationController)
);

// Get notification details (requires authentication)
router.get('/:id', 
    authenticateToken, 
    notificationController.getNotificationById.bind(notificationController)
);

// Register for event (students only)
router.post('/:id/register', 
    authenticateToken, 
    authorize('student'),
    notificationController.registerForEvent.bind(notificationController)
);

// Cancel event registration (students only)
router.delete('/:id/register', 
    authenticateToken, 
    authorize('student'),
    notificationController.cancelEventRegistration.bind(notificationController)
);

// Get my registrations (students only)
router.get('/my/registrations', 
    authenticateToken, 
    authorize('student'),
    notificationController.getMyRegistrations.bind(notificationController)
);

// ==================== ADMIN ROUTES ====================

// Admin prefix for all admin routes
const adminRouter = express.Router();

// Get all notifications for admin
adminRouter.get('/notifications', 
    notificationController.getAdminNotifications.bind(notificationController)
);

// Create new notification/event (with file upload)
adminRouter.post('/notifications',
    uploadNotificationFiles,
    handleUploadError,
    notificationController.createNotification.bind(notificationController)
);

// Update notification/event (with file upload)
adminRouter.put('/notifications/:id',
    uploadNotificationFiles,
    handleUploadError,
    notificationController.updateNotification.bind(notificationController)
);

// Delete notification/event
adminRouter.delete('/notifications/:id',
    notificationController.deleteNotification.bind(notificationController)
);

// Get event registrations
adminRouter.get('/notifications/:id/registrations',
    notificationController.getEventRegistrations.bind(notificationController)
);

// Get notification statistics
adminRouter.get('/notifications/:id/stats',
    notificationController.getNotificationStats.bind(notificationController)
);

// Update registration status
adminRouter.put('/registrations/:id/status',
    notificationController.updateRegistrationStatus.bind(notificationController)
);

// Apply authentication and authorization to all admin routes
router.use('/admin', 
    authenticateToken, 
    authorize('admin', 'teacher'), // Allow both admin and teacher to manage notifications
    adminRouter
);

// ==================== ERROR HANDLING ====================

// Global error handler for this router
router.use((err, req, res, next) => {
    console.error('Notification route error:', err);
    
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    
    res.status(500).json({ 
        error: 'Có lỗi xảy ra trong hệ thống thông báo',
        ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
});

// Export router and initialization function
module.exports = {
    router,
    initializeController
};