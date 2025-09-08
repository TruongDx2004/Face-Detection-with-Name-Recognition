// Cấu hình constants cho ứng dụng
module.exports = {
    // Roles
    USER_ROLES: {
        ADMIN: 'admin',
        TEACHER: 'teacher',
        STUDENT: 'student'
    },

    // Attendance status
    ATTENDANCE_STATUS: {
        PRESENT: 'present',
        ABSENT: 'absent',
        LATE: 'late',
        EXCUSED: 'excused'
    },

    // Session status
    SESSION_STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    },

    // File upload limits
    FILE_LIMITS: {
        IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
        VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
        ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/avi', 'video/mov']
    },

    // Face recognition
    FACE_RECOGNITION: {
        CONFIDENCE_THRESHOLD: process.env.CONFIDENCE_THRESHOLD || 50,
        DATASET_PATH: process.env.DATASET_PATH || 'dataset',
        TRAINER_PATH: process.env.TRAINER_PATH || 'trainer/trainer.yml',
        FACE_CASCADE_PATH: process.env.FACE_CASCADE_PATH || 'models/haarcascade_frontalface_default.xml'
    },

    // Pagination
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 10,
        MAX_LIMIT: 100
    },

    // JWT
    JWT: {
        SECRET: process.env.JWT_SECRET || 'your-secret-key',
        EXPIRE: process.env.JWT_EXPIRE || '24h'
    },

    // Database
    DATABASE: {
        HOST: process.env.DB_HOST || 'localhost',
        PORT: process.env.DB_PORT || 3306,
        USER: process.env.DB_USER || 'root',
        PASSWORD: process.env.DB_PASSWORD || '',
        NAME: process.env.DB_NAME || 'face_attendance'
    },

    // Server
    SERVER: {
        PORT: process.env.PORT || 8000,
        NODE_ENV: process.env.NODE_ENV || 'development'
    },

    // CORS
    CORS: {
        ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? 
            process.env.ALLOWED_ORIGINS.split(',') : 
            ['http://localhost:3000', 'http://localhost:3001']
    },

    // Paths
    PATHS: {
        UPLOADS: process.env.UPLOAD_PATH || 'uploads',
        ATTENDANCE_IMAGES: 'uploads/attendance',
        FACE_DATASET: 'dataset',
        LOGS: 'logs'
    },

    // Error messages
    ERROR_MESSAGES: {
        UNAUTHORIZED: 'Unauthorized access',
        FORBIDDEN: 'Insufficient permissions',
        NOT_FOUND: 'Tính năng đang được phát triển',
        VALIDATION_ERROR: 'Validation error',
        INTERNAL_ERROR: 'Internal server error',
        FACE_NOT_RECOGNIZED: 'Face not recognized',
        MODEL_NOT_TRAINED: 'Face recognition model not trained',
        SESSION_NOT_ACTIVE: 'Attendance session is not active',
        ALREADY_MARKED: 'Attendance already marked for this session'
    },

    // Success messages
    SUCCESS_MESSAGES: {
        LOGIN_SUCCESS: 'Login successful',
        REGISTER_SUCCESS: 'User registered successfully',
        FACE_REGISTER_SUCCESS: 'Face registration successful',
        ATTENDANCE_MARKED: 'Attendance marked successfully',
        MODEL_TRAINED: 'Model training completed successfully',
        SESSION_CREATED: 'Attendance session created successfully'
    }
};