/**
 * NotificationView Model
 * 
 * Model cho bảng notification_views lưu trữ thông tin về việc sinh viên đã xem thông báo/sự kiện hay chưa.
 */

const { DataTypes } = require('sequelize');
const { Sequelize } = require('sequelize');

class NotificationView {
    static init(sequelize) {
        const NotificationViewModel = sequelize.define('NotificationView', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            notification_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: 'ID thông báo/sự kiện',
                references: {
                    model: 'notifications_events',
                    key: 'id'
                }
            },
            student_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: 'ID sinh viên xem',
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            viewed_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                comment: 'Thời gian xem'
            },
            device_info: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: 'Thông tin thiết bị (mobile/web)'
            }
        }, {
            tableName: 'notification_views',
            timestamps: false,
            indexes: [
                { 
                    fields: ['student_id', 'notification_id'], 
                    unique: true,
                    name: 'unique_student_notification_view'
                },
                { fields: ['notification_id'] },
                { fields: ['student_id', 'viewed_at'] },
                { fields: ['viewed_at'] }
            ]
        });

        return NotificationViewModel;
    }

    static associate(models) {
        const NotificationViewModel = models.NotificationView;
        
        // Relationship with NotificationEvent
        NotificationViewModel.belongsTo(models.NotificationEvent, {
            foreignKey: 'notification_id',
            as: 'notification'
        });

        // Relationship with User (student)
        NotificationViewModel.belongsTo(models.User, {
            foreignKey: 'student_id',
            as: 'student'
        });
    }

    /**
     * Business logic methods
     */
    static methods = {
        // Get device type from device_info
        getDeviceType(instance) {
            if (!instance.device_info) return 'Unknown';
            
            const deviceInfo = instance.device_info.toLowerCase();
            if (deviceInfo.includes('mobile') || deviceInfo.includes('android') || deviceInfo.includes('iphone')) {
                return 'Mobile';
            } else if (deviceInfo.includes('web') || deviceInfo.includes('browser')) {
                return 'Web';
            } else {
                return 'Other';
            }
        },

        // Check if view is recent (within 24 hours)
        isRecentView(instance) {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return new Date(instance.viewed_at) > oneDayAgo;
        }
    };

    /**
     * Scopes for common queries
     */
    static scopes = {
        // Recent views (last 24 hours)
        recent: {
            where: {
                viewed_at: {
                    [Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        },

        // Views from mobile devices
        mobile: {
            where: {
                device_info: {
                    [Sequelize.Op.like]: '%mobile%'

                }
            }
        },

        // Views from web
        web: {
            where: {
                device_info: {
                   [Sequelize.Op.like]: '%web%'
                }
            }
        }
    };
}

module.exports = NotificationView;