const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const { CORS, SERVER, PATHS } = require('./constants');
const { accessLogger, errorLogger, consoleLogger } = require('../middleware/logger');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

// Import routes
const authRoutes = require('../routes/authRoutes');
const faceRoutes = require('../routes/faceRoutes');
const attendanceRoutes = require('../routes/attendanceRoutes');
const adminRoutes = require('../routes/adminRoutes');
const classRoutes = require('../routes/classRoutes');
const subjectRoutes = require('../routes/subjectRoutes');
const courseSectionRoutes = require('../routes/courseSectionRoutes');
const scheduleRoutes = require('../routes/scheduleRoutes');
const assignmentRoutes = require('../routes/assignmentRoutes');
const assignmentTemplateRoutes = require('../routes/assignmentTemplateRoutes');
const examTemplateRoutes = require('../routes/examTemplateRoutes');
const examRoutes = require('../routes/examRoutes');
const gradebookRoutes = require('../routes/gradebookRoutes');
const studentGradeRoutes = require('../routes/studentGradeRoutes');
const { router: notificationRoutes, initializeController } = require('../routes/notificationRoutes');
const chatRoutes = require('../routes/chatRoutes');

// Import old routes (to be migrated)
// const oldAttendanceRoutes = require('../routes/attendance'); // REMOVED - migrated to attendanceRoutes

const { swaggerUi, swaggerSpec } = require('../swagger');
const { initializeNotificationModels } = require('../middleware/modelInitializer');

class App {
    constructor() {
        this.app = express();
        this.setupDirectories();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        this.initializeModels();
    }

    // Initialize models and services
    initializeModels() {
        try {
            // Initialize notification models
            const models = initializeNotificationModels();
            
            // Initialize notification controller with models
            initializeController(models);
            
            console.log('✅ All models initialized successfully');
        } catch (error) {
            console.error('❌ Model initialization failed:', error);
        }
    }

    // Tạo các thư mục cần thiết
    setupDirectories() {
        const directories = [
            PATHS.UPLOADS,
            PATHS.ATTENDANCE_IMAGES,
            PATHS.FACE_DATASET,
            PATHS.LOGS,
            'trainer'
        ];

        directories.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Created directory: ${dir}`);
            }
        });
    }

    // Cấu hình middleware
    setupMiddleware() {
        // CORS configuration
        this.app.use(cors({
            origin: function (origin, callback) {
                // Allow requests with no origin (mobile apps, Postman, etc.)
                if (!origin) return callback(null, true);
                
                // Check if origin is in allowed list
                if (CORS.ALLOWED_ORIGINS.includes(origin) || 
                    origin.startsWith('http://localhost') ||
                    origin.startsWith('http://127.0.0.1')) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));

        // Security middleware
        this.app.use(helmet({
            crossOriginResourcePolicy: { policy: "cross-origin" }
        }));
        this.app.use(compression());

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: {
                error: 'Too many requests',
                message: 'Please try again later'
            },
            standardHeaders: true,
            legacyHeaders: false
        });
        //this.app.use(limiter);

        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Logging middleware
        if (SERVER.NODE_ENV === 'production') {
            this.app.use(accessLogger);
            this.app.use(errorLogger);
        } else {
            this.app.use(consoleLogger);
        }

        // Static files
        this.app.use('/uploads', express.static(PATHS.UPLOADS));
        this.app.use('/public', express.static('public'));
    }

    // Cấu hình routes
    setupRoutes() {
        // API Documentation
        this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: SERVER.NODE_ENV,
                version: process.env.npm_package_version || '1.0.0'
            });
        });

        // API routes
        this.app.get('/', (req, res) => {
            res.json({
                message: 'Face Attendance API Server',
                version: '1.0.0',
                status: 'running',
                documentation: '/docs',
                health: '/health'
            });
        });

        // Main API routes
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/face', faceRoutes);
        this.app.use('/api/attendance', attendanceRoutes);
        this.app.use('/api/admin', adminRoutes);
        this.app.use('/api/classes', classRoutes);
        this.app.use('/api/subjects', subjectRoutes);
        this.app.use('/api/course-sections', courseSectionRoutes);
        this.app.use('/api/schedules', scheduleRoutes);
        this.app.use('/api/assignments', assignmentRoutes);
        this.app.use('/api/assignment-templates', assignmentTemplateRoutes);
        this.app.use('/api/exam-templates', examTemplateRoutes);
        this.app.use('/api/exams', examRoutes);
        this.app.use('/api/gradebook', gradebookRoutes);
        this.app.use('/api', studentGradeRoutes);
        this.app.use('/api/notifications', notificationRoutes);
        this.app.use('/api/chat', chatRoutes);

        // Legacy routes (to be migrated)
        // this.app.use('/api/attendance-old', oldAttendanceRoutes); // REMOVED - migrated to attendanceRoutes

        // Backward compatibility
        this.app.use('/auth', authRoutes);
        this.app.use('/face', faceRoutes);
        this.app.use('/attendance', attendanceRoutes);
        this.app.use('/admin', adminRoutes);
        this.app.use('/classes', classRoutes);
        this.app.use('/subjects', subjectRoutes);
        this.app.use('/course-sections', courseSectionRoutes);
        this.app.use('/schedules', scheduleRoutes);
        this.app.use('/assignments', assignmentRoutes);
        this.app.use('/assignment-templates', assignmentTemplateRoutes);
        this.app.use('/exam-templates', examTemplateRoutes);
        this.app.use('/exams', examRoutes);
        this.app.use('/gradebook', gradebookRoutes);
        this.app.use('/', studentGradeRoutes);
        this.app.use('/notifications', notificationRoutes);
        // this.app.use('/attendance-old', oldAttendanceRoutes); // REMOVED - migrated to attendanceRoutes
    }

    // Cấu hình error handling
    setupErrorHandling() {
        // 404 handler
        this.app.use('*', notFoundHandler);

        // Error handling middleware
        this.app.use(errorHandler);
    }

    // Lấy express app instance
    getApp() {
        return this.app;
    }
}

module.exports = App;