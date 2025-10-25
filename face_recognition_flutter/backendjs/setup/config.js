/**
 * Configuration module for setup script
 * 
 * Centralized configuration management for the setup process
 */

const path = require('path');

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');

// Database configuration
const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '12345678',
    database: process.env.DB_NAME || 'face_attendance',
    charset: 'utf8mb4',
    timezone: '+00:00',
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// Server configuration
const SERVER_CONFIG = {
    host: process.env.SERVER_HOST || 'localhost',
    port: parseInt(process.env.SERVER_PORT) || 8000,
    cors: {
        origins: process.env.ALLOWED_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000'
        ]
    }
};

// Paths configuration
const PATHS = {
    root: process.cwd(),
    src: path.join(process.cwd(), 'src'),
    migrations: path.join(process.cwd(), 'migrations'),
    uploads: path.join(process.cwd(), 'uploads'),
    dataset: path.join(process.cwd(), 'dataset'),
    trainer: path.join(process.cwd(), 'trainer'),
    models: path.join(process.cwd(), 'models'),
    logs: path.join(process.cwd(), 'logs'),
    public: path.join(process.cwd(), 'public')
};

// Required directories
const REQUIRED_DIRECTORIES = [
    'dataset',
    'trainer',
    'uploads',
    'models',
    'logs',
    'src',
    'src/routes',
    'src/services',
    'src/models',
    'src/utils',
    'src/middleware',
    'src/config',
    'src/controllers',
    'src/validators',
    'public',
    'migrations'
];

// NPM Dependencies
const DEPENDENCIES = {
    production: [
        'express@4.18.2',
        'mysql2@3.6.3',
        'bcrypt@5.1.1',
        'jsonwebtoken@9.0.2',
        'multer@1.4.5-lts.1',
        'cors@2.8.5',
        'dotenv@16.3.1',
        'helmet@7.1.0',
        'morgan@1.10.0',
        'express-rate-limit@7.1.5',
        'joi@17.11.0',
        'axios@1.6.0',
        'compression@1.7.4',
        'swagger-ui-express@4.6.3',
        'swagger-jsdoc@6.2.8',
        'winston@3.11.0',
        'express-validator@7.0.1',
        'commander@11.1.0'
    ],
    development: [
        'nodemon@3.0.1',
        'jest@29.7.0',
        'supertest@6.3.3',
        '@types/node@20.8.0',
        'eslint@8.52.0',
        'prettier@3.0.3'
    ]
};

// Test users
const TEST_USERS = {
    admin: { 
        username: 'admin', 
        password: 'admin123',
        email: 'admin@school.edu',
        full_name: 'System Administrator'
    },
    teacher: { 
        username: 'teacher1', 
        password: 'teacher123',
        email: 'teacher1@school.edu',
        full_name: 'Nguyễn Văn A'
    },
    student: { 
        username: 'student1', 
        password: 'student123',
        email: 'student1@school.edu',
        full_name: 'Lê Văn C'
    }
};

// File templates and configurations
const FILE_TEMPLATES = {
    env: {
        development: `# Development Environment Configuration
NODE_ENV=development
DEBUG=true

# Database Configuration
DB_HOST=${DB_CONFIG.host}
DB_PORT=${DB_CONFIG.port}
DB_USER=${DB_CONFIG.user}
DB_PASSWORD=${DB_CONFIG.password}
DB_NAME=${DB_CONFIG.database}

# JWT Configuration
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRE=24h

# Server Configuration
PORT=${SERVER_CONFIG.port}
HOST=${SERVER_CONFIG.host}

# File Paths
DATASET_PATH=dataset
TRAINER_PATH=trainer/trainer.yml
FACE_CASCADE_PATH=models/haarcascade_frontalface_default.xml
UPLOAD_PATH=uploads
LOGS_PATH=logs

# Face Recognition
CONFIDENCE_THRESHOLD=50

# CORS
ALLOWED_ORIGINS=${SERVER_CONFIG.cors.origins.join(',')}

# Logging
LOG_LEVEL=debug
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
`,
        production: `# Production Environment Configuration
NODE_ENV=production
DEBUG=false

# Database Configuration
DB_HOST=${DB_CONFIG.host}
DB_PORT=${DB_CONFIG.port}
DB_USER=${DB_CONFIG.user}
DB_PASSWORD=${DB_CONFIG.password}
DB_NAME=${DB_CONFIG.database}

# JWT Configuration
JWT_SECRET=CHANGE-THIS-IN-PRODUCTION-TO-SECURE-RANDOM-STRING
JWT_EXPIRE=8h

# Server Configuration
PORT=${SERVER_CONFIG.port}
HOST=0.0.0.0

# File Paths
DATASET_PATH=dataset
TRAINER_PATH=trainer/trainer.yml
FACE_CASCADE_PATH=models/haarcascade_frontalface_default.xml
UPLOAD_PATH=uploads
LOGS_PATH=logs

# Face Recognition
CONFIDENCE_THRESHOLD=70

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info
LOG_MAX_SIZE=50m
LOG_MAX_FILES=10

# Security
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
`
    }
};

// External resources
const EXTERNAL_RESOURCES = {
    haarcascade: {
        url: 'https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml',
        path: 'models/haarcascade_frontalface_default.xml'
    }
};

// Computed properties
const SERVER_URL = `http://${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`;

module.exports = {
    // Environment
    isDevelopment,
    isProduction,
    
    // Main configs
    DB_CONFIG,
    SERVER_CONFIG,
    SERVER_URL,
    
    // Paths
    PATHS,
    REQUIRED_DIRECTORIES,
    
    // Dependencies
    DEPENDENCIES,
    
    // Users and templates
    TEST_USERS,
    FILE_TEMPLATES,
    
    // External resources
    EXTERNAL_RESOURCES,
    
    // Helper functions
    getEnvTemplate: (mode = 'development') => {
        return FILE_TEMPLATES.env[mode] || FILE_TEMPLATES.env.development;
    },
    
    getDatabaseUrl: () => {
        return `mysql://${DB_CONFIG.user}:${DB_CONFIG.password}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`;
    },
    
    getServerUrl: (path = '') => {
        return `${SERVER_URL}${path}`;
    }
};