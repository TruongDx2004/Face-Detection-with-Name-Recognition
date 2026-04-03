/**
 * File management module
 * 
 * Handles creation of directories, configuration files, and application files
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const config = require('./config');
const logger = require('./logger');

class FileManager {
    constructor() {
        this.createdFiles = [];
        this.createdDirectories = [];
    }

    /**
     * Create all required directories
     */
    async createDirectories() {
        try {
            logger.printStep('CREATING DIRECTORY STRUCTURE');
            
            let created = 0;
            const total = config.REQUIRED_DIRECTORIES.length;
            
            for (const directory of config.REQUIRED_DIRECTORIES) {
                try {
                    await fs.mkdir(directory, { recursive: true });
                    this.createdDirectories.push(directory);
                    created++;
                    logger.printProgress(created, total, `Creating ${directory}`);
                } catch (error) {
                    logger.printWarning(`Failed to create directory ${directory}: ${error.message}`);
                }
            }
            
            logger.printSuccess(`Created ${created}/${total} directories`);
            return true;
            
        } catch (error) {
            logger.printError(`Directory creation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create environment configuration file
     */
    async createEnvFile(options = {}) {
        try {
            logger.printInfo('Creating environment configuration...');
            
            const mode = options.production ? 'production' : 'development';
            const envContent = config.getEnvTemplate(mode);
            
            // Don't overwrite existing .env unless reset is specified
            if (!options.reset) {
                try {
                    await fs.access('.env');
                    logger.printInfo('.env file already exists, skipping...');
                    return true;
                } catch {
                    // File doesn't exist, proceed with creation
                }
            }
            
            await fs.writeFile('.env', envContent, 'utf-8');
            this.createdFiles.push('.env');
            
            logger.printSuccess(`.env file created for ${mode} mode`);
            return true;
            
        } catch (error) {
            logger.printError(`Environment file creation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Download external resources
     */
    async downloadExternalResources() {
        try {
            logger.printStep('DOWNLOADING EXTERNAL RESOURCES');
            
            const resources = Object.values(config.EXTERNAL_RESOURCES);
            let downloaded = 0;
            
            for (const resource of resources) {
                try {
                    // Check if file already exists
                    try {
                        await fs.access(resource.path);
                        logger.printDebug(`Resource already exists: ${resource.path}`);
                        downloaded++;
                        continue;
                    } catch {
                        // File doesn't exist, download it
                    }
                    
                    logger.printInfo(`Downloading ${path.basename(resource.path)}...`);
                    
                    // Ensure directory exists
                    const dir = path.dirname(resource.path);
                    await fs.mkdir(dir, { recursive: true });
                    
                    // Download file
                    const response = await axios.get(resource.url, {
                        responseType: 'stream',
                        timeout: 30000
                    });
                    
                    const writer = require('fs').createWriteStream(resource.path);
                    response.data.pipe(writer);
                    
                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });
                    
                    downloaded++;
                    logger.printProgress(downloaded, resources.length, `Downloaded ${path.basename(resource.path)}`);
                    
                } catch (error) {
                    logger.printError(`Failed to download ${resource.path}: ${error.message}`);
                    throw error;
                }
            }
            
            logger.printSuccess(`Downloaded ${downloaded} external resources`);
            return true;
            
        } catch (error) {
            logger.printError(`External resource download failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create application configuration files
     */
    async createConfigFiles(options = {}) {
        try {
            logger.printStep('CREATING CONFIGURATION FILES');
            
            // Create .env file
            await this.createEnvFile(options);
            
            // Create .gitignore
            await this.createGitignore();
            
            // Create database config
            await this.createDatabaseConfig();
            
            // Create app config
            await this.createAppConfig();
            
            // Create logging config
            await this.createLoggingConfig();
            
            // Download external resources
            await this.downloadExternalResources();
            
            logger.printSuccess('Configuration files created successfully');
            return true;
            
        } catch (error) {
            logger.printError(`Configuration file creation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create .gitignore file
     */
    async createGitignore() {
        const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
.nyc_output/

# Uploads and user data
uploads/*
!uploads/.gitkeep
dataset/*
!dataset/.gitkeep
trainer/*
!trainer/.gitkeep

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
tmp/
temp/

# Build outputs
dist/
build/

# Cache
.cache/
.npm/
.eslintcache

# Database
*.sqlite
*.db

# SSL certificates
*.pem
*.key
*.crt
`;

        await fs.writeFile('.gitignore', gitignoreContent);
        this.createdFiles.push('.gitignore');
        logger.printDebug('Created .gitignore');
    }

    /**
     * Create database configuration
     */
    async createDatabaseConfig() {
        const dbConfigContent = `const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'face_attendance',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    charset: 'utf8mb4',
    timezone: '+00:00'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection function
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        console.log('✅ Database connection successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Closing database connections...');
    await pool.end();
    process.exit(0);
});

module.exports = {
    pool,
    testConnection,
    config: dbConfig
};
`;

        await fs.writeFile('src/config/database.js', dbConfigContent);
        this.createdFiles.push('src/config/database.js');
        logger.printDebug('Created database config');
    }

    /**
     * Create application configuration
     */
    async createAppConfig() {
        const appConfigContent = `require('dotenv').config();

const config = {
    // Server configuration
    server: {
        port: parseInt(process.env.PORT) || 8000,
        host: process.env.HOST || 'localhost',
        env: process.env.NODE_ENV || 'development'
    },

    // Database configuration
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'face_attendance'
    },

    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'fallback-secret-key',
        expiresIn: process.env.JWT_EXPIRE || '24h'
    },

    // File paths
    paths: {
        uploads: process.env.UPLOAD_PATH || 'uploads',
        dataset: process.env.DATASET_PATH || 'dataset',
        trainer: process.env.TRAINER_PATH || 'trainer/trainer.yml',
        cascade: process.env.FACE_CASCADE_PATH || 'models/haarcascade_frontalface_default.xml',
        logs: process.env.LOGS_PATH || 'logs'
    },

    // Face recognition settings
    faceRecognition: {
        confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD) || 50,
        maxFaceSize: 300,
        minFaceSize: 30
    },

    // CORS settings
    cors: {
        origins: process.env.ALLOWED_ORIGINS ? 
            process.env.ALLOWED_ORIGINS.split(',') : 
            ['http://localhost:3000', 'http://127.0.0.1:3000']
    },

    // Rate limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // limit each IP to 100 requests per windowMs
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        maxSize: process.env.LOG_MAX_SIZE || '10m',
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
    },

    // Security
    security: {
        bcryptRounds: 10,
        sessionSecret: process.env.SESSION_SECRET || 'session-secret',
        uploadMaxSize: 10 * 1024 * 1024 // 10MB
    }
};

// Validation
function validateConfig() {
    const required = [
        'database.host',
        'database.user',
        'database.database',
        'jwt.secret'
    ];

    for (const key of required) {
        const value = key.split('.').reduce((obj, k) => obj && obj[k], config);
        if (!value) {
            throw new Error(\`Missing required configuration: \${key}\`);
        }
    }

    return true;
}

// Export
module.exports = {
    ...config,
    validateConfig,
    isDevelopment: config.server.env === 'development',
    isProduction: config.server.env === 'production'
};
`;

        await fs.writeFile('src/config/app.js', appConfigContent);
        this.createdFiles.push('src/config/app.js');
        logger.printDebug('Created app config');
    }

    /**
     * Create logging configuration
     */
    async createLoggingConfig() {
        const loggingConfigContent = `const winston = require('winston');
const path = require('path');
const config = require('./app');

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync(config.paths.logs)) {
    fs.mkdirSync(config.paths.logs, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        return \`\${timestamp} [\${level}]: \${stack || message}\`;
    })
);

// Create logger
const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'face-attendance-api' },
    transports: [
        // Error log
        new winston.transports.File({
            filename: path.join(config.paths.logs, 'error.log'),
            level: 'error',
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles
        }),
        // Combined log
        new winston.transports.File({
            filename: path.join(config.paths.logs, 'combined.log'),
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles
        })
    ]
});

// Add console transport in development
if (config.isDevelopment) {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Stream for Morgan HTTP logging
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

module.exports = logger;
`;

        await fs.writeFile('src/config/logger.js', loggingConfigContent);
        this.createdFiles.push('src/config/logger.js');
        logger.printDebug('Created logging config');
    }

    /**
     * Create placeholder files to keep directories in git
     */
    async createPlaceholderFiles() {
        const directories = ['uploads', 'dataset', 'trainer', 'logs'];
        
        for (const dir of directories) {
            try {
                await fs.writeFile(path.join(dir, '.gitkeep'), '# Keep this directory in git\n');
                logger.printDebug(`Created .gitkeep in ${dir}`);
            } catch (error) {
                logger.printWarning(`Failed to create .gitkeep in ${dir}: ${error.message}`);
            }
        }
    }

    /**
     * Create main application files
     */
    async createApplicationFiles(options = {}) {
        try {
            logger.printStep('CREATING APPLICATION FILES');
            
            // Create main server file
            await this.createServerFile(options);
            
            // Create middleware files
            await this.createMiddlewareFiles();
            
            // Create route files
            await this.createRouteFiles();
            
            // Create controller files
            await this.createControllerFiles();
            
            // Create service files
            await this.createServiceFiles();
            
            // Create utility files
            await this.createUtilityFiles();
            
            // Create placeholder files
            await this.createPlaceholderFiles();
            
            logger.printSuccess('Application files created successfully');
            return true;
            
        } catch (error) {
            logger.printError(`Application file creation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create main server file
     */
    async createServerFile(options = {}) {
        const serverContent = `require('dotenv').config();

const App = require('./config/app');
const { SERVER } = require('./config/constants');
const { logger } = require('./middleware/logger');

// Tạo app instance
const appInstance = new App();
const app = appInstance.getApp();

const PORT = SERVER.PORT;
const HOST = SERVER.HOST || 'localhost';

// Khởi động server
const server = app.listen(PORT, HOST, () => {
    logger.info(\`🚀 Server is running on http://\${HOST}:\${PORT}\`);
    logger.info(\`📚 API Documentation: http://\${HOST}:\${PORT}/docs\`);
    logger.info(\`🏥 Health Check: http://\${HOST}:\${PORT}/health\`);
    logger.info(\`🌍 Environment: \${SERVER.NODE_ENV}\`);
    
    // Log additional server information
    if (SERVER.NODE_ENV === 'development') {
        logger.info(\`📱 Flutter App can connect to: http://\${HOST}:\${PORT}\`);
        logger.info(\`🔗 CORS Origins: \${JSON.stringify(require('./config/constants').CORS.ALLOWED_ORIGINS)}\`);
    }
});

// Enhanced error handling for server startup
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

    switch (error.code) {
        case 'EACCES':
            logger.error(\`\${bind} requires elevated privileges\`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger.error(\`\${bind} is already in use\`);
            process.exit(1);
            break;
        default:
            logger.error('Server startup error:', error);
            throw error;
    }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    logger.info(\`\${signal} received. Shutting down gracefully...\`);
    
    server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
            // Close database connections if available
            const database = require('./config/database');
            if (database && database.pool) {
                await database.pool.end();
                logger.info('Database connections closed');
            }
        } catch (error) {
            logger.error('Error closing database connections:', error);
        }
        
        logger.info('Process terminated gracefully');
        process.exit(0);
    });

    // Force close server after 10 seconds
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    logger.error('Stack:', err.stack);
    
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    logger.error('Stack:', err.stack);
    process.exit(1);
});

// Export app for testing purposes
module.exports = app;
`;

        await fs.writeFile('src/server.js', serverContent);
        this.createdFiles.push('src/server.js');
        logger.printDebug('Created main server file with App class architecture');
    }

    /**
     * Create middleware files (will be implemented in next iteration)
     */
    async createMiddlewareFiles() {
        // Implementation will be added in next response
        logger.printDebug('Middleware creation scheduled for next iteration');
    }

    /**
     * Create route files (will be implemented in next iteration)
     */
    async createRouteFiles() {
        // Implementation will be added in next response
        logger.printDebug('Route creation scheduled for next iteration');
    }

    /**
     * Create controller files (will be implemented in next iteration)
     */
    async createControllerFiles() {
        // Implementation will be added in next response
        logger.printDebug('Controller creation scheduled for next iteration');
    }

    /**
     * Create service files (will be implemented in next iteration)
     */
    async createServiceFiles() {
        // Implementation will be added in next response
        logger.printDebug('Service creation scheduled for next iteration');
    }

    /**
     * Create utility files (will be implemented in next iteration)
     */
    async createUtilityFiles() {
        // Implementation will be added in next response
        logger.printDebug('Utility creation scheduled for next iteration');
    }

    /**
     * Get summary of created files
     */
    getSummary() {
        return {
            directories: this.createdDirectories.length,
            files: this.createdFiles.length,
            createdDirectories: this.createdDirectories,
            createdFiles: this.createdFiles
        };
    }
}

// Export singleton instance
module.exports = new FileManager();