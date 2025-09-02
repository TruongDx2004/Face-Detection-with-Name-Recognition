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

// Import old routes (to be migrated)
const classRoutes = require('../routes/class');
const subjectRoutes = require('../routes/subject');

const { swaggerUi, swaggerSpec } = require('../swagger');

class App {
    constructor() {
        this.app = express();
        this.setupDirectories();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
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
        this.app.use(limiter);

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

        // Legacy routes (to be migrated)
        this.app.use('/api/classes', classRoutes);
        this.app.use('/api/subjects', subjectRoutes);

        // Backward compatibility
        this.app.use('/auth', authRoutes);
        this.app.use('/face', faceRoutes);
        this.app.use('/attendance', attendanceRoutes);
        this.app.use('/admin', adminRoutes);
        this.app.use('/classes', classRoutes);
        this.app.use('/subjects', subjectRoutes);
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