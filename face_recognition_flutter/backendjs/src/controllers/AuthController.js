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

    // Lấy thông tin profile (cập nhật từ auth.js)
    async getProfile(req, res) {
        try {
            const userId = req.user.id;
            if (!userId) {
                return res.status(404).json({ error: 'User not found' });
            }

            const profile = {
                id: req.user.id,
                username: req.user.username,
                full_name: req.user.full_name,
                email: req.user.email,
                role: req.user.role,
                is_active: req.user.is_active,
                face_trained: req.user.face_trained,
                created_at: req.user.created_at
            };

            // Nếu là học sinh thì lấy class_name và student_code từ class_students và classes
            if (profile.role === 'student') {
                const [rows] = await db.execute(
                    `SELECT cs.student_code, c.name AS class_name
                     FROM class_students cs
                     JOIN classes c ON cs.class_id = c.id
                     WHERE cs.student_id = ?
                     LIMIT 1`,
                    [profile.id]
                );
                if (rows.length > 0) {
                    profile.class_name = rows[0].class_name;
                    profile.student_id = rows[0].student_code;
                } else {
                    profile.class_name = null;
                    profile.student_id = null;
                }
            }

            return res.json({
                message: 'Profile retrieved successfully',
                data: profile
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    // Cập nhật profile (từ auth.js)
    async updateProfile(req, res) {
        try {
            const { full_name, email } = req.body;
            const userId = req.user.id;

            await db.execute(
                'UPDATE users SET full_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [full_name, email, userId]
            );

            res.json({ message: 'Profile updated successfully' });

        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({ error: 'Profile update failed' });
        }
    }

    // Đổi mật khẩu (từ auth.js)
    async changePassword(req, res) {
        try {
            const { current_password, new_password } = req.body;
            const userId = req.user.id;

            // Get current password hash
            const [rows] = await db.execute(
                'SELECT password_hash FROM users WHERE id = ?',
                [userId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Verify current password
            const validPassword = await bcrypt.compare(current_password, rows[0].password_hash);
            if (!validPassword) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }

            // Hash new password
            const saltRounds = 10;
            const new_password_hash = await bcrypt.hash(new_password, saltRounds);

            // Update password
            await db.execute(
                'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [new_password_hash, userId]
            );

            res.json({ message: 'Password changed successfully' });

        } catch (error) {
            console.error('Password change error:', error);
            res.status(500).json({ error: 'Password change failed' });
        }
    }
}

module.exports = new AuthController();