/**
 * NotificationController
 * 
 * Controller for handling notifications and events API endpoints
 */

const NotificationService = require('../services/NotificationService');
const {
    createNotificationSchema,
    updateNotificationSchema,
    eventRegistrationSchema,
    getNotificationsQuerySchema,
    updateRegistrationStatusSchema,
    validateImageFile,
    validateAttachmentFile
} = require('../validators/notificationValidator');
const responseHelper = require('../utils/responseHelper');

class NotificationController {
    constructor() {
        // Initialize service when models are available
        this.notificationService = null;
    }

    // Initialize service with models (called from routes)
    initializeService(models) {
        if (!this.notificationService) {
            this.notificationService = new NotificationService(models);
        }
    }

    // ==================== STUDENT ENDPOINTS ====================

    /**
     * GET /api/notifications
     * Get notifications and events list for students
     */
    async getNotifications(req, res) {
        try {
            const { error, value } = getNotificationsQuerySchema.validate(req.query);
            if (error) {
                return responseHelper.validationError(res, error.details);
            }

            const studentId = req.user.role === 'student' ? req.user.id : null;
            const result = await this.notificationService.getNotificationsForStudent(studentId, value);

            return responseHelper.success(res, result, 'Notifications retrieved successfully');
        } catch (error) {
            console.error('Get notifications error:', error);
            return responseHelper.error(res, 'Có lỗi xảy ra khi lấy danh sách thông báo', 500);
        }
    }

    /**
     * GET /api/notifications/:id
     * Get notification/event details
     */
    async getNotificationById(req, res) {
        try {
            const notificationId = parseInt(req.params.id);
            if (isNaN(notificationId)) {
                return responseHelper.error(res, 'ID thông báo không hợp lệ', 400);
            }

            const studentId = req.user.role === 'student' ? req.user.id : null;
            const result = await this.notificationService.getNotificationDetails(notificationId, studentId);

            return responseHelper.success(res, result, 'Notification details retrieved successfully');
        } catch (error) {
            console.error('Get notification details error:', error);
            if (error.message === 'Notification not found') {
                return responseHelper.notFound(res, 'Không tìm thấy thông báo');
            }
            return responseHelper.error(res, 'Có lỗi xảy ra khi lấy chi tiết thông báo', 500);
        }
    }

    /**
     * POST /api/notifications/:id/register
     * Register for an event
     */
    async registerForEvent(req, res) {
        try {
            if (req.user.role !== 'student') {
                return responseHelper.forbidden(res, 'Chỉ sinh viên mới có thể đăng ký sự kiện');
            }

            const eventId = parseInt(req.params.id);
            if (isNaN(eventId)) {
                return responseHelper.error(res, 'ID sự kiện không hợp lệ', 400);
            }

            const { error, value } = eventRegistrationSchema.validate(req.body);
            if (error) {
                return responseHelper.validationError(res, error.details);
            }

            const registration = await this.notificationService.registerForEvent(
                eventId,
                req.user.id,
                value.notes
            );

            return responseHelper.created(res, registration, 'Đăng ký sự kiện thành công');
        } catch (error) {
            console.error('Event registration error:', error);

            // Handle specific business logic errors
            const errorMessages = {
                'Event not found': 'Không tìm thấy sự kiện',
                'Cannot register for non-event notification': 'Không thể đăng ký cho thông báo thường',
                'Registration is not allowed for this event': 'Sự kiện này không cho phép đăng ký',
                'Registration deadline has passed': 'Đã hết hạn đăng ký',
                'Already registered for this event': 'Bạn đã đăng ký sự kiện này rồi',
                'Event is full': 'Sự kiện đã đầy'
            };

            const message = errorMessages[error.message] || 'Có lỗi xảy ra khi đăng ký sự kiện';
            const status = errorMessages[error.message] ? 400 : 500;

            return responseHelper.error(res, message, status);
        }
    }

    /**
     * DELETE /api/notifications/:id/register
     * Cancel event registration
     */
    async cancelEventRegistration(req, res) {
        try {
            if (req.user.role !== 'student') {
                return responseHelper.forbidden(res, 'Chỉ sinh viên mới có thể hủy đăng ký sự kiện');
            }

            const eventId = parseInt(req.params.id);
            if (isNaN(eventId)) {
                return responseHelper.error(res, 'ID sự kiện không hợp lệ', 400);
            }

            const registration = await this.notificationService.cancelEventRegistration(eventId, req.user.id);

            return responseHelper.success(res, registration, 'Hủy đăng ký sự kiện thành công');
        } catch (error) {
            console.error('Cancel registration error:', error);

            const errorMessages = {
                'Registration not found': 'Không tìm thấy đăng ký',
                'Cannot cancel registration with current status': 'Không thể hủy đăng ký với trạng thái hiện tại'
            };

            const message = errorMessages[error.message] || 'Có lỗi xảy ra khi hủy đăng ký';
            const status = errorMessages[error.message] ? 400 : 500;

            return responseHelper.error(res, message, status);
        }
    }

    /**
     * GET /api/my-registrations
     * Get student's event registrations
     */
    async getMyRegistrations(req, res) {
        try {
            if (req.user.role !== 'student') {
                return responseHelper.forbidden(res, 'Chỉ sinh viên mới có thể xem danh sách đăng ký');
            }

            const { error, value } = getNotificationsQuerySchema.validate(req.query);
            if (error) {
                return responseHelper.validationError(res, error.details);
            }

            const result = await this.notificationService.getStudentRegistrations(req.user.id, value);

            return responseHelper.success(res, result, 'Registrations retrieved successfully');
        } catch (error) {
            console.error('Get student registrations error:', error);
            return responseHelper.error(res, 'Có lỗi xảy ra khi lấy danh sách đăng ký', 500);
        }
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * POST /api/admin/notifications
     * Create new notification/event (Admin only)
     */
    async createNotification(req, res) {
        try {
            // Chuyển đổi kiểu dữ liệu
            const body = { ...req.body };

            // Handle boolean conversions - support both string and boolean inputs
            if (typeof body.allow_registration === 'string') {
                body.allow_registration = body.allow_registration === 'true';
            } else if (typeof body.allow_registration !== 'boolean') {
                body.allow_registration = false;
            }

            if (typeof body.is_priority === 'string') {
                body.is_priority = body.is_priority === 'true';
            } else if (typeof body.is_priority !== 'boolean') {
                body.is_priority = false;
            }

            // Handle numeric conversion
            if (body.registration_fee !== undefined) {
                body.registration_fee = Number(body.registration_fee || 0);
            }

            if (body.max_participants !== undefined) {
                body.max_participants = Number(body.max_participants);
            }

            // Handle target_audience - check if it's already an object or needs parsing
            if (typeof body.target_audience === 'string') {
                try {
                    body.target_audience = JSON.parse(body.target_audience || '{}');
                } catch {
                    body.target_audience = {};
                }
            } else if (!body.target_audience) {
                body.target_audience = {};
            }

            // Handle tags - check if it's already an array or needs parsing
            if (typeof body.tags === 'string') {
                try {
                    body.tags = JSON.parse(body.tags || '[]');
                } catch {
                    body.tags = [];
                }
            } else if (!body.tags) {
                body.tags = [];
            }

            console.log('Parsed body for validation:', body);

            // Validate sau khi parse
            const { error, value } = createNotificationSchema.validate(body);
            if (error) {
                console.error('Validation error:', error.details);
                return responseHelper.validationError(res, error.details);
            }

            // Tiếp tục phần upload file và lưu notification như cũ...
            const notification = await this.notificationService.createNotification(req.user.id, value);
            return responseHelper.created(res, notification, 'Tạo thông báo/sự kiện thành công');
        } catch (error) {
            console.error('Create notification error:', error);
            const messageMap = {
                'Event start datetime is required for events': 'Thời gian bắt đầu là bắt buộc cho sự kiện',
                'Registration deadline is required when registration is allowed': 'Hạn đăng ký là bắt buộc khi cho phép đăng ký'
            };
            const message = messageMap[error.message] || 'Có lỗi xảy ra khi tạo thông báo/sự kiện';
            const status = messageMap[error.message] ? 400 : 500;
            return responseHelper.error(res, message, status);
        }
    }


    /**
     * PUT /api/admin/notifications/:id
     * Update notification/event (Admin only)
     */
    async updateNotification(req, res) {
        try {
            const notificationId = parseInt(req.params.id);
            if (isNaN(notificationId)) {
                return responseHelper.error(res, 'ID thông báo không hợp lệ', 400);
            }

            const { error, value } = updateNotificationSchema.validate(req.body);
            if (error) {
                return responseHelper.validationError(res, error.details);
            }

            // Handle file uploads if present
            if (req.files) {
                if (req.files.image) {
                    const imageValidation = validateImageFile(req.files.image);
                    if (!imageValidation.isValid) {
                        return responseHelper.error(res, imageValidation.errors.join(', '), 400);
                    }
                    value.image_path = req.files.image.path;
                }

                if (req.files.attachment) {
                    const attachmentValidation = validateAttachmentFile(req.files.attachment);
                    if (!attachmentValidation.isValid) {
                        return responseHelper.error(res, attachmentValidation.errors.join(', '), 400);
                    }
                    value.attachment_path = req.files.attachment.path;
                }
            }

            const notification = await this.notificationService.updateNotification(notificationId, req.user.id, value);

            return responseHelper.success(res, notification, 'Cập nhật thông báo/sự kiện thành công');
        } catch (error) {
            console.error('Update notification error:', error);

            if (error.message === 'Notification not found') {
                return responseHelper.notFound(res, 'Không tìm thấy thông báo');
            }

            return responseHelper.error(res, 'Có lỗi xảy ra khi cập nhật thông báo/sự kiện', 500);
        }
    }

    /**
     * DELETE /api/admin/notifications/:id
     * Delete notification/event (Admin only)
     */
    async deleteNotification(req, res) {
        try {
            const notificationId = parseInt(req.params.id);
            if (isNaN(notificationId)) {
                return responseHelper.error(res, 'ID thông báo không hợp lệ', 400);
            }

            await this.notificationService.deleteNotification(notificationId, req.user.id);

            return responseHelper.success(res, null, 'Xóa thông báo/sự kiện thành công');
        } catch (error) {
            console.error('Delete notification error:', error);

            if (error.message === 'Notification not found') {
                return responseHelper.notFound(res, 'Không tìm thấy thông báo');
            }

            return responseHelper.error(res, 'Có lỗi xảy ra khi xóa thông báo/sự kiện', 500);
        }
    }

    /**
     * GET /api/admin/notifications
     * Get all notifications for admin management
     */
    async getAdminNotifications(req, res) {
        try {
            const { error, value } = getNotificationsQuerySchema.validate(req.query);
            if (error) {
                return responseHelper.validationError(res, error.details);
            }

            // For admin, don't filter by student targeting
            const result = await this.notificationService.getNotificationsForStudent(null, value);

            return responseHelper.success(res, result, 'Admin notifications retrieved successfully');
        } catch (error) {
            console.error('Get admin notifications error:', error);
            return responseHelper.error(res, 'Có lỗi xảy ra khi lấy danh sách thông báo', 500);
        }
    }

    /**
     * GET /api/admin/notifications/:id/registrations
     * Get event registrations (Admin only)
     */
    async getEventRegistrations(req, res) {
        try {
            const eventId = parseInt(req.params.id);
            if (isNaN(eventId)) {
                return responseHelper.error(res, 'ID sự kiện không hợp lệ', 400);
            }

            const { error, value } = getNotificationsQuerySchema.validate(req.query);
            if (error) {
                return responseHelper.validationError(res, error.details);
            }

            const result = await this.notificationService.getEventRegistrations(eventId, value);

            return responseHelper.success(res, result, 'Event registrations retrieved successfully');
        } catch (error) {
            console.error('Get event registrations error:', error);
            return responseHelper.error(res, 'Có lỗi xảy ra khi lấy danh sách đăng ký', 500);
        }
    }

    /**
     * PUT /api/admin/registrations/:id/status
     * Update registration status (Admin only)
     */
    async updateRegistrationStatus(req, res) {
        try {
            const registrationId = parseInt(req.params.id);
            if (isNaN(registrationId)) {
                return responseHelper.error(res, 'ID đăng ký không hợp lệ', 400);
            }

            const { error, value } = updateRegistrationStatusSchema.validate(req.body);
            if (error) {
                return responseHelper.validationError(res, error.details);
            }

            const registration = await this.notificationService.updateRegistrationStatus(
                registrationId,
                value.status,
                value.admin_notes
            );

            return responseHelper.success(res, registration, 'Cập nhật trạng thái đăng ký thành công');
        } catch (error) {
            console.error('Update registration status error:', error);

            if (error.message === 'Registration not found') {
                return responseHelper.notFound(res, 'Không tìm thấy đăng ký');
            }

            return responseHelper.error(res, 'Có lỗi xảy ra khi cập nhật trạng thái đăng ký', 500);
        }
    }

    /**
     * GET /api/admin/notifications/:id/stats
     * Get notification statistics (Admin only)
     */
    async getNotificationStats(req, res) {
        try {
            const notificationId = parseInt(req.params.id);
            if (isNaN(notificationId)) {
                return responseHelper.error(res, 'ID thông báo không hợp lệ', 400);
            }

            const stats = await this.notificationService.getNotificationStats(notificationId);

            return responseHelper.success(res, stats, 'Notification statistics retrieved successfully');
        } catch (error) {
            console.error('Get notification stats error:', error);

            if (error.message === 'Notification not found') {
                return responseHelper.notFound(res, 'Không tìm thấy thông báo');
            }

            return responseHelper.error(res, 'Có lỗi xảy ra khi lấy thống kê thông báo', 500);
        }
    }

    // ==================== UTILITY METHODS ====================

    /**
     * GET /api/notifications/categories
     * Get available notification categories
     */
    async getCategories(req, res) {
        try {
            const config = require('../config/notifications');
            const categories = Object.values(config.CATEGORIES);

            return responseHelper.success(res, { categories }, 'Categories retrieved successfully');
        } catch (error) {
            console.error('Get categories error:', error);
            return responseHelper.error(res, 'Có lỗi xảy ra khi lấy danh sách phân loại', 500);
        }
    }

    /**
     * GET /api/notifications/config
     * Get notification system configuration
     */
    async getConfig(req, res) {
        try {
            const config = require('../config/notifications');

            const publicConfig = {
                categories: config.CATEGORIES,
                registration_status: config.REGISTRATION_STATUS,
                payment_status: config.PAYMENT_STATUS,
                status: config.STATUS,
                validation: config.VALIDATION,
                features: config.FEATURES,
                upload_settings: {
                    max_image_size: config.UPLOAD_SETTINGS.MAX_IMAGE_SIZE,
                    max_attachment_size: config.UPLOAD_SETTINGS.MAX_ATTACHMENT_SIZE,
                    allowed_image_types: config.UPLOAD_SETTINGS.ALLOWED_IMAGE_TYPES,
                    allowed_attachment_types: config.UPLOAD_SETTINGS.ALLOWED_ATTACHMENT_TYPES
                }
            };

            return responseHelper.success(res, publicConfig, 'Configuration retrieved successfully');
        } catch (error) {
            console.error('Get config error:', error);
            return responseHelper.error(res, 'Có lỗi xảy ra khi lấy cấu hình hệ thống', 500);
        }
    }
}

module.exports = new NotificationController();