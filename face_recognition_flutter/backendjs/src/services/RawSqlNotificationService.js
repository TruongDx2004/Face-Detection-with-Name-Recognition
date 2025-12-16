/**
 * RawSqlNotificationService
 * 
 * Implementation of NotificationService using raw SQL queries
 * This service works with the existing database structure
 */

const db = require('../config/database');
const config = require('../config/notifications');

class RawSqlNotificationService {
    constructor() {
        this.db = db;
    }

    /**
     * Get published notifications and events for students (public access)
     */
    async getPublishedNotifications(studentId = null, options = {}) {
        console.log('Getting published notifications - Options received:', options);
        console.log('Student ID:', studentId);

        const {
            page = 1,
            limit = config.PAGINATION.DEFAULT_PAGE_SIZE,
            type = null,
            category = null,
            priority = null
        } = options;

        const offset = (page - 1) * limit;

        let whereConditions = [
            'ne.status = "published"',
            '(ne.publish_date <= NOW() OR ne.publish_date IS NULL)',
            '(JSON_EXTRACT(ne.target_audience, "$.all_students") = true OR ne.target_audience IS NULL OR ne.target_audience = "{}")'
        ];

        let params = [];

        if (type) {
            whereConditions.push('ne.type = ?');
            params.push(type);
        }

        if (category) {
            whereConditions.push('ne.category = ?');
            params.push(category);
        }

        if (priority !== null) {
            whereConditions.push('ne.is_priority = ?');
            params.push(priority === 'true' || priority === true ? 1 : 0);
        }

        const whereClause = whereConditions.join(' AND ');

        try {
            const countQuery = `
            SELECT COUNT(*) as total
            FROM notifications_events ne
            WHERE ${whereClause}
        `;

            const dataQuery = `
            SELECT
                ne.id,
                ne.title,
                ne.content,
                ne.type,
                ne.category,
                ne.status,
                ne.is_priority,
                ne.publish_date,
                ne.event_start_datetime,
                ne.event_end_datetime,
                ne.registration_deadline,
                ne.location,
                ne.organizer,
                ne.allow_registration,
                ne.max_participants,
                ne.registration_fee,
                ne.target_audience,
                ne.view_count,
                ne.tags,
                ne.created_at,
                ne.updated_at,
                u.id AS creator_id,
                u.full_name AS creator_name,
                u.role AS creator_role
            FROM notifications_events ne
            LEFT JOIN users u ON ne.created_by = u.id
            WHERE ${whereClause}
            ORDER BY ne.is_priority DESC, ne.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

            // Count
            const [countRows] = await this.db.query(countQuery, params);
            const total = countRows[0]?.total || 0;

            const parseJsonSafe = (value, defaultValue = null) => {
                if (value === null || value === undefined) return defaultValue;

                if (typeof value === 'string') {
                    try {
                        return JSON.parse(value);
                    } catch {
                        return defaultValue;
                    }
                }

                if (typeof value === 'object') {
                    return value;
                }

                return defaultValue;
            };


            // Data
            const [rows] = await this.db.query(dataQuery, params);

            console.log(`Found ${total} total notifications, returning ${rows.length} items`);

            const transformedRows = rows.map(row => {
                const tags = parseJsonSafe(row.tags, []);
                console.log('Transforming notification row:', row);
                return {
                    id: row.id,
                    title: row.title,
                    content: row.content,
                    type: row.type,
                    category: row.category,
                    priority: row.is_priority ? 'high' : 'medium',
                    status: row.status,
                    scheduled_date: row.publish_date,
                    event_date: row.event_start_datetime,
                    event_end_date: row.event_end_datetime,
                    event_location: row.location,
                    organizer: row.organizer,
                    registration_fee: Number(row.registration_fee) || 0,
                    max_participants: row.max_participants,
                    current_participants: row.view_count || 0,
                    registration_deadline: row.registration_deadline,
                    requires_approval: false,
                    allow_registration: Boolean(row.allow_registration),
                    metadata: {},
                    image_url: null,
                    attachment_url: null,
                    tags: tags,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    created_by: row.creator_id ? {
                        id: row.creator_id,
                        full_name: row.creator_name,
                        role: row.creator_role
                    } : null
                };
            });

            return {
                notifications: transformedRows,
                pagination: {
                    current_page: Number(page),
                    total_pages: Math.ceil(total / limit),
                    total_items: total,
                    items_per_page: Number(limit)
                }
            };
        } catch (error) {
            console.error('Error in getPublishedNotifications:', error);
            throw error;
        }
    }


    /**
     * Get notifications and events list for students (legacy method for admin)
     */
    async getNotificationsForStudent(studentId, options = {}) {
        const {
            page = 1,
            limit = config.PAGINATION.DEFAULT_PAGE_SIZE,
            type = null,
            category = null,
            priority = null
        } = options;

        const offset = (page - 1) * limit;

        // Build WHERE conditions
        let whereConditions = ['ne.status = "published"', 'ne.publish_date <= NOW()'];
        let params = [];

        if (type) {
            whereConditions.push('ne.type = ?');
            params.push(type);
        }

        if (category) {
            whereConditions.push('ne.category = ?');
            params.push(category);
        }

        if (priority !== null) {
            whereConditions.push('ne.is_priority = ?');
            params.push(priority);
        }

        // Target audience filtering (simplified for now)
        whereConditions.push('(JSON_EXTRACT(ne.target_audience, "$.all_students") = true OR ne.target_audience IS NULL)');

        const whereClause = whereConditions.join(' AND ');

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM notifications_events ne 
            WHERE ${whereClause}
        `;

        const [countResult] = await this.db.execute(countQuery, params);
        const total = countResult[0].total;

        // Get notifications with creator info and view status
        let mainQuery = `
            SELECT 
                ne.*,
                u.full_name as creator_name,
                u.role as creator_role,
                CASE WHEN nv.id IS NOT NULL THEN 1 ELSE 0 END as is_viewed
            FROM notifications_events ne
            LEFT JOIN users u ON ne.created_by = u.id
        `;

        if (studentId) {
            mainQuery += ` LEFT JOIN notification_views nv ON ne.id = nv.notification_id AND nv.student_id = ?`;
            params.push(studentId);
        } else {
            mainQuery += ` LEFT JOIN notification_views nv ON 1=0`; // Never join
        }

        mainQuery += `
            WHERE ${whereClause}
            ORDER BY ne.is_priority DESC, ne.publish_date DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        const [rows] = await this.db.execute(mainQuery, params);

        return {
            notifications: rows,
            pagination: {
                current_page: page,
                total_pages: Math.ceil(total / limit),
                total_items: total,
                items_per_page: limit
            }
        };
    }

    /**
     * Get notification/event details
     */
    async getNotificationDetails(notificationId, studentId = null) {
        // Get notification details
        const [notificationRows] = await this.db.execute(`
            SELECT 
                ne.*,
                u.full_name as creator_name,
                u.role as creator_role
            FROM notifications_events ne
            LEFT JOIN users u ON ne.created_by = u.id
            WHERE ne.id = ?
        `, [notificationId]);

        if (notificationRows.length === 0) {
            throw new Error('Notification not found');
        }

        const notification = notificationRows[0];

        // Check if already viewed and mark as viewed for students
        let isViewed = false;
        if (studentId) {
            const [viewRows] = await this.db.execute(`
                SELECT id FROM notification_views 
                WHERE notification_id = ? AND student_id = ?
            `, [notificationId, studentId]);

            isViewed = viewRows.length > 0;

            // If not viewed, create view record
            if (!isViewed) {
                await this.db.execute(`
                    INSERT INTO notification_views (notification_id, student_id, device_info) 
                    VALUES (?, ?, 'web')
                `, [notificationId, studentId]);
            }
        }

        // For events, get registration info
        let registrationInfo = null;
        if (notification.type === 'event') {
            const [regCountRows] = await this.db.execute(`
                SELECT COUNT(*) as count 
                FROM event_registrations 
                WHERE event_id = ? AND status IN ('registered', 'confirmed')
            `, [notificationId]);

            const currentRegistrations = regCountRows[0].count;

            let userRegistration = null;
            if (studentId) {
                const [userRegRows] = await this.db.execute(`
                    SELECT * FROM event_registrations 
                    WHERE event_id = ? AND student_id = ?
                `, [notificationId, studentId]);

                userRegistration = userRegRows[0] || null;
            }

            registrationInfo = {
                current_registrations: currentRegistrations,
                max_participants: notification.max_participants,
                is_full: notification.max_participants ? currentRegistrations >= notification.max_participants : false,
                is_registration_open: notification.allow_registration &&
                    notification.registration_deadline &&
                    new Date() < new Date(notification.registration_deadline),
                user_registration: userRegistration
            };
        }

        return {
            ...notification,
            is_viewed: isViewed,
            registration_info: registrationInfo
        };
    }

    /**
     * Register student for event
     */
    async registerForEvent(eventId, studentId, notes = null) {
        // Get event details
        const [eventRows] = await this.db.execute(`
            SELECT * FROM notifications_events WHERE id = ?
        `, [eventId]);

        if (eventRows.length === 0) {
            throw new Error('Event not found');
        }

        const event = eventRows[0];

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
        const [existingRows] = await this.db.execute(`
            SELECT id FROM event_registrations 
            WHERE event_id = ? AND student_id = ?
        `, [eventId, studentId]);

        if (existingRows.length > 0) {
            throw new Error('Already registered for this event');
        }

        // Check if event is full
        if (event.max_participants) {
            const [countRows] = await this.db.execute(`
                SELECT COUNT(*) as count FROM event_registrations 
                WHERE event_id = ? AND status IN ('registered', 'confirmed')
            `, [eventId]);

            if (countRows[0].count >= event.max_participants) {
                throw new Error('Event is full');
            }
        }

        // Create registration
        const paymentStatus = event.registration_fee > 0 ? 'unpaid' : 'paid';
        const [result] = await this.db.execute(`
            INSERT INTO event_registrations (event_id, student_id, notes, payment_status) 
            VALUES (?, ?, ?, ?)
        `, [eventId, studentId, notes, paymentStatus]);

        // Get the created registration
        const [registrationRows] = await this.db.execute(`
            SELECT * FROM event_registrations WHERE id = ?
        `, [result.insertId]);

        return registrationRows[0];
    }

    /**
     * Cancel event registration
     */
    async cancelEventRegistration(eventId, studentId) {
        const [registrationRows] = await this.db.execute(`
            SELECT * FROM event_registrations 
            WHERE event_id = ? AND student_id = ?
        `, [eventId, studentId]);

        if (registrationRows.length === 0) {
            throw new Error('Registration not found');
        }

        const registration = registrationRows[0];

        if (!['registered', 'confirmed'].includes(registration.status)) {
            throw new Error('Cannot cancel registration with current status');
        }

        // Update status to cancelled
        await this.db.execute(`
            UPDATE event_registrations 
            SET status = 'cancelled', updated_at = NOW() 
            WHERE id = ?
        `, [registration.id]);

        // Get updated registration
        const [updatedRows] = await this.db.execute(`
            SELECT * FROM event_registrations WHERE id = ?
        `, [registration.id]);

        return updatedRows[0];
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

        let whereConditions = ['er.student_id = ?'];
        let params = [studentId];

        if (status) {
            whereConditions.push('er.status = ?');
            params.push(status);
        }

        const whereClause = whereConditions.join(' AND ');

        // Get total count
        const [countResult] = await this.db.execute(`
            SELECT COUNT(*) as total 
            FROM event_registrations er 
            WHERE ${whereClause}
        `, params);

        const total = countResult[0].total;

        // Get registrations with event details
        const query = `
            SELECT 
                er.*,
                ne.title as event_title,
                ne.event_start_datetime,
                ne.event_end_datetime,
                ne.location,
                ne.registration_fee,
                ne.status as event_status
            FROM event_registrations er
            LEFT JOIN notifications_events ne ON er.event_id = ne.id
            WHERE ${whereClause}
            ORDER BY er.registration_date DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        params.push(limit, offset);
        const [rows] = await this.db.execute(query, params);

        return {
            registrations: rows,
            pagination: {
                current_page: page,
                total_pages: Math.ceil(total / limit),
                total_items: total,
                items_per_page: limit
            }
        };
    }

    /**
     * Create new notification/event (Admin)
     */
    async createNotification(adminId, data) {
        const {
            title,
            content,
            type,
            category = 'general',
            event_start_datetime,
            event_end_datetime,
            registration_deadline,
            location,
            organizer,
            allow_registration = false,
            max_participants,
            registration_fee = 0,
            image_path,
            attachment_path,
            target_audience,
            status = 'published',
            is_priority = false,
            tags
        } = data;

        // Validation
        if (type === 'event' && !event_start_datetime) {
            throw new Error('Event start datetime is required for events');
        }

        if (allow_registration && !registration_deadline) {
            throw new Error('Registration deadline is required when registration is allowed');
        }

        // Insert notification - handle undefined values by converting to null
        const [result] = await this.db.execute(`
            INSERT INTO notifications_events (
                title, content, type, category, created_by,
                event_start_datetime, event_end_datetime, registration_deadline,
                location, organizer, allow_registration, max_participants, registration_fee,
                image_path, attachment_path, target_audience, status, is_priority, tags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title,
            content,
            type,
            category,
            adminId,
            event_start_datetime || null,
            event_end_datetime || null,
            registration_deadline || null,
            location || null,
            organizer || null,
            allow_registration || false,
            max_participants || null,
            registration_fee || 0,
            image_path || null,
            attachment_path || null,
            target_audience ? JSON.stringify(target_audience) : null,
            status,
            is_priority || false,
            tags ? JSON.stringify(tags) : null
        ]);

        // Get the created notification
        const [notificationRows] = await this.db.execute(`
            SELECT * FROM notifications_events WHERE id = ?
        `, [result.insertId]);

        return notificationRows[0];
    }

    /**
     * Update notification/event (Admin)
     */
    async updateNotification(notificationId, adminId, data) {
        // Check if notification exists
        const [existingRows] = await this.db.execute(`
            SELECT * FROM notifications_events WHERE id = ?
        `, [notificationId]);

        if (existingRows.length === 0) {
            throw new Error('Notification not found');
        }

        // Build update query dynamically
        const updateFields = [];
        const params = [];

        Object.keys(data).forEach(key => {
            if (data.hasOwnProperty(key)) {
                updateFields.push(`${key} = ?`);
                if (key === 'target_audience' || key === 'tags') {
                    params.push(data[key] ? JSON.stringify(data[key]) : null);
                } else {
                    // Convert undefined to null for SQL
                    params.push(data[key] !== undefined ? data[key] : null);
                }
            }
        });

        if (updateFields.length === 0) {
            return existingRows[0]; // No updates
        }

        updateFields.push('updated_at = NOW()');
        params.push(notificationId);

        await this.db.execute(`
            UPDATE notifications_events 
            SET ${updateFields.join(', ')} 
            WHERE id = ?
        `, params);

        // Get updated notification
        const [updatedRows] = await this.db.execute(`
            SELECT * FROM notifications_events WHERE id = ?
        `, [notificationId]);

        return updatedRows[0];
    }

    /**
     * Delete notification/event (Admin)
     */
    async deleteNotification(notificationId, adminId) {
        const [existingRows] = await this.db.execute(`
            SELECT * FROM notifications_events WHERE id = ?
        `, [notificationId]);

        if (existingRows.length === 0) {
            throw new Error('Notification not found');
        }

        await this.db.execute(`
            DELETE FROM notifications_events WHERE id = ?
        `, [notificationId]);

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

        let whereConditions = ['er.event_id = ?'];
        let params = [eventId];

        if (status) {
            whereConditions.push('er.status = ?');
            params.push(status);
        }

        const whereClause = whereConditions.join(' AND ');

        // Get total count
        const [countResult] = await this.db.execute(`
            SELECT COUNT(*) as total 
            FROM event_registrations er 
            WHERE ${whereClause}
        `, params);

        const total = countResult[0].total;

        // Get registrations with student details
        const query = `
            SELECT 
                er.*,
                u.username as student_username,
                u.full_name as student_name,
                u.email as student_email
            FROM event_registrations er
            LEFT JOIN users u ON er.student_id = u.id
            WHERE ${whereClause}
            ORDER BY er.registration_date DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        params.push(limit, offset);
        const [rows] = await this.db.execute(query, params);

        return {
            registrations: rows,
            pagination: {
                current_page: page,
                total_pages: Math.ceil(total / limit),
                total_items: total,
                items_per_page: limit
            }
        };
    }

    /**
     * Update registration status (Admin)
     */
    async updateRegistrationStatus(registrationId, status, adminNotes = null) {
        const [existingRows] = await this.db.execute(`
            SELECT * FROM event_registrations WHERE id = ?
        `, [registrationId]);

        if (existingRows.length === 0) {
            throw new Error('Registration not found');
        }

        await this.db.execute(`
            UPDATE event_registrations 
            SET status = ?, admin_notes = ?, updated_at = NOW() 
            WHERE id = ?
        `, [status, adminNotes, registrationId]);

        // Get updated registration
        const [updatedRows] = await this.db.execute(`
            SELECT * FROM event_registrations WHERE id = ?
        `, [registrationId]);

        return updatedRows[0];
    }

    /**
     * Get notification statistics
     */
    async getNotificationStats(notificationId) {
        const [notificationRows] = await this.db.execute(`
            SELECT * FROM notifications_events WHERE id = ?
        `, [notificationId]);

        if (notificationRows.length === 0) {
            throw new Error('Notification not found');
        }

        const notification = notificationRows[0];

        // Get view count
        const [viewCountRows] = await this.db.execute(`
            SELECT COUNT(*) as count FROM notification_views WHERE notification_id = ?
        `, [notificationId]);

        const viewCount = viewCountRows[0].count;

        let registrationStats = null;
        if (notification.type === 'event') {
            // Get total registrations
            const [totalRegRows] = await this.db.execute(`
                SELECT COUNT(*) as total FROM event_registrations WHERE event_id = ?
            `, [notificationId]);

            // Get registrations by status
            const [statusRows] = await this.db.execute(`
                SELECT status, COUNT(*) as count 
                FROM event_registrations 
                WHERE event_id = ? 
                GROUP BY status
            `, [notificationId]);

            const byStatus = {};
            statusRows.forEach(row => {
                byStatus[row.status] = row.count;
            });

            registrationStats = {
                total: totalRegRows[0].total,
                by_status: byStatus
            };
        }

        return {
            view_count: viewCount,
            registration_stats: registrationStats
        };
    }
}

module.exports = RawSqlNotificationService;