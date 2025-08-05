const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Subjects
 *   description: Subject management operations
 */

/**
 * @swagger
 * /subjects:
 *   get:
 *     summary: Get all subjects with optional filters
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by subject name (partial match)
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
 *         description: Number of subjects per page
 *     responses:
 *       200:
 *         description: Subjects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 subjects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { name, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT id, name FROM subjects WHERE 1=1';
    const params = [];

    if (name) {
      query += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }

    query += ` ORDER BY name LIMIT ${limit} OFFSET ${offset}`;
    params.push(parseInt(limit), parseInt(offset));

    const [subjects] = await db.execute(query, params);

    res.status(200).json({
      message: 'Subjects retrieved successfully',
      subjects
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Failed to retrieve subjects' });
  }
});

/**
 * @swagger
 * /subjects:
 *   post:
 *     summary: Create a new subject
 *     tags: [Subjects]
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
 *                 description: Subject name
 *     responses:
 *       201:
 *         description: Subject created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 subject_id:
 *                   type: integer
 *       400:
 *         description: Invalid input or subject already exists
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
      return res.status(400).json({ error: 'Subject name is required' });
    }

    const [existing] = await db.execute('SELECT id FROM subjects WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Subject already exists' });
    }

    const [result] = await db.execute('INSERT INTO subjects (name) VALUES (?)', [name]);

    res.status(201).json({
      message: 'Subject created successfully',
      subject_id: result.insertId
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

/**
 * @swagger
 * /subjects/{id}:
 *   put:
 *     summary: Update a subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
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
 *                 description: New subject name
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *       400:
 *         description: Invalid input or subject already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    const [existing] = await db.execute('SELECT id FROM subjects WHERE name = ? AND id != ?', [name, id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Subject name already exists' });
    }

    const [result] = await db.execute('UPDATE subjects SET name = ? WHERE id = ?', [name, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    res.status(200).json({ message: 'Subject updated successfully' });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

/**
 * @swagger
 * /subjects/{id}:
 *   delete:
 *     summary: Delete a subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute('DELETE FROM subjects WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

/**
 * @swagger
 * tags:
 *   name: Schedules
 *   description: Schedule management operations
 */

/**
 * @swagger
 * /subjects/schedules:
 *   get:
 *     summary: Get all schedules with optional filters
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: integer
 *         description: Filter by class ID
 *       - in: query
 *         name: subject_id
 *         schema:
 *           type: integer
 *         description: Filter by subject ID
 *       - in: query
 *         name: teacher_id
 *         schema:
 *           type: integer
 *         description: Filter by teacher ID
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
 *         description: Number of schedules per page
 *     responses:
 *       200:
 *         description: Schedules retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 schedules:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       class_name:
 *                         type: string
 *                       subject_name:
 *                         type: string
 *                       teacher_name:
 *                         type: string
 *                       weekday:
 *                         type: integer
 *                       start_time:
 *                         type: string
 *                       end_time:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       500:
 *         description: Internal server error
 */
router.get('/schedules', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { class_id, subject_id, teacher_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        s.id,
        c.name as class_name,
        sub.name as subject_name,
        u.full_name as teacher_name,
        s.weekday,
        s.start_time,
        s.end_time
      FROM schedules s
      JOIN classes c ON s.class_id = c.id
      JOIN subjects sub ON s.subject_id = sub.id
      JOIN users u ON s.teacher_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (class_id) {
      query += ' AND s.class_id = ?';
      params.push(parseInt(class_id));
    }
    if (subject_id) {
      query += ' AND s.subject_id = ?';
      params.push(parseInt(subject_id));
    }
    if (teacher_id) {
      query += ' AND s.teacher_id = ?';
      params.push(parseInt(teacher_id));
    }

    query += ` ORDER BY s.weekday, s.start_time LIMIT ${limit} OFFSET ${offset}`;
    params.push(parseInt(limit), parseInt(offset));

    const [schedules] = await db.execute(query, params);

    res.status(200).json({
      message: 'Schedules retrieved successfully',
      schedules
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ error: 'Failed to retrieve schedules' });
  }
});

/**
 * @swagger
 * /subjects/schedules:
 *   post:
 *     summary: Create a new schedule
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - subject_id
 *               - teacher_id
 *               - weekday
 *               - start_time
 *               - end_time
 *             properties:
 *               class_id:
 *                 type: integer
 *               subject_id:
 *                 type: integer
 *               teacher_id:
 *                 type: integer
 *               weekday:
 *                 type: integer
 *                 description: Day of the week (1-7, 1=Sunday)
 *               start_time:
 *                 type: string
 *                 description: Start time in HH:MM format
 *               end_time:
 *                 type: string
 *                 description: End time in HH:MM format
 *     responses:
 *       201:
 *         description: Schedule created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 schedule_id:
 *                   type: integer
 *       400:
 *         description: Invalid input or schedule conflict
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Class, subject, or teacher not found
 *       500:
 *         description: Internal server error
 */
router.post('/schedules', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { class_id, subject_id, teacher_id, weekday, start_time, end_time } = req.body;

    if (!class_id || !subject_id || !teacher_id || !weekday || !start_time || !end_time) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate class, subject, and teacher existence
    const [classCheck] = await db.execute('SELECT id FROM classes WHERE id = ?', [class_id]);
    if (classCheck.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const [subjectCheck] = await db.execute('SELECT id FROM subjects WHERE id = ?', [subject_id]);
    if (subjectCheck.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const [teacherCheck] = await db.execute('SELECT id FROM users WHERE id = ? AND role = "teacher"', [teacher_id]);
    if (teacherCheck.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check for schedule conflicts
    const [conflicts] = await db.execute(`
      SELECT id FROM schedules 
      WHERE class_id = ? AND weekday = ? 
      AND ((start_time <= ? AND end_time >= ?) OR (start_time <= ? AND end_time >= ?))
    `, [class_id, weekday, start_time, start_time, end_time, end_time]);

    if (conflicts.length > 0) {
      return res.status(400).json({ error: 'Schedule conflict detected' });
    }

    const [result] = await db.execute(
      'INSERT INTO schedules (class_id, subject_id, teacher_id, weekday, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
      [class_id, subject_id, teacher_id, weekday, start_time, end_time]
    );

    res.status(201).json({
      message: 'Schedule created successfully',
      schedule_id: result.insertId
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

/**
 * @swagger
 * /subjects/schedules/{id}:
 *   put:
 *     summary: Update a schedule
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - subject_id
 *               - teacher_id
 *               - weekday
 *               - start_time
 *               - end_time
 *             properties:
 *               class_id:
 *                 type: integer
 *               subject_id:
 *                 type: integer
 *               teacher_id:
 *                 type: integer
 *               weekday:
 *                 type: integer
 *               start_time:
 *                 type: string
 *               end_time:
 *                 type: string
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *       400:
 *         description: Invalid input or schedule conflict
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Schedule, class, subject, or teacher not found
 *       500:
 *         description: Internal server error
 */
router.put('/schedules/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { class_id, subject_id, teacher_id, weekday, start_time, end_time } = req.body;

    if (!class_id || !subject_id || !teacher_id || !weekday || !start_time || !end_time) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate class, subject, and teacher existence
    const [classCheck] = await db.execute('SELECT id FROM classes WHERE id = ?', [class_id]);
    if (classCheck.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const [subjectCheck] = await db.execute('SELECT id FROM subjects WHERE id = ?', [subject_id]);
    if (subjectCheck.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const [teacherCheck] = await db.execute('SELECT id FROM users WHERE id = ? AND role = "teacher"', [teacher_id]);
    if (teacherCheck.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check for schedule conflicts (excluding current schedule)
    const [conflicts] = await db.execute(`
      SELECT id FROM schedules 
      WHERE class_id = ? AND weekday = ? AND id != ?
      AND ((start_time <= ? AND end_time >= ?) OR (start_time <= ? AND end_time >= ?))
    `, [class_id, weekday, id, start_time, start_time, end_time, end_time]);

    if (conflicts.length > 0) {
      return res.status(400).json({ error: 'Schedule conflict detected' });
    }

    const [result] = await db.execute(
      'UPDATE schedules SET class_id = ?, subject_id = ?, teacher_id = ?, weekday = ?, start_time = ?, end_time = ? WHERE id = ?',
      [class_id, subject_id, teacher_id, weekday, start_time, end_time, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.status(200).json({ message: 'Schedule updated successfully' });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

/**
 * @swagger
 * /subjects/schedules/{id}:
 *   delete:
 *     summary: Delete a schedule
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Internal server error
 */
router.delete('/schedules/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute('DELETE FROM schedules WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.status(200).json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

/**
 * @swagger
 * /subjects/schedules/options:
 *   get:
 *     summary: Get available classes, subjects, and teachers for scheduling
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Options retrieved successfully
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
 *                 subjects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                 teachers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       full_name:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       500:
 *         description: Internal server error
 */
router.get('/schedules/options', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const [classes] = await db.execute('SELECT id, name FROM classes ORDER BY name');
    const [subjects] = await db.execute('SELECT id, name FROM subjects ORDER BY name');
    const [teachers] = await db.execute('SELECT id, full_name FROM users WHERE role = "teacher" ORDER BY full_name');

    res.status(200).json({
      message: 'Options retrieved successfully',
      classes,
      subjects,
      teachers
    });
  } catch (error) {
    console.error('Get schedule options error:', error);
    res.status(500).json({ error: 'Failed to retrieve options' });
  }
});

module.exports = router;