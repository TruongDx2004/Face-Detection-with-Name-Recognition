const bcrypt = require('bcrypt');
const db = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { loginSchema, registerSchema } = require('../validators/authValidator');

class AuthController {
    // Đăng nhập
    async login(req, res) {
        try {
            const { error, value } = loginSchema.validate(req.body);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            const { username, password } = value;

            // Get user from database
            const [rows] = await db.execute(
                'SELECT id, username, full_name, email, role, is_active, face_trained, created_at, password_hash FROM users WHERE username = ? AND is_active = TRUE',
                [username]
            );

            if (rows.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = rows[0];

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Nếu là học sinh, lấy thêm student_code và class_name
            let student_id = null;
            let class_name = null;
            if (user.role === 'student') {
                const [stuRows] = await db.execute(
                    `SELECT cs.student_code, c.name AS class_name
                     FROM class_students cs
                     JOIN classes c ON cs.class_id = c.id
                     WHERE cs.student_id = ? LIMIT 1`,
                    [user.id]
                );
                if (stuRows.length > 0) {
                    student_id = stuRows[0].student_code;
                    class_name = stuRows[0].class_name;
                }
            }

            // Generate token
            const token = generateToken(user);

            // Remove password from response
            delete user.password_hash;

            res.json({
                message: 'Login successful',
                token,
                user: {
                    ...user,
                    student_id,
                    class_name,
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Đăng ký
    async register(req, res) {
        try {
            const { error, value } = registerSchema.validate(req.body);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            const { username, password, full_name, email, role, student_id, class_name } = value;

            // Check if user already exists
            const [existingUsers] = await db.execute(
                'SELECT id FROM users WHERE username = ? OR email = ?',
                [username, email]
            );

            if (existingUsers.length > 0) {
                return res.status(409).json({ error: 'Username or email already exists' });
            }

            // Hash password
            const password_hash = await bcrypt.hash(password, 10);

            // Insert user
            const query = role === 'student'
                ? 'INSERT INTO users (username, password_hash, full_name, email, role, student_id, class_name) VALUES (?, ?, ?, ?, ?, ?, ?)'
                : 'INSERT INTO users (username, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?)';

            const params = role === 'student'
                ? [username, password_hash, full_name, email, role, student_id, class_name]
                : [username, password_hash, full_name, email, role];

            const [result] = await db.execute(query, params);

            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: result.insertId,
                    username,
                    full_name,
                    email,
                    role
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Lấy thông tin profile
    async getProfile(req, res) {
        try {
            const userId = req.user.id;

            const [rows] = await db.execute(
                'SELECT id, username, full_name, email, role, is_active, face_trained, created_at FROM users WHERE id = ?',
                [userId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const profile = rows[0];

            // Nếu là học sinh thì lấy class_name và student_code từ class_students và classes
            if (profile.role === 'student') {
                const [rows] = await db.execute(
                    `SELECT cs.student_code, c.name AS class_name
                     FROM class_students cs
                     JOIN classes c ON cs.class_id = c.id
                     WHERE cs.student_id = ? LIMIT 1`,
                    [userId]
                );
                if (rows.length > 0) {
                    profile.student_code = rows[0].student_code;
                    profile.class_name = rows[0].class_name;
                } else {
                    profile.student_code = null;
                    profile.class_name = null;
                }
            }

            res.json(profile);
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new AuthController();