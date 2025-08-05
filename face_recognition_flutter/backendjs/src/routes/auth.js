const express = require('express');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const db = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

const registerSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('student', 'teacher', 'admin').required(),
    student_id: Joi.string().when('role', {
        is: 'student',
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    class_name: Joi.string().when('role', {
        is: 'student',
        then: Joi.required(),
        otherwise: Joi.optional()
    })
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { username, password } = value;

        // Get user from database (lấy đủ trường)
        const [rows] = await db.execute(
            'SELECT id, username, full_name, email, role, is_active, face_trained, created_at, password_hash FROM users WHERE username = ? AND is_active = TRUE',
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
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
                 WHERE cs.student_id = ?
                 LIMIT 1`,
                [user.id]
            );
            if (stuRows.length > 0) {
                student_id = stuRows[0].student_code;
                class_name = stuRows[0].class_name;
            }
        }

        // Generate token
        const token = generateToken(user);

        // Return user info (không trả về password_hash)
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                student_id,
                class_name,
                is_active: user.is_active,
                face_trained: user.face_trained,
                created_at: user.created_at
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { username, password, full_name, email, role, student_id, class_name } = value;

        // Check if user already exists
        const [existing] = await db.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const insertQuery = role === 'student'
            ? 'INSERT INTO users (username, password_hash, full_name, email, role, student_id, class_name) VALUES (?, ?, ?, ?, ?, ?, ?)'
            : 'INSERT INTO users (username, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?)';

        const insertParams = role === 'student'
            ? [username, password_hash, full_name, email, role, student_id, class_name]
            : [username, password_hash, full_name, email, role];

        const [result] = await db.execute(insertQuery, insertParams);

        res.status(201).json({
            message: 'User registered successfully',
            user_id: result.insertId
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
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
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
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
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
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
});

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and profile management
 */

// Login
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username
 *               password:
 *                 type: string
 *                 description: User password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [admin, teacher, student]
 *                     student_id:
 *                       type: string
 *                       nullable: true
 *                     class_name:
 *                       type: string
 *                       nullable: true
 *                     is_active:
 *                       type: boolean
 *                     face_trained:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Login failed
 */

// Register
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - full_name
 *               - email
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 pattern: '^[a-zA-Z0-9]+$'
 *                 description: Alphanumeric username
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Password (minimum 6 characters)
 *               full_name:
 *                 type: string
 *                 description: Full name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Valid email address
 *               role:
 *                 type: string
 *                 enum: [student, teacher, admin]
 *                 description: User role
 *               student_id:
 *                 type: string
 *                 description: Student ID (required if role is student)
 *               class_name:
 *                 type: string
 *                 description: Class name (required if role is student)
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user_id:
 *                   type: integer
 *       400:
 *         description: Validation error or user already exists
 *       500:
 *         description: Registration failed
 */

// Get current user profile
/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [admin, teacher, student]
 *                     student_id:
 *                       type: string
 *                       nullable: true
 *                     class_name:
 *                       type: string
 *                       nullable: true
 *                     is_active:
 *                       type: boolean
 *                     face_trained:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 */

// Update profile
/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: Updated full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Updated email address
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Profile update failed
 */

// Change password
/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 description: Current password
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Current password is incorrect
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Password change failed
 */