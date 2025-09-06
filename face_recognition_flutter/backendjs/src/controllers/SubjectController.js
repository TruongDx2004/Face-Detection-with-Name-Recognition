const db = require('../config/database');
const responseHelper = require('../utils/responseHelper');

class SubjectController {
    // Lấy danh sách tất cả subjects
    async getAllSubjects(req, res) {
        try {
            const { name, code, is_active, page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            let query = `SELECT id, name, code, description, credits, is_active, created_at, updated_at 
                        FROM subjects WHERE 1=1`;
            const params = [];

            if (name) {
                query += ' AND name LIKE ?';
                params.push(`%${name}%`);
            }

            if (code) {
                query += ' AND code LIKE ?';
                params.push(`%${code}%`);
            }

            if (is_active !== undefined) {
                query += ' AND is_active = ?';
                params.push(is_active === 'true' ? 1 : 0);
            }

            query += ` ORDER BY name LIMIT ${limit} OFFSET ${offset}`;

            const [subjects] = await db.execute(query, params);

            // Get total count for pagination
            let countQuery = 'SELECT COUNT(*) as total FROM subjects WHERE 1=1';
            const countParams = [];
            
            if (name) {
                countQuery += ' AND name LIKE ?';
                countParams.push(`%${name}%`);
            }

            if (code) {
                countQuery += ' AND code LIKE ?';
                countParams.push(`%${code}%`);
            }

            if (is_active !== undefined) {
                countQuery += ' AND is_active = ?';
                countParams.push(is_active === 'true' ? 1 : 0);
            }

            const [countResult] = await db.execute(countQuery, countParams);
            const total = countResult[0].total;

            return responseHelper.success(res, {
                subjects,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }, 'Subjects retrieved successfully');
        } catch (error) {
            console.error('Get subjects error:', error);
            return responseHelper.error(res, 'Failed to retrieve subjects', 500);
        }
    }

    // Tạo subject mới
    async createSubject(req, res) {
        try {
            const { name, code, description, credits = 3 } = req.body.name.name;
            
            // Validation
            if (!name || !code) {
                return responseHelper.error(res, 'Subject name and code are required', 400);
            }

            if (credits && (credits < 1 || credits > 10)) {
                return responseHelper.error(res, 'Credits must be between 1 and 10', 400);
            }

            // Check if subject with same name or code already exists
            const [existing] = await db.execute(
                'SELECT id, name, code FROM subjects WHERE name = ? OR code = ?',
                [name, code]
            );

            if (existing.length > 0) {
                const existingSubject = existing[0];
                if (existingSubject.name === name) {
                    return responseHelper.error(res, 'Subject with this name already exists', 409);
                }
                if (existingSubject.code === code) {
                    return responseHelper.error(res, 'Subject with this code already exists', 409);
                }
            }

            const [result] = await db.execute(
                'INSERT INTO subjects (name, code, description, credits) VALUES (?, ?, ?, ?)',
                [name, code, description || null, credits]
            );

            // Get the created subject
            const [newSubject] = await db.execute(
                'SELECT id, name, code, description, credits, is_active, created_at FROM subjects WHERE id = ?',
                [result.insertId]
            );

            return responseHelper.success(res, {
                subject: newSubject[0]
            }, 'Subject created successfully', 201);
        } catch (error) {
            console.error('Create subject error:', error);
            return responseHelper.error(res, 'Failed to create subject', 500);
        }
    }

    // Lấy thông tin subject theo ID
    async getSubjectById(req, res) {
        try {
            const subjectId = req.params.id;

            const [subjects] = await db.execute(
                'SELECT id, name, code, description, credits, is_active, created_at, updated_at FROM subjects WHERE id = ?',
                [subjectId]
            );

            if (subjects.length === 0) {
                return responseHelper.error(res, 'Subject not found', 404);
            }

            return responseHelper.success(res, {
                subject: subjects[0]
            }, 'Subject retrieved successfully');
        } catch (error) {
            console.error('Get subject error:', error);
            return responseHelper.error(res, 'Failed to retrieve subject', 500);
        }
    }

    // Cập nhật subject
    async updateSubject(req, res) {
        try {
            const subjectId = req.params.id;
            const { name, code, description, credits, is_active } = req.body.name;

            // Validation
            if (!name || !code) {
                return responseHelper.error(res, 'Subject name and code are required', 400);
            }

            if (credits && (credits < 1 || credits > 10)) {
                return responseHelper.error(res, 'Credits must be between 1 and 10', 400);
            }

            // Check if subject exists
            const [existing] = await db.execute('SELECT id FROM subjects WHERE id = ?', [subjectId]);
            if (existing.length === 0) {
                return responseHelper.error(res, 'Subject not found', 404);
            }

            // Check if another subject with same name or code exists
            const [duplicate] = await db.execute(
                'SELECT id, name, code FROM subjects WHERE (name = ? OR code = ?) AND id != ?',
                [name, code, subjectId]
            );

            if (duplicate.length > 0) {
                const duplicateSubject = duplicate[0];
                if (duplicateSubject.name === name) {
                    return responseHelper.error(res, 'Subject with this name already exists', 409);
                }
                if (duplicateSubject.code === code) {
                    return responseHelper.error(res, 'Subject with this code already exists', 409);
                }
            }

            // Build update query dynamically
            const updateFields = [];
            const updateValues = [];

            if (name !== undefined) {
                updateFields.push('name = ?');
                updateValues.push(name);
            }
            if (code !== undefined) {
                updateFields.push('code = ?');
                updateValues.push(code);
            }
            if (description !== undefined) {
                updateFields.push('description = ?');
                updateValues.push(description);
            }
            if (credits !== undefined) {
                updateFields.push('credits = ?');
                updateValues.push(credits);
            }
            if (is_active !== undefined) {
                updateFields.push('is_active = ?');
                updateValues.push(is_active);
            }

            updateValues.push(subjectId);

            const [result] = await db.execute(
                `UPDATE subjects SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );

            if (result.affectedRows === 0) {
                return responseHelper.error(res, 'Subject not found', 404);
            }

            // Get updated subject
            const [updatedSubject] = await db.execute(
                'SELECT id, name, code, description, credits, is_active, created_at, updated_at FROM subjects WHERE id = ?',
                [subjectId]
            );

            return responseHelper.success(res, {
                subject: updatedSubject[0]
            }, 'Subject updated successfully');
        } catch (error) {
            console.error('Update subject error:', error);
            return responseHelper.error(res, 'Failed to update subject', 500);
        }
    }

    // Xóa subject
    async deleteSubject(req, res) {
        try {
            const subjectId = req.params.id;

            // Check if subject exists
            const [existing] = await db.execute('SELECT id, name FROM subjects WHERE id = ?', [subjectId]);
            if (existing.length === 0) {
                return responseHelper.error(res, 'Subject not found', 404);
            }

            // Check if subject is being used in course_sections
            const [courseSections] = await db.execute(
                'SELECT COUNT(*) as count FROM course_sections WHERE subject_id = ?',
                [subjectId]
            );

            if (courseSections[0].count > 0) {
                return responseHelper.error(res, 'Cannot delete subject that is being used in course sections', 400);
            }

            // Soft delete by setting is_active to false instead of hard delete
            const [result] = await db.execute(
                'UPDATE subjects SET is_active = FALSE WHERE id = ?',
                [subjectId]
            );

            if (result.affectedRows === 0) {
                return responseHelper.error(res, 'Subject not found', 404);
            }

            return responseHelper.success(res, {
                subject: { id: subjectId, name: existing[0].name }
            }, 'Subject deleted successfully');
        } catch (error) {
            console.error('Delete subject error:', error);
            return responseHelper.error(res, 'Failed to delete subject', 500);
        }
    }

    // Lấy course sections của subject
    async getSubjectCourseSections(req, res) {
        try {
            const subjectId = req.params.id;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            // Check if subject exists
            const [subjectExists] = await db.execute('SELECT id, name FROM subjects WHERE id = ?', [subjectId]);
            if (subjectExists.length === 0) {
                return responseHelper.error(res, 'Subject not found', 404);
            }

            const [courseSections] = await db.execute(
                `SELECT 
                    cs.id,
                    cs.name,
                    cs.code,
                    cs.semester,
                    cs.academic_year,
                    cs.max_students,
                    cs.is_active,
                    cs.created_at,
                    c.name as class_name,
                    c.code as class_code,
                    u.full_name as teacher_name,
                    u.email as teacher_email,
                    COUNT(DISTINCT cse.student_id) as enrolled_students
                FROM course_sections cs
                LEFT JOIN classes c ON cs.class_id = c.id
                LEFT JOIN users u ON cs.teacher_id = u.id
                LEFT JOIN course_section_enrollments cse ON cs.id = cse.course_section_id
                WHERE cs.subject_id = ?
                GROUP BY cs.id
                ORDER BY cs.academic_year DESC, cs.semester, cs.name
                LIMIT ${limit} OFFSET ${offset}`,
                [subjectId]
            );

            // Get total count
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM course_sections WHERE subject_id = ?',
                [subjectId]
            );
            const total = countResult[0].total;

            return responseHelper.success(res, {
                subject: subjectExists[0],
                courseSections,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }, 'Subject course sections retrieved successfully');
        } catch (error) {
            console.error('Get subject course sections error:', error);
            return responseHelper.error(res, 'Failed to retrieve subject course sections', 500);
        }
    }

    // Lấy attendance sessions của subject
    async getSubjectAttendanceSessions(req, res) {
        try {
            const subjectId = req.params.id;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            // Check if subject exists
            const [subjectExists] = await db.execute('SELECT id FROM subjects WHERE id = ?', [subjectId]);
            if (subjectExists.length === 0) {
                return responseHelper.error(res, 'Subject not found', 404);
            }

            const [sessions] = await db.execute(
                `SELECT 
                    ats.id,
                    ats.session_date,
                    ats.start_time,
                    ats.end_time,
                    ats.is_active,
                    ats.created_at,
                    cs.name as course_section_name,
                    c.name as class_name,
                    u.full_name as teacher_name,
                    COUNT(a.id) as total_attendance
                FROM attendance_sessions ats
                JOIN course_sections cs ON ats.course_section_id = cs.id
                JOIN classes c ON cs.class_id = c.id
                JOIN users u ON cs.teacher_id = u.id
                LEFT JOIN attendances a ON ats.id = a.session_id
                WHERE cs.subject_id = ?
                GROUP BY ats.id
                ORDER BY ats.session_date DESC, ats.start_time DESC
                LIMIT ${limit} OFFSET ${offset}`,
                [subjectId]
            );

            // Get total count
            const [countResult] = await db.execute(
                `SELECT COUNT(*) as total 
                FROM attendance_sessions ats
                JOIN course_sections cs ON ats.course_section_id = cs.id
                WHERE cs.subject_id = ?`,
                [subjectId]
            );
            const total = countResult[0].total;

            return responseHelper.success(res, {
                sessions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }, 'Subject attendance sessions retrieved successfully');
        } catch (error) {
            console.error('Get subject attendance sessions error:', error);
            return responseHelper.error(res, 'Failed to retrieve subject attendance sessions', 500);
        }
    }

    // Import nhiều subjects từ Excel
    async importSubjects(req, res) {
        const subjectsToImport = req.body.name;
        const importResults = [];

        if (!Array.isArray(subjectsToImport)) {
            return responseHelper.error(res, 'Data must be an array of subjects', 400);
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const [index, subject] of subjectsToImport.entries()) {
                const result = { 
                    row: index + 2, 
                    status: 'success', 
                    message: 'Subject created successfully',
                    data: subject
                };
                const { name, code, description, credits } = subject;

                // Validate required fields
                if (!name || name.trim() === '') {
                    result.status = 'failure';
                    result.message = 'Missing required field: name';
                    importResults.push(result);
                    continue;
                }

                if (!code || code.trim() === '') {
                    result.status = 'failure';
                    result.message = 'Missing required field: code';
                    importResults.push(result);
                    continue;
                }

                // Validate credits
                if (credits && (credits < 1 || credits > 10)) {
                    result.status = 'failure';
                    result.message = 'Credits must be between 1 and 10';
                    importResults.push(result);
                    continue;
                }

                // Check for existing subject by name or code
                const [existing] = await connection.execute(
                    'SELECT id, name, code FROM subjects WHERE name = ? OR code = ?',
                    [name.trim(), code.trim()]
                );
                if (existing.length > 0) {
                    const existingSubject = existing[0];
                    if (existingSubject.name === name.trim()) {
                        result.status = 'failure';
                        result.message = `Subject with name '${name}' already exists`;
                    } else {
                        result.status = 'failure';
                        result.message = `Subject with code '${code}' already exists`;
                    }
                    importResults.push(result);
                    continue;
                }

                // Insert subject
                const [insertResult] = await connection.execute(
                    'INSERT INTO subjects (name, code, description, credits) VALUES (?, ?, ?, ?)', 
                    [name.trim(), code.trim(), description?.trim() || null, credits || 3]
                );

                result.subject_id = insertResult.insertId;
                importResults.push(result);
            }

            await connection.commit();
            
            const successCount = importResults.filter(r => r.status === 'success').length;
            const failureCount = importResults.filter(r => r.status === 'failure').length;

            return responseHelper.success(res, {
                summary: {
                    total: importResults.length,
                    success: successCount,
                    failure: failureCount
                },
                results: importResults
            }, 'Import process completed');

        } catch (error) {
            await connection.rollback();
            console.error('Bulk import subjects error:', error);
            return responseHelper.error(res, 'Error importing subjects. Transaction rolled back.', 500);
        } finally {
            connection.release();
        }
    }

    // Lấy template cho import subjects
    async getSubjectsTemplate(req, res) {
        try {
            const template = [
                { name: 'Toán học', code: 'MATH101', description: 'Toán học cơ bản', credits: 3 },
                { name: 'Vật lý', code: 'PHYS101', description: 'Vật lý đại cương', credits: 3 },
                { name: 'Hóa học', code: 'CHEM101', description: 'Hóa học đại cương', credits: 2 }
            ];

            return responseHelper.success(res, {
                template,
                instructions: {
                    required_fields: ['name', 'code'],
                    optional_fields: ['description', 'credits'],
                    field_descriptions: {
                        name: 'Tên môn học (bắt buộc, duy nhất)',
                        code: 'Mã môn học (bắt buộc, duy nhất)',
                        description: 'Mô tả môn học (tùy chọn)',
                        credits: 'Số tín chỉ (tùy chọn, mặc định: 3, từ 1-10)'
                    },
                    notes: [
                        'Tên và mã môn học phải là duy nhất',
                        'Số tín chỉ phải từ 1 đến 10',
                        'Xóa các dòng ví dụ trước khi import',
                        'Tối đa 100 môn học mỗi lần import'
                    ]
                }
            }, 'Subject template created successfully');
        } catch (error) {
            console.error('Export subjects template error:', error);
            return responseHelper.error(res, 'Failed to create subject template', 500);
        }
    }
}

module.exports = new SubjectController();