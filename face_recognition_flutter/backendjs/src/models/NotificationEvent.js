/**
 * NotificationEvent Model
 * 
 * Model cho quản lý thông báo và sự kiện của nhà trường
 */

const { DataTypes } = require('sequelize');
const { Sequelize } = require('sequelize');

class NotificationEvent {
    static init(sequelize) {
        const NotificationEventModel = sequelize.define('NotificationEvent', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
                comment: 'Tiêu đề thông báo/sự kiện'
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
                comment: 'Nội dung chi tiết'
            },
            type: {
                type: DataTypes.ENUM('notification', 'event'),
                allowNull: false,
                comment: 'Loại: thông báo chung hoặc sự kiện'
            },
            category: {
                type: DataTypes.ENUM('general', 'academic', 'extracurricular', 'urgent'),
                defaultValue: 'general',
                comment: 'Phân loại thông báo'
            },
            created_by: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: 'Admin/nhà trường tạo thông báo',
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            publish_date: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                comment: 'Ngày đăng'
            },
            event_start_datetime: {
                type: DataTypes.DATE,
                allowNull: true,
                comment: 'Thời gian bắt đầu sự kiện (chỉ cho type=event)'
            },
            event_end_datetime: {
                type: DataTypes.DATE,
                allowNull: true,
                comment: 'Thời gian kết thúc sự kiện (chỉ cho type=event)'
            },
            registration_deadline: {
                type: DataTypes.DATE,
                allowNull: true,
                comment: 'Hạn đăng ký (chỉ cho sự kiện có đăng ký)'
            },
            location: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: 'Địa điểm tổ chức (chỉ cho sự kiện)'
            },
            organizer: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: 'Đơn vị tổ chức'
            },
            allow_registration: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                comment: 'Có cho phép đăng ký không'
            },
            max_participants: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: 'Số lượng tối đa người tham gia'
            },
            registration_fee: {
                type: DataTypes.DECIMAL(10, 2),
                defaultValue: 0.00,
                comment: 'Phí đăng ký (nếu có)'
            },
            image_path: {
                type: DataTypes.STRING(500),
                allowNull: true,
                comment: 'Đường dẫn hình ảnh minh họa'
            },
            attachment_path: {
                type: DataTypes.STRING(500),
                allowNull: true,
                comment: 'File đính kèm (PDF, DOC, etc.)'
            },
            target_audience: {
                type: DataTypes.JSON,
                allowNull: true,
                comment: 'Đối tượng mục tiêu: {"classes": [1,2,3], "all_students": true, "years": ["2024"]}'
            },
            status: {
                type: DataTypes.ENUM('draft', 'published', 'archived', 'cancelled'),
                defaultValue: 'draft',
                comment: 'Trạng thái thông báo'
            },
            is_priority: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                comment: 'Thông báo ưu tiên (hiển thị nổi bật)'
            },
            view_count: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                comment: 'Số lượt xem'
            },
            tags: {
                type: DataTypes.JSON,
                allowNull: true,
                comment: 'Tags để tìm kiếm'
            }
        }, {
            tableName: 'notifications_events',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                { fields: ['type'] },
                { fields: ['category'] },
                { fields: ['status'] },
                { fields: ['publish_date'] },
                { fields: ['event_start_datetime', 'event_end_datetime'] },
                { fields: ['registration_deadline'] },
                { fields: ['created_by'] },
                { fields: ['is_priority', 'publish_date'] },
                { fields: ['view_count'] }
            ],
            validate: {
                eventDatesValid() {
                    if (this.type === 'event' && !this.event_start_datetime) {
                        throw new Error('Event must have start datetime');
                    }
                },
                registrationLogicValid() {
                    if (this.allow_registration && !this.registration_deadline) {
                        throw new Error('Registration deadline is required when registration is allowed');
                    }
                }
            }
        });

        return NotificationEventModel;
    }

    static associate(models) {
        const NotificationEventModel = models.NotificationEvent;
        
        // Relationship with User (creator)
        NotificationEventModel.belongsTo(models.User, {
            foreignKey: 'created_by',
            as: 'creator'
        });

        // Relationship with EventRegistrations
        NotificationEventModel.hasMany(models.EventRegistration, {
            foreignKey: 'event_id',
            as: 'registrations'
        });

        // Relationship with NotificationViews
        NotificationEventModel.hasMany(models.NotificationView, {
            foreignKey: 'notification_id',
            as: 'views'
        });

        // Relationship with PushNotificationLogs
        NotificationEventModel.hasMany(models.PushNotificationLog, {
            foreignKey: 'notification_id',
            as: 'pushLogs'
        });
    }

    /**
     * Business logic methods
     */
    static methods = {
        // Check if event is still accepting registrations
        isRegistrationOpen(instance) {
            if (!instance.allow_registration) return false;
            if (!instance.registration_deadline) return false;
            return new Date() < new Date(instance.registration_deadline);
        },

        // Check if event is currently happening
        isEventActive(instance) {
            if (instance.type !== 'event') return false;
            const now = new Date();
            const start = new Date(instance.event_start_datetime);
            const end = instance.event_end_datetime ? new Date(instance.event_end_datetime) : null;
            
            return now >= start && (!end || now <= end);
        },

        // Check if event is in the future
        isEventUpcoming(instance) {
            if (instance.type !== 'event') return false;
            return new Date() < new Date(instance.event_start_datetime);
        },

        // Check if event has ended
        isEventEnded(instance) {
            if (instance.type !== 'event') return false;
            if (!instance.event_end_datetime) return false;
            return new Date() > new Date(instance.event_end_datetime);
        },

        // Get registration count
        async getRegistrationCount(instance, models) {
            return await models.EventRegistration.count({
                where: { 
                    event_id: instance.id,
                    status: ['registered', 'confirmed']
                }
            });
        },

        // Check if registration is full
        async isRegistrationFull(instance, models) {
            if (!instance.max_participants) return false;
            const count = await this.getRegistrationCount(instance, models);
            return count >= instance.max_participants;
        },

        // Get target audience summary
        getTargetAudienceSummary(instance) {
            if (!instance.target_audience) return 'Không xác định';
            
            const target = instance.target_audience;
            if (target.all_students) return 'Tất cả sinh viên';
            
            const parts = [];
            if (target.classes && target.classes.length > 0) {
                parts.push(`Lớp: ${target.classes.join(', ')}`);
            }
            if (target.years && target.years.length > 0) {
                parts.push(`Khóa: ${target.years.join(', ')}`);
            }
            
            return parts.length > 0 ? parts.join('; ') : 'Không xác định';
        }
    };

    /**
     * Scopes for common queries
     */
    static scopes = {
        // Published notifications/events only
        published: {
            where: { status: 'published' }
        },

        // Priority notifications only
        priority: {
            where: { is_priority: true }
        },

        // Notifications only
        notifications: {
            where: { type: 'notification' }
        },

        // Events only
        events: {
            where: { type: 'event' }
        },

        // Upcoming events
        upcomingEvents: {
            where: {
                type: 'event',
                event_start_datetime: {
                    [Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        },

        // Events with open registration
        openRegistration: {
            where: {
                type: 'event',
                allow_registration: true,
                registration_deadline: {
                    [Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        },

        // Recent notifications (last 30 days)
        recent: {
            where: {
                publish_date: {
                    [Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        }
    };
}

module.exports = NotificationEvent;