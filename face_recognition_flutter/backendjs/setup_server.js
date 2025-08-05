// setup_server.js
/**
 * Script to setup and run Face Attendance API Server with Express.js
 */

const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const axios = require('axios');
const { spawn } = require('child_process');

// ========================================
// CONFIGURATION
// ========================================

// Database config
const DB_CONFIG = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345678', // Change to your password
    database: 'face_attendance'
};

// Server config
const SERVER_HOST = 'localhost';
const SERVER_PORT = 8000;
const SERVER_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;

// Test credentials
const TEST_USERS = {
    admin: { username: 'admin', password: 'admin123' },
    teacher: { username: 'teacher1', password: 'teacher123' },
    student: { username: 'student1', password: 'student123' }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

function printStep(stepName) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🔄 ${stepName}`);
    console.log(`${'='.repeat(50)}`);
}

function printSuccess(message) {
    console.log(`✅ ${message}`);
}

function printError(message) {
    console.log(`❌ ${message}`);
}

function printInfo(message) {
    console.log(`ℹ️ ${message}`);
}

async function createDirectories() {
    printStep("CREATING DIRECTORIES");
    
    const directories = [
        'dataset',
        'trainer',
        'uploads',
        'models',
        'src',
        'src/routes',
        'src/services',
        'src/models',
        'src/utils',
        'src/middleware',
        'src/config',
        'public'
    ];
    
    for (const directory of directories) {
        try {
            await fs.mkdir(directory, { recursive: true });
            printSuccess(`Created directory: ${directory}`);
        } catch (error) {
            printError(`Failed to create directory ${directory}: ${error.message}`);
        }
    }
}

async function checkMySQLConnection() {
    printStep("CHECKING MYSQL CONNECTION");
    
    try {
        // Test connection without database first
        const config = { ...DB_CONFIG };
        delete config.database;
        
        const connection = await mysql.createConnection(config);
        await connection.ping();
        printSuccess("MySQL connection successful");
        await connection.end();
        return true;
    } catch (error) {
        printError(`MySQL connection failed: ${error.message}`);
        printInfo("Make sure MySQL is running and credentials are correct");
        return false;
    }
}

async function setupDatabase() {
    printStep("SETTING UP DATABASE");

    try {
        // Kết nối ban đầu không có database để tạo/drop
        const baseConfig = { ...DB_CONFIG };
        delete baseConfig.database;
        const connection = await mysql.createConnection(baseConfig);

        // DROP rồi CREATE database bằng query (không dùng execute)
        await connection.query(`DROP DATABASE IF EXISTS \`${DB_CONFIG.database}\``);
        await connection.query(
            `CREATE DATABASE \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        printSuccess(`Database '${DB_CONFIG.database}' created`);

        await connection.end();

        // Mở lại connection đã có database
        const dbConnection = await mysql.createConnection({
            ...DB_CONFIG,
            // nếu dùng mysql2, để chạy nhiều câu trong một chuỗi cần bật multipleStatements nếu có dùng dạng như vậy
            // multipleStatements: true,
        });

        // Tạo bảng (dùng execute vì có thể dùng prepared-style an toàn)
        const sqlStatements = [
            `CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE,
                role ENUM('student', 'teacher', 'admin') NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                face_trained BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,

            `CREATE TABLE IF NOT EXISTS classes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(50) UNIQUE NOT NULL
            )`,

            `CREATE TABLE IF NOT EXISTS class_students (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                class_id INT NOT NULL,
                student_code VARCHAR(20) UNIQUE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
            )`,

            `CREATE TABLE IF NOT EXISTS subjects (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL
            )`,

            `CREATE TABLE IF NOT EXISTS schedules (
                id INT PRIMARY KEY AUTO_INCREMENT,
                class_id INT NOT NULL,
                subject_id INT NOT NULL,
                teacher_id INT NOT NULL,
                weekday TINYINT NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
            )`,

            `CREATE TABLE IF NOT EXISTS attendance_sessions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                schedule_id INT NOT NULL,
                session_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
            )`,

            `CREATE TABLE IF NOT EXISTS attendances (
                id INT PRIMARY KEY AUTO_INCREMENT,
                session_id INT NOT NULL,
                student_id INT NOT NULL,
                attendance_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                confidence_score FLOAT,
                image_path VARCHAR(255),
                status ENUM('present', 'late', 'absent') DEFAULT 'present',
                UNIQUE KEY unique_attendance (session_id, student_id),
                FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
            )`,

            `CREATE TABLE IF NOT EXISTS face_images (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                image_path VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`
            ];


        for (const statement of sqlStatements) {
            await dbConnection.execute(statement);
        }

        // Chèn dữ liệu mẫu
        const users = [
            { username: "admin", password: "admin123", full_name: "System Administrator", email: "admin@school.edu", role: "admin" },
            { username: "teacher1", password: "teacher123", full_name: "Nguyễn Văn A", email: "teacher1@school.edu", role: "teacher" },
            { username: "student1", password: "student123", full_name: "Lê Văn C", email: "student1@school.edu", role: "student", student_id: "SV001", class_name: "CNTT01" },
            { username: "student2", password: "student123", full_name: "Phạm Thị D", email: "student2@school.edu", role: "student", student_id: "SV002", class_name: "CNTT01" }
        ];

        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);

            if (user.role === 'student') {
                // 1. Đảm bảo lớp tồn tại
                let [classRows] = await dbConnection.execute(
                    'SELECT id FROM classes WHERE name = ?',
                    [user.class_name]
                );
                let class_id;
                if (classRows.length > 0) {
                    class_id = classRows[0].id;
                } else {
                    const [classResult] = await dbConnection.execute(
                        'INSERT INTO classes (name) VALUES (?)',
                        [user.class_name]
                    );
                    class_id = classResult.insertId;
                }

                // 2. Thêm user vào bảng users
                const [userResult] = await dbConnection.execute(
                    `INSERT INTO users (username, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?)`,
                    [user.username, hashedPassword, user.full_name, user.email, user.role]
                );
                const student_id = userResult.insertId;

                // 3. Thêm vào bảng class_students
                await dbConnection.execute(
                    `INSERT INTO class_students (student_id, class_id, student_code) VALUES (?, ?, ?)`,
                    [student_id, class_id, user.student_id]
                );         
                // 4. Thêm môm học
                const [subjectResult] = await dbConnection.execute(
                    'INSERT INTO subjects (name) VALUES (?)',
                    ['Python Programming']
                );
                const subject_id = subjectResult.insertId;

                // 5. Thêm lịch học
                await dbConnection.execute(
                    `INSERT INTO schedules (class_id, subject_id, teacher_id, weekday, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)`,
                    [class_id, subject_id, 2, 2, '09:00:00', '11:00:00']
                );

                 // 6. Thêm buổi học (attendance session)
                await dbConnection.execute(
                    `INSERT INTO attendance_sessions (schedule_id, session_date, start_time) VALUES (?, CURDATE(), ?)`,
                    [1, '09:00:00']
                ); 

            } else {
                await dbConnection.execute(
                    `INSERT INTO users (username, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?)`,
                    [user.username, hashedPassword, user.full_name, user.email, user.role]
                );
                
            }
        }

        printSuccess("Database tables created and sample data inserted");
        await dbConnection.end();
        return true;

    } catch (error) {
        printError(`Database setup failed: ${error.message}`);
        return false;
    }
}


function runCommand(command, args) {
    return new Promise((resolve, reject) => {
        const isWin = process.platform === 'win32';
        const actualCommand = isWin && !command.endsWith('.cmd') ? `${command}.cmd` : command;

        const child = spawn(actualCommand, args, {
            stdio: 'inherit',
            shell: true,
        });

        child.on('error', (error) => {
            reject(error);
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`${command} exited with code ${code}`));
            }
        });
    });
}

async function checkDependencies() {
    printStep("CHECKING DEPENDENCIES");
    
    const requiredPackages = [
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
        'swagger-jsdoc@6.2.8'
    ];
    
    printInfo("Installing required packages...");
    
    try {
        // Initialize package.json if it doesn't exist
        try {
            await fs.access('package.json');
        } catch {
            await runCommand('npm', ['init', '-y']);
        }
        printSuccess("package.json found or created successfully");
        
        // Install packages
        await runCommand('npm', ['install', ...requiredPackages]);
        printSuccess("Required packages installed successfully");
        
        // Install dev dependencies
        const devPackages = [
            'nodemon@3.0.1',
            'jest@29.7.0',
            'supertest@6.3.3'
        ];
        
        await runCommand('npm', ['install', '--save-dev', ...devPackages]);
        
        printSuccess("All packages installed successfully");
        return true;
        
    } catch (error) {
        printError(`Failed to install dependencies: ${error.message}`);
        return false;
    }
}

async function downloadCascadeFile() {
    printStep("DOWNLOADING HAAR CASCADE FILE");
    
    const cascadeUrl = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml";
    const cascadePath = "models/haarcascade_frontalface_default.xml";
    
    try {
        await fs.mkdir("models", { recursive: true });
        
        try {
            await fs.access(cascadePath);
            printSuccess("Haar cascade file already exists");
            return true;
        } catch {
            printInfo("Downloading haarcascade_frontalface_default.xml...");
            const response = await axios.get(cascadeUrl);
            await fs.writeFile(cascadePath, response.data);
            printSuccess("Haar cascade file downloaded");
            return true;
        }
        
    } catch (error) {
        printError(`Failed to download cascade file: ${error.message}`);
        return false;
    }
}

async function createEnvFile() {
    printStep("CREATING ENVIRONMENT FILE");
    
    const envContent = `# Database Configuration
DB_HOST=${DB_CONFIG.host}
DB_PORT=${DB_CONFIG.port}
DB_USER=${DB_CONFIG.user}
DB_PASSWORD=${DB_CONFIG.password}
DB_NAME=${DB_CONFIG.database}

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRE=24h

# Server Configuration
PORT=${SERVER_PORT}
NODE_ENV=development

# File Paths
DATASET_PATH=dataset
TRAINER_PATH=trainer/trainer.yml
FACE_CASCADE_PATH=models/haarcascade_frontalface_default.xml
UPLOAD_PATH=uploads

# Face Recognition
CONFIDENCE_THRESHOLD=50

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
`;
    
    await fs.writeFile('.env', envContent, 'utf-8');
    printSuccess("Environment file created: .env");
}

async function createPackageJsonScripts() {
    printStep("UPDATING PACKAGE.JSON SCRIPTS");
    
    try {
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
        
        packageJson.scripts = {
            ...packageJson.scripts,
            "start": "node src/server.js",
            "dev": "nodemon src/server.js",
            "test": "jest",
            "setup": "node setup_server.js"
        };
        
        packageJson.type = "commonjs";
        
        await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
        printSuccess("Package.json scripts updated");
        
    } catch (error) {
        printError(`Failed to update package.json: ${error.message}`);
    }
}

async function createExpressApp() {
    printStep("CREATING EXPRESS APPLICATION FILES");
    
    // Server.js
    const serverJs = `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const faceRoutes = require('./routes/face');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');
const { swaggerUi, swaggerSpec } = require('./swagger');


const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Static files
app.use('/uploads', express.static('uploads'));

// Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Face Attendance API Server',
        version: '1.0.0',
        status: 'running'
    });
});

app.use('/auth', authRoutes);
app.use('/face', faceRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});



app.use(cors({
  origin: 'http://localhost:50383',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(\`🚀 Server is running on http://localhost:\${PORT}\`);
    console.log(\`📚 API Documentation: http://localhost:\${PORT}/docs\`);
});

module.exports = app;
`;

    await fs.writeFile('src/server.js', serverJs);
    printSuccess("Created src/server.js");

    // Database config
    const dbConfigJs = `const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'face_attendance',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

module.exports = pool;
`;

    await fs.writeFile('src/config/database.js', dbConfigJs);
    printSuccess("Created src/config/database.js");
}

async function createTestScript() {
    printStep("CREATING TEST SCRIPT");
    
    const testScript = `#!/usr/bin/env node
    /**
     * Test script for Face Attendance API
     */
    
    const axios = require('axios');
    
    const SERVER_URL = "http://localhost:8000";
    
    async function testLogin() {
        console.log("Testing login...");
        
        try {
            const response = await axios.post(\`\${SERVER_URL}/auth/login\`, {
                username: "admin",
                password: "admin123"
            });
            
            if (response.status === 200) {
                console.log("✅ Admin login successful");
                return response.data.token;
            }
        } catch (error) {
            console.log(\`❌ Login failed: \${error.response?.data?.message || error.message}\`);
            return null;
        }
    }
    
    async function testProfile(token) {
        console.log("Testing profile...");
        
        try {
            const response = await axios.get(\`\${SERVER_URL}/auth/profile\`, {
                headers: { Authorization: \`Bearer \${token}\` }
            });
            
            if (response.status === 200) {
                const profile = response.data.data;
                console.log(\`✅ Profile: \${profile.full_name} (\${profile.role})\`);
            }
        } catch (error) {
            console.log(\`❌ Profile failed: \${error.response?.data?.message || error.message}\`);
        }
    }
    
    async function testCreateSession() {
        console.log("🔍 Testing attendance session creation...");
    
        try {
            // 1. Đăng nhập tài khoản giáo viên
            const teacherLogin = await axios.post(\`\${SERVER_URL}/auth/login\`, {
                username: "teacher1",
                password: "teacher123"
            });
    
            if (teacherLogin.status !== 200) throw new Error("Login failed");
    
            const teacherToken = teacherLogin.data.token;
    
            // 2. Dữ liệu khởi tạo: class_id và subject_id phải chính xác với dữ liệu database
            const sessionData = {
                class_id: 1,        // ID lớp học (ví dụ: CNTT01)
                subject_id: 2,      // ID môn học (ví dụ: Python Programming)
                start_time: "09:00:00" // Thời gian bắt đầu buổi học
            };
    
            // 3. Gửi request tạo session
            const response = await axios.post(
                \`\${SERVER_URL}/attendance/create-session\`,
                sessionData,
                {
                    headers: {
                        Authorization: \`Bearer \${teacherToken}\`
                    }
                }
            );
    
            if (response.status === 201) {
                const session = response.data;
                console.log(\`✅ Session created successfully. Session ID: \${session.session_id}\`);
                return session.session_id;
            } else {
                console.log(\`⚠️ Unexpected response status: \${response.status}\`);
            }
    
        } catch (error) {
            console.log(\`❌ Session creation failed: \${error.response?.data?.error || error.message}\`);
        }
    
        return null;
    }
    
    
    async function main() {
        console.log("🚀 Testing Face Attendance API");
        console.log("=" .repeat(40));
        
        // Test server is running
        try {
            const response = await axios.get(SERVER_URL);
            console.log(\`✅ Server is running: \${response.data.message}\`);
        } catch (error) {
            console.log("❌ Server is not running. Please start it first.");
            return;
        }
        
        // Test login
        const token = await testLogin();
        if (!token) {
            return;
        }
        
        // Test profile
        await testProfile(token);
        
        // Test session creation
        const sessionId = await testCreateSession(token);
        
        console.log("🎉 All tests completed!");
    }
    
    if (require.main === module) {
        main().catch(console.error);
    }
    
    module.exports = { testLogin, testProfile, testCreateSession };
`;
    
    await fs.writeFile('test_api.js', testScript);
    await fs.chmod('test_api.js', 0o755);
    printSuccess("Test script created: test_api.js");
}

async function main() {
    console.log("🚀 FACE ATTENDANCE SYSTEM SETUP (Express.js)");
    console.log("=".repeat(60));
    console.log("This script will setup the complete backend system with Express.js");
    console.log("=".repeat(60));
    
    try {
        // Step 1: Check MySQL connection
        if (!(await checkMySQLConnection())) {
            printError("Please install and configure MySQL first");
            return false;
        }
        
        // Step 2: Create directories
        await createDirectories();
        
        // Step 3: Check and install dependencies
        if (!(await checkDependencies())) {
            printError("Failed to install dependencies");
            return false;
        }
        
        // Step 4: Download required files
        if (!(await downloadCascadeFile())) {
            printError("Failed to download required files");
            return false;
        }
        
        // Step 5: Setup database
        if (!(await setupDatabase())) {
            printError("Failed to setup database");
            return false;
        }
        
        // Step 6: Create configuration files
        await createEnvFile();
        await createPackageJsonScripts();
        await createExpressApp();
        await createTestScript();
        
        // Final message
        printStep("SETUP COMPLETED SUCCESSFULLY! 🎉");
        printSuccess("Express.js backend system is ready to use");
        
        console.log("\\n" + "=".repeat(60));
        console.log("📋 NEXT STEPS:");
        console.log("=".repeat(60));
        console.log("1. Start the server:");
        console.log("   npm run dev");
        console.log("");
        console.log("2. Or start in production:");
        console.log("   npm start");
        console.log("");
        console.log("3. Test the API:");
        console.log("   node test_api.js");
        console.log("");
        console.log("4. Access the API:");
        console.log(`   ${SERVER_URL}`);
        console.log("");
        console.log("5. Default login credentials:");
        Object.entries(TEST_USERS).forEach(([role, creds]) => {
            console.log(`   ${role.charAt(0).toUpperCase() + role.slice(1)}: ${creds.username} / ${creds.password}`);
        });
        console.log("");
        console.log("📱 Ready to build React frontend!");
        console.log("=".repeat(60));
        
        return true;
        
    } catch (error) {
        printError(`Setup failed: ${error.message}`);
        return false;
    }
}

if (require.main === module) {
    main().then(success => {
        if (!success) {
            printError("Setup failed. Please check the errors above.");
            process.exit(1);
        }
    }).catch(error => {
        printError(`Unexpected error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    main,
    checkMySQLConnection,
    setupDatabase,
    createDirectories,
    checkDependencies
};