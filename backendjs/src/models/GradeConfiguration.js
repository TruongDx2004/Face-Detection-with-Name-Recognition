const pool = require('../config/database');

class GradeConfiguration {
    constructor(data) {
        this.id = data.id;
        this.course_section_id = data.course_section_id;
        this.assignment_weight = data.assignment_weight;
        this.exam_weight = data.exam_weight;
        this.attendance_weight = data.attendance_weight;
        this.passing_score = data.passing_score;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Tạo cấu hình điểm mới
    static async create(configData) {
        const {
            course_section_id,
            assignment_weight = 30.00,
            exam_weight = 60.00,
            attendance_weight = 10.00,
            passing_score = 5.00
        } = configData;

        // Kiểm tra tổng tỷ trọng phải bằng 100%
        const totalWeight = assignment_weight + exam_weight + attendance_weight;
        if (Math.abs(totalWeight - 100) > 0.01) {
            throw new Error('Total weight must equal 100%');
        }

        const [result] = await pool.execute(
            `INSERT INTO grade_configurations 
            (course_section_id, assignment_weight, exam_weight, attendance_weight, passing_score) 
            VALUES (?, ?, ?, ?, ?)`,
            [course_section_id, assignment_weight, exam_weight, attendance_weight, passing_score]
        );

        return result.insertId;
    }

    // Lấy cấu hình theo course section
    static async getByCourseSection(courseSectionId) {
        const [rows] = await pool.execute(
            `SELECT gc.*, 
                    cs.name as course_name,
                    s.name as subject_name
            FROM grade_configurations gc
            JOIN course_sections cs ON gc.course_section_id = cs.id
            JOIN subjects s ON cs.subject_id = s.id
            WHERE gc.course_section_id = ?`,
            [courseSectionId]
        );
        return rows.length > 0 ? new GradeConfiguration(rows[0]) : null;
    }

    // Lấy cấu hình theo ID
    static async getById(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM grade_configurations WHERE id = ?',
            [id]
        );
        return rows.length > 0 ? new GradeConfiguration(rows[0]) : null;
    }

    // Cập nhật cấu hình
    static async update(courseSectionId, updateData) {
        const {
            assignment_weight,
            exam_weight,
            attendance_weight,
            passing_score
        } = updateData;

        // Kiểm tra tổng tỷ trọng nếu có cập nhật
        if (assignment_weight !== undefined && exam_weight !== undefined && attendance_weight !== undefined) {
            const totalWeight = assignment_weight + exam_weight + attendance_weight;
            if (Math.abs(totalWeight - 100) > 0.01) {
                throw new Error('Total weight must equal 100%');
            }
        }

        const fields = [];
        const values = [];

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(updateData[key]);
            }
        });

        if (fields.length === 0) return false;

        values.push(courseSectionId);
        const [result] = await pool.execute(
            `UPDATE grade_configurations SET ${fields.join(', ')} WHERE course_section_id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    // Tạo hoặc cập nhật cấu hình
    static async createOrUpdate(configData) {
        const {
            course_section_id,
            assignment_weight = 30.00,
            exam_weight = 60.00,
            attendance_weight = 10.00,
            passing_score = 5.00
        } = configData;

        // Kiểm tra tổng tỷ trọng
        const totalWeight = assignment_weight + exam_weight + attendance_weight;
        if (Math.abs(totalWeight - 100) > 0.01) {
            throw new Error('Total weight must equal 100%');
        }

        const [result] = await pool.execute(
            `INSERT INTO grade_configurations 
            (course_section_id, assignment_weight, exam_weight, attendance_weight, passing_score) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            assignment_weight = VALUES(assignment_weight),
            exam_weight = VALUES(exam_weight),
            attendance_weight = VALUES(attendance_weight),
            passing_score = VALUES(passing_score),
            updated_at = CURRENT_TIMESTAMP`,
            [course_section_id, assignment_weight, exam_weight, attendance_weight, passing_score]
        );

        return result.insertId || result.affectedRows > 0;
    }

    // Lấy tất cả cấu hình của giáo viên
    static async getByTeacher(teacherId) {
        const [rows] = await pool.execute(
            `SELECT gc.*, 
                    cs.name as course_name,
                    s.name as subject_name,
                    cs.semester,
                    cs.academic_year
            FROM grade_configurations gc
            JOIN course_sections cs ON gc.course_section_id = cs.id
            JOIN subjects s ON cs.subject_id = s.id
            WHERE cs.teacher_id = ?
            ORDER BY cs.academic_year DESC, cs.semester DESC`,
            [teacherId]
        );
        return rows.map(row => new GradeConfiguration(row));
    }

    // Xóa cấu hình
    static async delete(courseSectionId) {
        const [result] = await pool.execute(
            'DELETE FROM grade_configurations WHERE course_section_id = ?',
            [courseSectionId]
        );
        return result.affectedRows > 0;
    }

    // Lấy cấu hình mặc định
    static getDefaultConfiguration() {
        return {
            assignment_weight: 30.00,
            exam_weight: 60.00,
            attendance_weight: 10.00,
            passing_score: 5.00
        };
    }

    // Validate cấu hình
    static validateConfiguration(config) {
        const errors = [];

        // Kiểm tra tỷ trọng
        if (config.assignment_weight < 0 || config.assignment_weight > 100) {
            errors.push('Assignment weight must be between 0 and 100');
        }
        if (config.exam_weight < 0 || config.exam_weight > 100) {
            errors.push('Exam weight must be between 0 and 100');
        }
        if (config.attendance_weight < 0 || config.attendance_weight > 100) {
            errors.push('Attendance weight must be between 0 and 100');
        }

        // Kiểm tra tổng tỷ trọng
        const totalWeight = config.assignment_weight + config.exam_weight + config.attendance_weight;
        if (Math.abs(totalWeight - 100) > 0.01) {
            errors.push('Total weight must equal 100%');
        }

        // Kiểm tra điểm đậu
        if (config.passing_score < 0 || config.passing_score > 10) {
            errors.push('Passing score must be between 0 and 10');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Tính toán điểm theo cấu hình
    static calculateFinalScore(config, assignmentAvg, examAvg, attendanceScore) {
        return (
            (assignmentAvg * config.assignment_weight / 100) +
            (examAvg * config.exam_weight / 100) +
            (attendanceScore * config.attendance_weight / 100)
        );
    }

    // Lấy thống kê sử dụng cấu hình
    static async getConfigurationStats() {
        const [rows] = await pool.execute(
            `SELECT 
                COUNT(*) as total_configurations,
                AVG(assignment_weight) as avg_assignment_weight,
                AVG(exam_weight) as avg_exam_weight,
                AVG(attendance_weight) as avg_attendance_weight,
                AVG(passing_score) as avg_passing_score,
                COUNT(CASE WHEN assignment_weight = 30 AND exam_weight = 60 AND attendance_weight = 10 THEN 1 END) as default_config_count
            FROM grade_configurations`
        );
        return rows[0];
    }

    // Copy cấu hình từ lớp học phần khác
    static async copyConfiguration(fromCourseSectionId, toCourseSectionId) {
        const sourceConfig = await this.getByCourseSection(fromCourseSectionId);
        if (!sourceConfig) {
            throw new Error('Source configuration not found');
        }

        return await this.createOrUpdate({
            course_section_id: toCourseSectionId,
            assignment_weight: sourceConfig.assignment_weight,
            exam_weight: sourceConfig.exam_weight,
            attendance_weight: sourceConfig.attendance_weight,
            passing_score: sourceConfig.passing_score
        });
    }
}

module.exports = GradeConfiguration;