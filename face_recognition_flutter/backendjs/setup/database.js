/**
 * Database setup module
 * 
 * Handles database connection, creation, and initial setup
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const config = require('./config');
const logger = require('./logger');

class DatabaseManager {
    constructor() {
        this.connection = null;
        this.baseConnection = null;
    }

    /**
     * Check if MySQL connection is available
     */
    async checkConnection() {
        try {
            logger.printStep('CHECKING MYSQL CONNECTION');
            
            // Test connection without database first
            const baseConfig = { ...config.DB_CONFIG };
            delete baseConfig.database;

            this.baseConnection = await mysql.createConnection(baseConfig);
            await this.baseConnection.ping();
            
            logger.printSuccess('MySQL connection successful');
            return true;
        } catch (error) {
            logger.printError(`MySQL connection failed: ${error.message}`);
            logger.printInfo('Make sure MySQL is running and credentials are correct');
            return false;
        }
    }

    /**
     * Test connection with actual database
     */
    async testConnection() {
        try {
            if (this.connection) {
                await this.connection.ping();
                return true;
            }

            this.connection = await mysql.createConnection(config.DB_CONFIG);
            await this.connection.ping();
            logger.printSuccess('Database connection test passed');
            return true;
        } catch (error) {
            logger.printError(`Database connection test failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Create or reset database
     */
    async createDatabase(reset = false) {
        try {
            logger.printStep('SETTING UP DATABASE');

            if (!this.baseConnection) {
                const baseConfig = { ...config.DB_CONFIG };
                delete baseConfig.database;
                this.baseConnection = await mysql.createConnection(baseConfig);
            }

            if (reset) {
                logger.printInfo(`Dropping existing database: ${config.DB_CONFIG.database}`);
                await this.baseConnection.query(`DROP DATABASE IF EXISTS \`${config.DB_CONFIG.database}\``);
            }

            // Create database
            logger.printInfo(`Creating database: ${config.DB_CONFIG.database}`);
            await this.baseConnection.query(
                `CREATE DATABASE IF NOT EXISTS \`${config.DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
            );
            
            logger.printSuccess(`Database '${config.DB_CONFIG.database}' ready`);

            // Connect to the database
            await this.baseConnection.end();
            this.connection = await mysql.createConnection(config.DB_CONFIG);

            return true;
        } catch (error) {
            logger.printError(`Database creation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create all database tables
     */
    async createTables() {
        try {
            logger.printStep('CREATING DATABASE TABLES');

            const tables = this.getTableDefinitions();
            let completed = 0;

            for (const [tableName, sql] of Object.entries(tables)) {
                try {
                    logger.printDebug(`Creating table: ${tableName}`);
                    await this.connection.execute(sql);
                    completed++;
                    logger.printProgress(completed, Object.keys(tables).length, `Creating ${tableName}`);
                } catch (error) {
                    logger.printError(`Failed to create table ${tableName}: ${error.message}`);
                    throw error;
                }
            }

            logger.printSuccess(`Successfully created ${completed} tables`);
            return true;
        } catch (error) {
            logger.printError(`Table creation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Insert sample data
     */
    async insertSampleData() {
        try {
            logger.printStep('INSERTING SAMPLE DATA');

            // Create sample users
            await this.createSampleUsers();
            
            // Create sample classes and subjects
            await this.createSampleClassesAndSubjects();
            
            // Create sample course sections
            await this.createSampleCourseSections();
            
            // Create sample schedules and sessions
            await this.createSampleSchedules();

            logger.printSuccess('Sample data inserted successfully');
            return true;
        } catch (error) {
            logger.printError(`Sample data insertion failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get table definitions
     */
    getTableDefinitions() {
        return {
            users: `CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE,
                role ENUM('student', 'teacher', 'admin') NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                face_trained BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_username (username),
                INDEX idx_role (role),
                INDEX idx_active (is_active)
            )`,

            classes: `CREATE TABLE IF NOT EXISTS classes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(50) UNIQUE NOT NULL,
                code VARCHAR(20) NULL,
                year VARCHAR(4) NULL,
                description TEXT,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_code (code),
                INDEX idx_year (year),
                INDEX idx_status (status)
            )`,

            class_students: `CREATE TABLE IF NOT EXISTS class_students (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                class_id INT NOT NULL,
                student_code VARCHAR(20) UNIQUE,
                enrollment_date DATE DEFAULT (CURRENT_DATE),
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                UNIQUE KEY unique_student_class (student_id, class_id),
                INDEX idx_student_code (student_code)
            )`,

            subjects: `CREATE TABLE IF NOT EXISTS subjects (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(20) UNIQUE NOT NULL,
                description TEXT,
                credits INT DEFAULT 3,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_code (code),
                INDEX idx_active (is_active)
            )`,

            course_sections: `CREATE TABLE IF NOT EXISTS course_sections (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(20) UNIQUE NOT NULL,
                class_id INT NOT NULL,
                subject_id INT NOT NULL,
                teacher_id INT NOT NULL,
                semester VARCHAR(20) NOT NULL,
                academic_year VARCHAR(9) NOT NULL,
                max_students INT DEFAULT 50,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_course_section (class_id, subject_id, semester, academic_year),
                INDEX idx_teacher (teacher_id),
                INDEX idx_semester (semester, academic_year)
            )`,

            schedules: `CREATE TABLE IF NOT EXISTS schedules (
                id INT PRIMARY KEY AUTO_INCREMENT,
                course_section_id INT NOT NULL,
                weekday TINYINT NOT NULL COMMENT '1=Monday, 2=Tuesday, ..., 7=Sunday',
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                room VARCHAR(50),
                start_date DATE NOT NULL COMMENT 'Ngày bắt đầu học kỳ',
                total_sessions INT DEFAULT 15 COMMENT 'Tổng số buổi học',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (course_section_id) REFERENCES course_sections(id) ON DELETE CASCADE,
                INDEX idx_course_schedule (course_section_id, weekday),
                INDEX idx_time (start_time, end_time)
            )`,

            attendance_sessions: `CREATE TABLE IF NOT EXISTS attendance_sessions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                course_section_id INT NOT NULL,
                session_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME,
                session_name VARCHAR(100),
                schedule_id INT NULL COMMENT 'Liên kết với lịch học nếu tự động tạo',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (course_section_id) REFERENCES course_sections(id) ON DELETE CASCADE,
                FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE SET NULL,
                INDEX idx_course_date (course_section_id, session_date),
                INDEX idx_session_date (session_date)
            )`,

            attendances: `CREATE TABLE IF NOT EXISTS attendances (
                id INT PRIMARY KEY AUTO_INCREMENT,
                session_id INT NOT NULL,
                student_id INT NOT NULL,
                attendance_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                confidence_score FLOAT,
                image_path VARCHAR(255),
                status ENUM('present', 'late', 'absent') DEFAULT 'present',
                notes TEXT,
                UNIQUE KEY unique_attendance (session_id, student_id),
                FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_student_session (student_id, session_id),
                INDEX idx_attendance_time (attendance_time)
            )`,

            face_images: `CREATE TABLE IF NOT EXISTS face_images (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                image_path VARCHAR(255) NOT NULL,
                image_hash VARCHAR(64) COMMENT 'Hash của ảnh để tránh trùng lặp',
                quality_score FLOAT COMMENT 'Điểm chất lượng ảnh',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_images (user_id),
                INDEX idx_image_hash (image_hash)
            )`
        };
    }

    /**
     * Create sample users
     */
    async createSampleUsers() {
        const users = [
            { ...config.TEST_USERS.admin, role: 'admin' },
            { ...config.TEST_USERS.teacher, role: 'teacher' },
            { ...config.TEST_USERS.student, role: 'student' }
        ];

        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            
            try {
                await this.connection.execute(
                    `INSERT IGNORE INTO users (username, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?)`,
                    [user.username, hashedPassword, user.full_name, user.email, user.role]
                );
                logger.printDebug(`Created user: ${user.username} (${user.role})`);
            } catch (error) {
                logger.printWarning(`User ${user.username} might already exist: ${error.message}`);
            }
        }
    }

    /**
     * Create sample classes and subjects
     */
    async createSampleClassesAndSubjects() {
        // Create sample class
        const className = 'CNTT01';
        const classCode = 'CNTT01';
        const classYear = new Date().getFullYear().toString();

        try {
            const [classResult] = await this.connection.execute(
                `INSERT IGNORE INTO classes (name, code, year, description) VALUES (?, ?, ?, ?)`,
                [className, classCode, classYear, 'Lớp Công nghệ thông tin 01']
            );

            // Create sample subject
            await this.connection.execute(
                `INSERT IGNORE INTO subjects (name, code, description, credits) VALUES (?, ?, ?, ?)`,
                ['Python Programming', 'PY101', 'Lập trình Python cơ bản', 3]
            );

            logger.printDebug('Created sample class and subject');
        } catch (error) {
            logger.printWarning(`Sample class/subject creation: ${error.message}`);
        }
    }

    /**
     * Create sample course sections
     */
    async createSampleCourseSections() {
        try {
            // Get IDs
            const [classRows] = await this.connection.execute('SELECT id FROM classes WHERE code = ?', ['CNTT01']);
            const [subjectRows] = await this.connection.execute('SELECT id FROM subjects WHERE code = ?', ['PY101']);
            const [teacherRows] = await this.connection.execute('SELECT id FROM users WHERE role = "teacher" LIMIT 1');

            if (classRows.length === 0 || subjectRows.length === 0 || teacherRows.length === 0) {
                logger.printWarning('Missing required data for course section creation');
                return;
            }

            const classId = classRows[0].id;
            const subjectId = subjectRows[0].id;
            const teacherId = teacherRows[0].id;

            const currentYear = new Date().getFullYear();
            const academicYear = `${currentYear}-${currentYear + 1}`;
            const courseSectionCode = `CNTT01_PY101_${currentYear}`;

            await this.connection.execute(
                `INSERT IGNORE INTO course_sections (name, code, class_id, subject_id, teacher_id, semester, academic_year, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    'CNTT01 - Python Programming',
                    courseSectionCode,
                    classId,
                    subjectId,
                    teacherId,
                    'HK1',
                    academicYear,
                    'Lớp học phần Python Programming cho lớp CNTT01'
                ]
            );

            logger.printDebug('Created sample course section');
        } catch (error) {
            logger.printWarning(`Course section creation: ${error.message}`);
        }
    }

    /**
     * Create sample schedules
     */
    async createSampleSchedules() {
        try {
            const [courseSectionRows] = await this.connection.execute(
                'SELECT id FROM course_sections ORDER BY id DESC LIMIT 1'
            );

            if (courseSectionRows.length === 0) {
                logger.printWarning('No course section found for schedule creation');
                return;
            }

            const courseSectionId = courseSectionRows[0].id;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + 7); // Start next week
            const startDateStr = startDate.toISOString().split('T')[0];

            // Create schedule
            await this.connection.execute(
                `INSERT IGNORE INTO schedules (course_section_id, weekday, start_time, end_time, room, start_date, total_sessions) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [courseSectionId, 2, '09:00:00', '11:00:00', 'P101', startDateStr, 15]
            );

            // Create attendance session
            await this.connection.execute(
                `INSERT IGNORE INTO attendance_sessions (course_section_id, session_date, start_time, session_name) VALUES (?, CURDATE(), ?, ?)`,
                [courseSectionId, '09:00:00', 'Buổi 1 - Giới thiệu Python']
            );

            logger.printDebug('Created sample schedules and sessions');
        } catch (error) {
            logger.printWarning(`Schedule creation: ${error.message}`);
        }
    }

    /**
     * Main setup method
     */
    async setup(options = {}) {
        try {
            // Check connection first
            const connectionOk = await this.checkConnection();
            if (!connectionOk) {
                throw new Error('Database connection failed');
            }

            // Create/reset database
            await this.createDatabase(options.reset);

            // Create tables
            await this.createTables();

            // Insert sample data
            await this.insertSampleData();

            logger.printSuccess('Database setup completed successfully');
            return true;

        } catch (error) {
            logger.printError(`Database setup failed: ${error.message}`);
            throw error;
        } finally {
            // Clean up connections
            await this.cleanup();
        }
    }

    /**
     * Clean up database connections
     */
    async cleanup() {
        try {
            if (this.connection) {
                await this.connection.end();
                this.connection = null;
            }
            if (this.baseConnection) {
                await this.baseConnection.end();
                this.baseConnection = null;
            }
        } catch (error) {
            logger.printWarning(`Database cleanup warning: ${error.message}`);
        }
    }
}

// Export singleton instance
module.exports = new DatabaseManager();