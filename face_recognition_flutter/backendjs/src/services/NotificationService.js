/**
 * NotificationService
 * 
 * Dịch vụ cho quản lý thông báo và sự kiện
 */

const { Op } = require('sequelize');
const config = require('../config/notifications');

class NotificationService {
    constructor(models) {
        this.models = models;
        this.NotificationEvent = models.NotificationEvent;
        this.EventRegistration = models.EventRegistration;
        this.NotificationView = models.NotificationView;
        this.PushNotificationLog = models.PushNotificationLog;
        this.User = models.User;
    }

    /**
     * Get notifications and events list for students
     */
    async getNotificationsForStudent(studentId, options = {}) {
        const {
            page = 1,
            limit = config.PAGINATION.DEFAULT_PAGE_SIZE,
            type = null, // 'notification' or 'event'
            category = null,
            priority = null
        } = options;

        const offset = (page - 1) * limit;
        const where = {
            status: 'published',
            publish_date: { [Op.lte]: new Date() }
        };

        // Apply filters
        if (type) where.type = type;
        if (category) where.category = category;
        if (priority !== null) where.is_priority = priority;

        // Target audience filtering
        where[Op.or] = [
            { target_audience: { [Op.jsonContains]: { all_students: true } } },
            // Additional targeting logic can be added here
        ];

        const { count, rows } = await this.NotificationEvent.findAndCountAll({
            where,
            include: [
                {
                    model: this.User,
                    as: 'creator',
                    attributes: ['id', 'full_name', 'role']
                },
                {
                    model: this.NotificationView,
                    as: 'views',
                    where: { student_id: studentId },
                    required: false,
                    attributes: ['viewed_at']
                }
            ],
            order: [
                ['is_priority', 'DESC'],
                ['publish_date', 'DESC']
            ],
            limit,
            offset
        });

        return {
            notifications: rows,
            pagination: {
                current_page: page,
                total_pages: Math.ceil(count / limit),
                total_items: count,
                items_per_page: limit
            }
        };
    }

    /**
     * Get notification/event details
     */
    async getNotificationDetails(notificationId, studentId = null) {
        const notification = await this.NotificationEvent.findByPk(notificationId, {
            include: [
                {
                    model: this.User,
                    as: 'creator',
                    attributes: ['id', 'full_name', 'role']
                }
            ]
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        // If student ID provided, check if already viewed and mark as viewed
        let isViewed = false;
        if (studentId) {
            const existingView = await this.NotificationView.findOne({
                where: {
                    notification_id: notificationId,
                    student_id: studentId
                }
            });

            isViewed = !!existingView;

            // If not viewed, create view record
            if (!existingView) {
                await this.NotificationView.create({
                    notification_id: notificationId,
                    student_id: studentId,
                    device_info: 'web' // This should be passed from client
                });
            }
        }

        // For events, get registration info
        let registrationInfo = null;
        if (notification.type === 'event') {
            const registrationCount = await this.EventRegistration.count({
                where: {
                    event_id: notificationId,
                    status: ['registered', 'confirmed']
                }
            });

            let userRegistration = null;
            if (studentId) {
                userRegistration = await this.EventRegistration.findOne({
                    where: {
                        event_id: notificationId,
                        student_id: studentId
                    }
                });
            }

            registrationInfo = {
                current_registrations: registrationCount,
                max_participants: notification.max_participants,
                is_full: notification.max_participants ? registrationCount >= notification.max_participants : false,
                is_registration_open: notification.allow_registration &&
                    notification.registration_deadline &&
                    new Date() < new Date(notification.registration_deadline),
                user_registration: userRegistration
            };
        }

        return {
            ...notification.toJSON(),
            is_viewed: isViewed,
            registration_info: registrationInfo
        };
    }

    /**
     * Register student for event
     */
    async registerForEvent(eventId, studentId, notes = null) {
        const event = await this.NotificationEvent.findByPk(eventId);

        if (!event) {
            throw new Error('Event not found');
        }

        if (event.type !== 'event') {
            throw new Error('Cannot register for non-event notification');
        }

        if (!event.allow_registration) {
            throw new Error('Registration is not allowed for this event');
        }

        if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
            throw new Error('Registration deadline has passed');
        }

        // Check if already registered
        const existingRegistration = await this.EventRegistration.findOne({
            where: {
                event_id: eventId,
                student_id: studentId
            }
        });

        if (existingRegistration) {
            throw new Error('Already registered for this event');
        }

        // Check if event is full
        if (event.max_participants) {
            const currentCount = await this.EventRegistration.count({
                where: {
                    event_id: eventId,
                    status: ['registered', 'confirmed']
                }
            });

            if (currentCount >= event.max_participants) {
                throw new Error('Event is full');
            }
        }

        // Create registration
        const registration = await this.EventRegistration.create({
            event_id: eventId,
            student_id: studentId,
            notes,
            payment_status: event.registration_fee > 0 ? 'unpaid' : 'paid'
        });

        return registration;
    }

    /**
     * Cancel event registration
     */
    async cancelEventRegistration(eventId, studentId) {
        const registration = await this.EventRegistration.findOne({
            where: {
                event_id: eventId,
                student_id: studentId
            }
        });

        if (!registration) {
            throw new Error('Registration not found');
        }

        if (!['registered', 'confirmed'].includes(registration.status)) {
            throw new Error('Cannot cancel registration with current status');
        }

        await registration.update({ status: 'cancelled' });
        return registration;
    }

    /**
     * Get student's event registrations
     */
    async getStudentRegistrations(studentId, options = {}) {
        const {
            page = 1,
            limit = config.PAGINATION.DEFAULT_PAGE_SIZE,
            status = null
        } = options;

        const offset = (page - 1) * limit;
        const where = { student_id: studentId };

        if (status) where.status = status;

        const { count, rows } = await this.EventRegistration.findAndCountAll({
            where,
            include: [
                {
                    model: this.NotificationEvent,
                    as: 'event',
                    attributes: ['id', 'title', 'event_start_datetime', 'event_end_datetime',
                        'location', 'registration_fee', 'status']
                }
            ],
            order: [['registration_date', 'DESC']],
            limit,
            offset
        });

        return {
            registrations: rows,
            pagination: {
                current_page: page,
                total_pages: Math.ceil(count / limit),
                total_items: count,
                items_per_page: limit
            }
        };
    }

    /**
     * Admin methods
     */

    /**
     * Create new notification/event (Admin)
     */
    async createNotification(adminId, data) {
        const {
            title,
            content,
            type,
            category,
            event_start_datetime,
            event_end_datetime,
            registration_deadline,
            location,
            organizer,
            allow_registration,
            max_participants,
            registration_fee,
            image_path,
            attachment_path,
            target_audience,
            status,
            is_priority,
            tags
        } = data;

        const cleanData = {
            title,
            content,
            type,
            category,
            created_by: adminId,
            event_start_datetime,
            event_end_datetime,
            registration_deadline,
            location,
            organizer,
            allow_registration,
            max_participants,
            registration_fee,
            image_path,
            attachment_path,
            target_audience,
            status,
            is_priority,
            tags
        };

        // Convert undefined → null
        Object.keys(cleanData).forEach(key => {
            if (cleanData[key] === undefined) {
                cleanData[key] = null;
            }
        });

        const notification = await this.NotificationEvent.create(cleanData);
        return notification;
    }


    /**
     * Update notification/event (Admin)
     */
    async updateNotification(notificationId, adminId, data) {
        const notification = await this.NotificationEvent.findByPk(notificationId);

        if (!notification) {
            throw new Error('Notification not found');
        }

        // Check permission (can add role-based checks here)
        if (notification.created_by !== adminId) {
            // Check if admin has permission to edit others' notifications
            // This can be enhanced with proper role-based access control
        }

        await notification.update(data);
        return notification;
    }

    /**
     * Delete notification/event (Admin)
     */
    async deleteNotification(notificationId, adminId) {
        const notification = await this.NotificationEvent.findByPk(notificationId);

        if (!notification) {
            throw new Error('Notification not found');
        }

        // Check permission
        if (notification.created_by !== adminId) {
            // Check if admin has permission to delete others' notifications
        }

        await notification.destroy();
        return true;
    }

    /**
     * Get event registrations (Admin)
     */
    async getEventRegistrations(eventId, options = {}) {
        const {
            page = 1,
            limit = config.PAGINATION.ADMIN_PAGE_SIZE,
            status = null
        } = options;

        const offset = (page - 1) * limit;
        const where = { event_id: eventId };

        if (status) where.status = status;

        const { count, rows } = await this.EventRegistration.findAndCountAll({
            where,
            include: [
                {
                    model: this.User,
                    as: 'student',
                    attributes: ['id', 'username', 'full_name', 'email']
                }
            ],
            order: [['registration_date', 'DESC']],
            limit,
            offset
        });

        return {
            registrations: rows,
            pagination: {
                current_page: page,
                total_pages: Math.ceil(count / limit),
                total_items: count,
                items_per_page: limit
            }
        };
    }

    /**
     * Update registration status (Admin)
     */
    async updateRegistrationStatus(registrationId, status, adminNotes = null) {
        const registration = await this.EventRegistration.findByPk(registrationId);

        if (!registration) {
            throw new Error('Registration not found');
        }

        await registration.update({
            status,
            admin_notes: adminNotes || registration.admin_notes
        });

        return registration;
    }

    /**
     * Get notification statistics
     */
    async getNotificationStats(notificationId) {
        const notification = await this.NotificationEvent.findByPk(notificationId);

        if (!notification) {
            throw new Error('Notification not found');
        }

        const viewCount = await this.NotificationView.count({
            where: { notification_id: notificationId }
        });

        let registrationStats = null;
        if (notification.type === 'event') {
            const totalRegistrations = await this.EventRegistration.count({
                where: { event_id: notificationId }
            });

            const registrationsByStatus = await this.EventRegistration.findAll({
                where: { event_id: notificationId },
                attributes: [
                    'status',
                    [this.models.sequelize.fn('COUNT', this.models.sequelize.col('status')), 'count']
                ],
                group: ['status'],
                raw: true
            });

            registrationStats = {
                total: totalRegistrations,
                by_status: registrationsByStatus.reduce((acc, item) => {
                    acc[item.status] = parseInt(item.count);
                    return acc;
                }, {})
            };
        }

        return {
            view_count: viewCount,
            registration_stats: registrationStats
        };
    }
}

module.exports = NotificationService;