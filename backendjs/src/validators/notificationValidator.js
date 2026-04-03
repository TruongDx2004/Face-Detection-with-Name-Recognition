/**
 * Notification and Event Validators
 * 
 * Các schema xác thực cho việc tạo và cập nhật thông báo và sự kiện, bao gồm cả việc đăng ký sự kiện.
 */

const Joi = require('joi');
const config = require('../config/notifications');

// Common validation schemas
const titleSchema = Joi.string()
    .min(config.VALIDATION.TITLE.MIN_LENGTH)
    .max(config.VALIDATION.TITLE.MAX_LENGTH)
    .required()
    .messages({
        'string.min': `Tiêu đề phải có ít nhất ${config.VALIDATION.TITLE.MIN_LENGTH} ký tự`,
        'string.max': `Tiêu đề không được vượt quá ${config.VALIDATION.TITLE.MAX_LENGTH} ký tự`,
        'any.required': 'Tiêu đề là bắt buộc'
    });

const contentSchema = Joi.string()
    .min(config.VALIDATION.CONTENT.MIN_LENGTH)
    .max(config.VALIDATION.CONTENT.MAX_LENGTH)
    .required()
    .messages({
        'string.min': `Nội dung phải có ít nhất ${config.VALIDATION.CONTENT.MIN_LENGTH} ký tự`,
        'string.max': `Nội dung không được vượt quá ${config.VALIDATION.CONTENT.MAX_LENGTH} ký tự`,
        'any.required': 'Nội dung là bắt buộc'
    });

// Target audience schema
const targetAudienceSchema = Joi.object({
    all_students: Joi.boolean(),
    classes: Joi.array().items(Joi.number().integer().positive()),
    years: Joi.array().items(Joi.string().length(4))
}).or('all_students', 'classes', 'years')
    .messages({
        'object.missing': 'Phải chỉ định đối tượng nhận thông báo'
    });

// Tags schema
const tagsSchema = Joi.array()
    .items(
        Joi.string()
            .max(config.VALIDATION.TAGS.MAX_LENGTH)
            .pattern(/^[a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s\-_]+$/)
    )
    .max(config.VALIDATION.TAGS.MAX_COUNT)
    .messages({
        'array.max': `Không được vượt quá ${config.VALIDATION.TAGS.MAX_COUNT} tags`,
        'string.max': `Mỗi tag không được vượt quá ${config.VALIDATION.TAGS.MAX_LENGTH} ký tự`,
        'string.pattern.base': 'Tag chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới'
    });

// Create notification/event validation
const createNotificationSchema = Joi.object({
    title: titleSchema,
    content: contentSchema,
    type: Joi.string().valid('notification', 'event').required().messages({
        'any.only': 'Loại phải là "notification" hoặc "event"',
        'any.required': 'Loại là bắt buộc'
    }),
    category: Joi.string().valid('general', 'academic', 'extracurricular', 'urgent').default('general'),

    // Event-specific fields
    event_start_datetime: Joi.when('type', {
        is: 'event',
        then: Joi.date().iso().greater('now').required().messages({
            'date.greater': 'Thời gian bắt đầu sự kiện phải trong tương lai',
            'any.required': 'Thời gian bắt đầu là bắt buộc cho sự kiện'
        }),
        otherwise: Joi.forbidden()
    }),

    event_end_datetime: Joi.when('type', {
        is: 'event',
        then: Joi.date().iso().greater(Joi.ref('event_start_datetime')).messages({
            'date.greater': 'Thời gian kết thúc phải sau thời gian bắt đầu'
        }),
        otherwise: Joi.forbidden()
    }),

    location: Joi.when('type', {
        is: 'event',
        then: Joi.string().max(config.VALIDATION.LOCATION.MAX_LENGTH).allow(''),
        otherwise: Joi.forbidden()
    }),

    organizer: Joi.string().max(config.VALIDATION.ORGANIZER.MAX_LENGTH).allow(''),

    // Registration fields
    allow_registration: Joi.boolean().default(false),

    registration_deadline: Joi.when('allow_registration', {
        is: true,
        then: Joi.date().iso().less(Joi.ref('event_start_datetime')).required().messages({
            'date.less': 'Hạn đăng ký phải trước thời gian bắt đầu sự kiện',
            'any.required': 'Hạn đăng ký là bắt buộc khi cho phép đăng ký'
        }),
        otherwise: Joi.forbidden()
    }),

    max_participants: Joi.when('allow_registration', {
        is: true,
        then: Joi.number().integer().positive().max(10000).messages({
            'number.positive': 'Số lượng tối đa phải là số dương',
            'number.max': 'Số lượng tối đa không được vượt quá 10,000'
        }),
        otherwise: Joi.forbidden()
    }),

    registration_fee: Joi.when('allow_registration', {
        is: true,
        then: Joi.number().min(0).max(10000000).precision(2).default(0).messages({
            'number.min': 'Phí đăng ký không được âm',
            'number.max': 'Phí đăng ký không được vượt quá 10,000,000'
        }),
        otherwise: Joi.number().valid(0).default(0) // ✅ chấp nhận giá trị 0 khi không cho phép đăng ký
    }),


    // File paths (will be set by file upload middleware)
    image_path: Joi.string().uri().allow(''),
    attachment_path: Joi.string().uri().allow(''),

    // Targeting and metadata
    target_audience: targetAudienceSchema.required(),
    publish_date: Joi.date().iso().messages({
        'date.base': 'Ngày đăng phải là ngày hợp lệ'
    }).allow('').optional(),
    status: Joi.string().valid('draft', 'published').default('draft'),
    is_priority: Joi.boolean().default(false),
    tags: tagsSchema
});

// Update notification/event validation
const updateNotificationSchema = Joi.object({
    title: titleSchema.optional(),
    content: contentSchema.optional(),
    category: Joi.string().valid('general', 'academic', 'extracurricular', 'urgent'),

    // Event-specific fields
    event_start_datetime: Joi.date().iso().greater('now').messages({
        'date.greater': 'Thời gian bắt đầu sự kiện phải trong tương lai'
    }),

    event_end_datetime: Joi.date().iso().greater(Joi.ref('event_start_datetime')).messages({
        'date.greater': 'Thời gian kết thúc phải sau thời gian bắt đầu'
    }),

    location: Joi.string().max(config.VALIDATION.LOCATION.MAX_LENGTH).allow(''),
    organizer: Joi.string().max(config.VALIDATION.ORGANIZER.MAX_LENGTH).allow(''),

    // Registration fields
    allow_registration: Joi.boolean(),

    registration_deadline: Joi.date().iso().messages({
        'date.base': 'Hạn đăng ký phải là ngày hợp lệ'
    }),

    max_participants: Joi.number().integer().positive().max(10000).messages({
        'number.positive': 'Số lượng tối đa phải là số dương',
        'number.max': 'Số lượng tối đa không được vượt quá 10,000'
    }),

    registration_fee: Joi.number().min(0).max(10000000).precision(2).messages({
        'number.min': 'Phí đăng ký không được âm',
        'number.max': 'Phí đăng ký không được vượt quá 10,000,000'
    }),

    // File paths
    image_path: Joi.string().uri().allow(''),
    attachment_path: Joi.string().uri().allow(''),

    // Targeting and metadata
    target_audience: targetAudienceSchema,
    publish_date: Joi.date().iso().messages({
        'date.base': 'Ngày đăng phải là ngày hợp lệ'
    }).allow('').optional(),
    status: Joi.string().valid('draft', 'published', 'archived', 'cancelled'),
    is_priority: Joi.boolean(),
    tags: tagsSchema
}).min(1).messages({
    'object.min': 'Ít nhất một trường cần được cập nhật'
});

// Event registration validation
const eventRegistrationSchema = Joi.object({
    notes: Joi.string().max(config.VALIDATION.NOTES.MAX_LENGTH).allow('').messages({
        'string.max': `Ghi chú không được vượt quá ${config.VALIDATION.NOTES.MAX_LENGTH} ký tự`
    })
});

// Query parameters validation
const getNotificationsQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(config.PAGINATION.MAX_PAGE_SIZE).default(config.PAGINATION.DEFAULT_PAGE_SIZE),
    type: Joi.string().valid('notification', 'event'),
    category: Joi.string().valid('general', 'academic', 'extracurricular', 'urgent'),
    priority: Joi.boolean(),
    status: Joi.string().valid('draft', 'published', 'archived', 'cancelled')
});

// Registration status update validation
const updateRegistrationStatusSchema = Joi.object({
    status: Joi.string().valid('registered', 'confirmed', 'attended', 'absent', 'cancelled').required().messages({
        'any.only': 'Trạng thái không hợp lệ',
        'any.required': 'Trạng thái là bắt buộc'
    }),
    admin_notes: Joi.string().max(config.VALIDATION.NOTES.MAX_LENGTH).allow('').messages({
        'string.max': `Ghi chú admin không được vượt quá ${config.VALIDATION.NOTES.MAX_LENGTH} ký tự`
    })
});

// File upload validation
const validateImageFile = (file) => {
    if (!file) return { isValid: true };

    const errors = [];

    // Check file size
    if (file.size > config.UPLOAD_SETTINGS.MAX_IMAGE_SIZE) {
        errors.push(`Kích thước ảnh không được vượt quá ${config.UPLOAD_SETTINGS.MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!config.UPLOAD_SETTINGS.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        errors.push('Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận: JPG, PNG, GIF, WebP');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateAttachmentFile = (file) => {
    if (!file) return { isValid: true };

    const errors = [];

    // Check file size
    if (file.size > config.UPLOAD_SETTINGS.MAX_ATTACHMENT_SIZE) {
        errors.push(`Kích thước file đính kèm không được vượt quá ${config.UPLOAD_SETTINGS.MAX_ATTACHMENT_SIZE / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!config.UPLOAD_SETTINGS.ALLOWED_ATTACHMENT_TYPES.includes(file.mimetype)) {
        errors.push('Định dạng file không được hỗ trợ. Chỉ chấp nhận: PDF, DOC, XLS, PPT, TXT, ZIP, RAR');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    createNotificationSchema,
    updateNotificationSchema,
    eventRegistrationSchema,
    getNotificationsQuerySchema,
    updateRegistrationStatusSchema,
    validateImageFile,
    validateAttachmentFile
};