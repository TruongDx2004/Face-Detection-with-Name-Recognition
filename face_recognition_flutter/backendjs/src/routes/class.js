const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Classes
 *   description: Class management operations
 */

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Get all classes with optional filters
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by class name (partial match)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of classes per page
 *     responses:
 *       200:
 *         description: Classes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 classes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       student_count:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const name = (req.query.name || '').trim();

    let query = `
      SELECT 
        c.id,
        c.name,
        c.code,
        c.year,
        c.description,
        c.status,
        COUNT(DISTINCT cs.student_id) AS studentCount,
        SUM(CASE WHEN u.face_trained = TRUE THEN 1 ELSE 0 END) AS studentsWithFace
      FROM classes c
      LEFT JOIN class_students cs ON c.id = cs.class_id
      LEFT JOIN users u ON cs.student_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (name) {
      query += ' AND c.name LIKE ?';
      params.push(`%${name}%`);
    }

    query += `
      GROUP BY c.id, c.name, c.code, c.year, c.description, c.status
      ORDER BY c.name
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [classes] = await db.execute(query, params);

    // Lấy danh sách sinh viên cho từng lớp
    for (const cls of classes) {
      const [students] = await db.execute(
        `SELECT 
           u.id, 
           u.full_name AS name, 
           cs.student_code AS code, 
           u.email, 
           u.face_trained AS hasFace
         FROM class_students cs
         JOIN users u ON cs.student_id = u.id
         WHERE cs.class_id = ?`,
        [cls.id]
      );
      cls.students = students;
    }

    res.json({ message: 'Classes retrieved successfully', classes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve classes' });
  }
});

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Class name
 *     responses:
 *       201:
 *         description: Class created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 class_id:
 *                   type: integer
 *       400:
 *         description: Invalid input or class already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Class name is required' });
    }

    const [existing] = await db.execute('SELECT id FROM classes WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Class already exists' });
    }

    const [result] = await db.execute('INSERT INTO classes (name) VALUES (?)', [name]);

    res.status(201).json({
      message: 'Class created successfully',
      class_id: result.insertId
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

/**
 * @swagger
 * /classes/{id}:
 *   put:
 *     summary: Update a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: New class name
 *     responses:
 *       200:
 *         description: Class updated successfully
 *       400:
 *         description: Invalid input or class already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Class not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Class name is required' });
    }

    const [existing] = await db.execute('SELECT id FROM classes WHERE name = ? AND id != ?', [name, id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Class name already exists' });
    }

    const [result] = await db.execute('UPDATE classes SET name = ? WHERE id = ?', [name, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.status(200).json({ message: 'Class updated successfully' });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

/**
 * @swagger
 * /classes/{id}:
 *   delete:
 *     summary: Delete a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Class not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute('DELETE FROM classes WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.status(200).json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

/**
 * @swagger
 * /classes/{id}/students:
 *   get:
 *     summary: Get students in a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 students:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       full_name:
 *                         type: string
 *                       student_code:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Class not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/students', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;

    const [students] = await db.execute(`
      SELECT 
        u.id,
        u.full_name,
        cs.student_code
      FROM class_students cs
      JOIN users u ON cs.student_id = u.id
      WHERE cs.class_id = ?
      ORDER BY u.full_name
    `, [id]);

    res.status(200).json({
      message: 'Students retrieved successfully',
      students
    });
  } catch (error) {
    console.error('Get class students error:', error);
    res.status(500).json({ error: 'Failed to retrieve students' });
  }
});

/**
 * @swagger
 * /classes/{id}/students:
 *   post:
 *     summary: Add a student to a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *               - student_code
 *             properties:
 *               student_id:
 *                 type: integer
 *                 description: Student ID
 *               student_code:
 *                 type: string
 *                 description: Student code in the class
 *     responses:
 *       201:
 *         description: Student added to class successfully
 *       400:
 *         description: Invalid input or student already in class
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Class or student not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/students', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    let { student_id, student_code } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    // Nếu không có student_code thì tự tạo
    if (!student_code || student_code.trim() === '') {
      student_code = `SV${id}${student_id}`;
    }

    // Check if class exists
    const [classCheck] = await db.execute('SELECT id FROM classes WHERE id = ?', [id]);
    if (classCheck.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if student exists and has student role
    const [studentCheck] = await db.execute('SELECT id FROM users WHERE id = ? AND role = "student"', [student_id]);
    if (studentCheck.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if student is already in class
    const [existing] = await db.execute(
      'SELECT id FROM class_students WHERE class_id = ? AND student_id = ?',
      [id, student_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Student already in class' });
    }

    // Check if student code is unique
    const [codeCheck] = await db.execute('SELECT id FROM class_students WHERE student_code = ?', [student_code]);
    if (codeCheck.length > 0) {
      return res.status(400).json({ error: 'Student code already exists' });
    }

    await db.execute(
      'INSERT INTO class_students (class_id, student_id, student_code) VALUES (?, ?, ?)',
      [id, student_id, student_code]
    );

    res.status(201).json({ message: 'Student added to class successfully' });
  } catch (error) {
    console.error('Add student to class error:', error);
    res.status(500).json({ error: 'Failed to add student to class' });
  }
});

/**
 * @swagger
 * /classes/{id}/students/{student_id}:
 *   delete:
 *     summary: Remove a student from a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *       - in: path
 *         name: student_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student removed from class successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Class or student not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id/students/:student_id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id, student_id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM class_students WHERE class_id = ? AND student_id = ?',
      [id, student_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student or class not found' });
    }

    res.status(200).json({ message: 'Student removed from class successfully' });
  } catch (error) {
    console.error('Remove student from class error:', error);
    res.status(500).json({ error: 'Failed to remove student from class' });
  }
});

/**
 * @swagger
 * /available-students:
 *   get:
 *     summary: Lấy danh sách sinh viên chưa thuộc lớp nào
 *     description: Trả về danh sách tất cả sinh viên có role là 'student', đang active, và chưa được thêm vào bất kỳ lớp học nào.
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách sinh viên chưa thuộc lớp nào.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Available students retrieved successfully
 *                 students:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 4
 *                       name:
 *                         type: string
 *                         example: Nguyễn Thị D
 *                       email:
 *                         type: string
 *                         example: d@example.com
 *       401:
 *         description: Không có quyền truy cập hoặc chưa đăng nhập.
 *       500:
 *         description: Lỗi khi truy xuất dữ liệu từ server.
 */
router.get('/available-students', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const [students] = await db.execute(
      
      `SELECT 
          u.id, 
          u.full_name AS name, 
          u.email
      FROM users u
      WHERE u.role = 'student'
        AND u.is_active = 1
        AND u.id NOT IN (
            SELECT cs.student_id FROM class_students cs
        )
      ORDER BY u.full_name`
          );
          
    res.json({
      message: 'Available students retrieved successfully',
      students
    });
  } catch (error) {
    console.error('Get available students error:', error);
    res.status(500).json({ error: 'Failed to retrieve available students' });
  }
});


module.exports = router;