/**
 * EventRegistration Model
 * 
 * Model cho quản lý đăng ký sự kiện của sinh viên
 */

const { DataTypes } = require('sequelize');
const { Sequelize } = require('sequelize');

class EventRegistration {
    static init(sequelize) {
        const EventRegistrationModel = sequelize.define('EventRegistration', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            event_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: 'ID sự kiện',
                references: {
                    model: 'notifications_events',
                    key: 'id'
                }
            },
            student_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: 'ID sinh viên đăng ký',
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            registration_date: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                comment: 'Thời gian đăng ký'
            },
            status: {
                type: DataTypes.ENUM('registered', 'confirmed', 'attended', 'absent', 'cancelled'),
                defaultValue: 'registered',
                comment: 'Trạng thái đăng ký'
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Ghi chú từ sinh viên khi đăng ký'
            },
            admin_notes: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Ghi chú từ admin'
            },
            payment_status: {
                type: DataTypes.ENUM('unpaid', 'paid', 'refunded'),
                defaultValue: 'unpaid',
                comment: 'Trạng thái thanh toán'
            },
            payment_date: {
                type: DataTypes.DATE,
                allowNull: true,
                comment: 'Ngày thanh toán'
            },
            payment_reference: {
                type: DataTypes.STRING(100),
                allowNull: true,
                comment: 'Mã tham chiếu thanh toán'
            }
        }, {
            tableName: 'event_registrations',
            timestamps: true,
            createdAt: false,
            updatedAt: 'updated_at',
            indexes: [
                { 
                    fields: ['student_id', 'event_id'], 
                    unique: true,
                    name: 'unique_student_event'
                },
                { fields: ['event_id', 'status'] },
                { fields: ['student_id', 'registration_date'] },
                { fields: ['status'] },
                { fields: ['payment_status'] }
            ]
        });

        return EventRegistrationModel;
    }

    static associate(models) {
        const EventRegistrationModel = models.EventRegistration;
        
        // Relationship with NotificationEvent
        EventRegistrationModel.belongsTo(models.NotificationEvent, {
            foreignKey: 'event_id',
            as: 'event'
        });

        // Relationship with User (student)
        EventRegistrationModel.belongsTo(models.User, {
            foreignKey: 'student_id',
            as: 'student'
        });
    }

    /**
     * Business logic methods
     */
    static methods = {
        // Check if registration can be cancelled
        canBeCancelled(instance) {
            return ['registered', 'confirmed'].includes(instance.status);
        },

        // Check if payment is required
        isPaymentRequired(instance, event) {
            return event && event.registration_fee > 0;
        },

        // Check if registration is confirmed
        isConfirmed(instance) {
            return ['confirmed', 'attended'].includes(instance.status);
        },

        // Get status display text
        getStatusText(instance) {
            const statusMap = {
                'registered': 'Đã đăng ký',
                'confirmed': 'Đã xác nhận',
                'attended': 'Đã tham gia',
                'absent': 'Vắng mặt',
                'cancelled': 'Đã hủy'
            };
            return statusMap[instance.status] || instance.status;
        },

        // Get payment status display text
        getPaymentStatusText(instance) {
            const statusMap = {
                'unpaid': 'Chưa thanh toán',
                'paid': 'Đã thanh toán',
                'refunded': 'Đã hoàn tiền'
            };
            return statusMap[instance.payment_status] || instance.payment_status;
        }
    };

    /**
     * Scopes for common queries
     */
    static scopes = {
        // Active registrations only
        active: {
            where: { 
                status: ['registered', 'confirmed', 'attended']
            }
        },

        // Confirmed registrations only
        confirmed: {
            where: { 
                status: ['confirmed', 'attended']
            }
        },

        // Paid registrations only
        paid: {
            where: { 
                payment_status: 'paid'
            }
        },

        // Recent registrations (last 7 days)
        recent: {
            where: {
                registration_date: {
                    [Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        }
    };
}

module.exports = EventRegistration;