/**
 * PushNotificationLog Model
 * 
 * Model cho bảng push_notification_logs lưu trữ lịch sử gửi push notification cho thông báo/sự kiện.
 */

const { DataTypes } = require('sequelize');
const { Sequelize } = require('sequelize');

class PushNotificationLog {
    static init(sequelize) {
        const PushNotificationLogModel = sequelize.define('PushNotificationLog', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            notification_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: 'ID thông báo/sự kiện gốc',
                references: {
                    model: 'notifications_events',
                    key: 'id'
                }
            },
            target_type: {
                type: DataTypes.ENUM('all_students', 'specific_classes', 'individual_users'),
                allowNull: false,
                comment: 'Loại đối tượng nhận'
            },
            target_data: {
                type: DataTypes.JSON,
                allowNull: true,
                comment: 'Dữ liệu chi tiết về đối tượng nhận'
            },
            push_title: {
                type: DataTypes.STRING(255),
                allowNull: false,
                comment: 'Tiêu đề push notification'
            },
            push_body: {
                type: DataTypes.TEXT,
                allowNull: false,
                comment: 'Nội dung push notification'
            },
            total_recipients: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                comment: 'Tổng số người nhận'
            },
            successful_sends: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                comment: 'Số lượng gửi thành công'
            },
            failed_sends: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                comment: 'Số lượng gửi thất bại'
            },
            status: {
                type: DataTypes.ENUM('pending', 'sending', 'completed', 'failed'),
                defaultValue: 'pending',
                comment: 'Trạng thái gửi'
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            },
            completed_at: {
                type: DataTypes.DATE,
                allowNull: true,
                comment: 'Thời gian hoàn thành gửi'
            }
        }, {
            tableName: 'push_notification_logs',
            timestamps: false,
            indexes: [
                { fields: ['notification_id'] },
                { fields: ['status'] },
                { fields: ['created_at'] },
                { fields: ['target_type'] }
            ]
        });

        return PushNotificationLogModel;
    }

    static associate(models) {
        const PushNotificationLogModel = models.PushNotificationLog;
        
        // Relationship with NotificationEvent
        PushNotificationLogModel.belongsTo(models.NotificationEvent, {
            foreignKey: 'notification_id',
            as: 'notification'
        });
    }

    /**
     * Business logic methods
     */
    static methods = {
        // Calculate success rate
        getSuccessRate(instance) {
            if (instance.total_recipients === 0) return 0;
            return (instance.successful_sends / instance.total_recipients * 100).toFixed(2);
        },

        // Calculate failure rate
        getFailureRate(instance) {
            if (instance.total_recipients === 0) return 0;
            return (instance.failed_sends / instance.total_recipients * 100).toFixed(2);
        },

        // Check if push notification is completed
        isCompleted(instance) {
            return ['completed', 'failed'].includes(instance.status);
        },

        // Get status display text
        getStatusText(instance) {
            const statusMap = {
                'pending': 'Đang chờ',
                'sending': 'Đang gửi',
                'completed': 'Hoàn thành',
                'failed': 'Thất bại'
            };
            return statusMap[instance.status] || instance.status;
        },

        // Get target audience summary
        getTargetSummary(instance) {
            switch (instance.target_type) {
                case 'all_students':
                    return 'Tất cả sinh viên';
                case 'specific_classes':
                    const classes = instance.target_data?.classes || [];
                    return `Lớp: ${classes.join(', ')}`;
                case 'individual_users':
                    const userCount = instance.target_data?.users?.length || 0;
                    return `${userCount} người dùng cụ thể`;
                default:
                    return 'Không xác định';
            }
        },

        // Calculate duration (if completed)
        getDuration(instance) {
            if (!instance.completed_at) return null;
            
            const start = new Date(instance.created_at);
            const end = new Date(instance.completed_at);
            const durationMs = end - start;
            
            if (durationMs < 1000) return `${durationMs}ms`;
            if (durationMs < 60000) return `${Math.round(durationMs / 1000)}s`;
            return `${Math.round(durationMs / 60000)}m`;
        }
    };

    /**
     * Scopes for common queries
     */
    static scopes = {
        // Completed pushes only
        completed: {
            where: { 
                status: 'completed'
            }
        },

        // Failed pushes only
        failed: {
            where: { 
                status: 'failed'
            }
        },

        // Pending or sending pushes
        active: {
            where: { 
                status: ['pending', 'sending']
            }
        },

        // Recent pushes (last 7 days)
        recent: {
            where: {
                created_at: {
                    [Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        }
    };
}

module.exports = PushNotificationLog;