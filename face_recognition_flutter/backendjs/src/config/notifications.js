/**
 * Notifications and Events Configuration
 * 
 * Configuration settings for the notifications and events system
 */

module.exports = {
    // File upload settings
    UPLOAD_SETTINGS: {
        // Maximum file size for images (in bytes) - 5MB
        MAX_IMAGE_SIZE: 5 * 1024 * 1024,
        
        // Maximum file size for attachments (in bytes) - 10MB
        MAX_ATTACHMENT_SIZE: 10 * 1024 * 1024,
        
        // Allowed image file types
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        
        // Allowed attachment file types
        ALLOWED_ATTACHMENT_TYPES: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'application/zip',
            'application/x-rar-compressed'
        ],
        
        // Upload directories
        IMAGE_UPLOAD_DIR: 'uploads/notifications/images',
        ATTACHMENT_UPLOAD_DIR: 'uploads/notifications/attachments'
    },

    // Notification categories
    CATEGORIES: {
        GENERAL: {
            value: 'general',
            label: 'Thông báo chung',
            color: '#6B7280',
            icon: 'info'
        },
        ACADEMIC: {
            value: 'academic',
            label: 'Học tập',
            color: '#3B82F6',
            icon: 'academic-cap'
        },
        EXTRACURRICULAR: {
            value: 'extracurricular',
            label: 'Ngoại khóa',
            color: '#10B981',
            icon: 'users'
        },
        URGENT: {
            value: 'urgent',
            label: 'Khẩn cấp',
            color: '#EF4444',
            icon: 'exclamation'
        }
    },

    // Event registration status
    REGISTRATION_STATUS: {
        REGISTERED: {
            value: 'registered',
            label: 'Đã đăng ký',
            color: '#F59E0B'
        },
        CONFIRMED: {
            value: 'confirmed',
            label: 'Đã xác nhận',
            color: '#3B82F6'
        },
        ATTENDED: {
            value: 'attended',
            label: 'Đã tham gia',
            color: '#10B981'
        },
        ABSENT: {
            value: 'absent',
            label: 'Vắng mặt',
            color: '#EF4444'
        },
        CANCELLED: {
            value: 'cancelled',
            label: 'Đã hủy',
            color: '#6B7280'
        }
    },

    // Payment status
    PAYMENT_STATUS: {
        UNPAID: {
            value: 'unpaid',
            label: 'Chưa thanh toán',
            color: '#F59E0B'
        },
        PAID: {
            value: 'paid',
            label: 'Đã thanh toán',
            color: '#10B981'
        },
        REFUNDED: {
            value: 'refunded',
            label: 'Đã hoàn tiền',
            color: '#6B7280'
        }
    },

    // Notification status
    STATUS: {
        DRAFT: {
            value: 'draft',
            label: 'Bản nháp',
            color: '#6B7280'
        },
        PUBLISHED: {
            value: 'published',
            label: 'Đã đăng',
            color: '#10B981'
        },
        ARCHIVED: {
            value: 'archived',
            label: 'Đã lưu trữ',
            color: '#8B5CF6'
        },
        CANCELLED: {
            value: 'cancelled',
            label: 'Đã hủy',
            color: '#EF4444'
        }
    },

    // Push notification settings
    PUSH_NOTIFICATION: {
        // Push notification service settings (can be Firebase, etc.)
        SERVICE: process.env.PUSH_NOTIFICATION_SERVICE || 'firebase',
        
        // Firebase configuration (if using Firebase)
        FIREBASE: {
            PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
            PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
            CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
        },
        
        // Default push notification settings
        DEFAULT_SETTINGS: {
            // Sound for notifications
            sound: 'default',
            
            // Badge count (iOS)
            badge: 1,
            
            // Priority (high/normal)
            priority: 'high',
            
            // Time to live (seconds)
            timeToLive: 24 * 60 * 60, // 24 hours
            
            // Click action
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        
        // Push notification templates
        TEMPLATES: {
            NEW_NOTIFICATION: {
                title: 'Thông báo mới từ trường',
                body: 'Bạn có thông báo mới: {title}'
            },
            NEW_EVENT: {
                title: 'Sự kiện mới',
                body: 'Sự kiện "{title}" vừa được đăng. Đăng ký ngay!'
            },
            EVENT_REMINDER: {
                title: 'Nhắc nhở sự kiện',
                body: 'Sự kiện "{title}" sẽ diễn ra vào {date}'
            },
            REGISTRATION_CONFIRMED: {
                title: 'Đăng ký thành công',
                body: 'Bạn đã đăng ký thành công sự kiện "{title}"'
            }
        }
    },

    // Pagination settings
    PAGINATION: {
        // Default page size for notifications list
        DEFAULT_PAGE_SIZE: 20,
        
        // Maximum page size
        MAX_PAGE_SIZE: 100,
        
        // Default page size for admin management
        ADMIN_PAGE_SIZE: 50
    },

    // Cache settings
    CACHE: {
        // Cache TTL for notification lists (in seconds)
        NOTIFICATION_LIST_TTL: 5 * 60, // 5 minutes
        
        // Cache TTL for notification details (in seconds)
        NOTIFICATION_DETAIL_TTL: 15 * 60, // 15 minutes
        
        // Cache TTL for registration counts (in seconds)
        REGISTRATION_COUNT_TTL: 2 * 60, // 2 minutes
    },

    // Email notification settings
    EMAIL_NOTIFICATIONS: {
        // Enable/disable email notifications
        ENABLED: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
        
        // Email templates
        TEMPLATES: {
            NEW_EVENT: 'notification_new_event',
            EVENT_REMINDER: 'notification_event_reminder',
            REGISTRATION_CONFIRMED: 'notification_registration_confirmed'
        },
        
        // Email sending settings
        BATCH_SIZE: 50, // Send emails in batches
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 5000 // 5 seconds
    },

    // Validation rules
    VALIDATION: {
        TITLE: {
            MIN_LENGTH: 5,
            MAX_LENGTH: 255
        },
        CONTENT: {
            MIN_LENGTH: 10,
            MAX_LENGTH: 10000
        },
        LOCATION: {
            MAX_LENGTH: 255
        },
        ORGANIZER: {
            MAX_LENGTH: 255
        },
        NOTES: {
            MAX_LENGTH: 1000
        },
        TAGS: {
            MAX_COUNT: 10,
            MAX_LENGTH: 50
        }
    },

    // Date/time settings
    DATETIME: {
        // Timezone
        TIMEZONE: process.env.TIMEZONE || 'Asia/Ho_Chi_Minh',
        
        // Date format for display
        DATE_FORMAT: 'DD/MM/YYYY',
        
        // DateTime format for display
        DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',
        
        // Minimum advance notice for events (in hours)
        MIN_EVENT_ADVANCE_NOTICE: 24,
        
        // Minimum registration deadline advance (in hours)
        MIN_REGISTRATION_DEADLINE_ADVANCE: 2
    },

    // Feature flags
    FEATURES: {
        // Enable/disable event registration
        EVENT_REGISTRATION: true,
        
        // Enable/disable push notifications
        PUSH_NOTIFICATIONS: process.env.PUSH_NOTIFICATIONS_ENABLED !== 'false',
        
        // Enable/disable email notifications
        EMAIL_NOTIFICATIONS: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
        
        // Enable/disable file attachments
        FILE_ATTACHMENTS: true,
        
        // Enable/disable image uploads
        IMAGE_UPLOADS: true,
        
        // Enable/disable payment for events
        EVENT_PAYMENTS: process.env.EVENT_PAYMENTS_ENABLED === 'true',
        
        // Enable/disable analytics tracking
        ANALYTICS_TRACKING: true
    }
};