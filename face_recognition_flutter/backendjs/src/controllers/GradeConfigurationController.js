const db = require('../config/database');
const ResponseHelper = require('../utils/responseHelper');

class GradeConfigurationController {
    // Lấy cấu hình điểm cho course section
    static async getGradeConfiguration(req, res) {
        try {
            const { courseSectionId } = req.params;

            // Kiểm tra quyền teacher
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            // Kiểm tra teacher có quyền truy cập course section này không
            const [courseSections] = await db.execute(
                `SELECT cs.teacher_id FROM course_sections cs WHERE cs.id = ?`,
                [courseSectionId]
            );

            if (courseSections.length === 0) {
                return ResponseHelper.error(res, 'Course section not found', 404);
            }

            if (req.user.role === 'teacher' && courseSections[0].teacher_id !== req.user.id) {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            // Lấy cấu hình điểm
            const [configurations] = await db.execute(
                `SELECT * FROM grade_configurations WHERE course_section_id = ?`,
                [courseSectionId]
            );

            // Nếu chưa có cấu hình, tạo cấu hình mặc định
            if (configurations.length === 0) {
                const [result] = await db.execute(
                    `INSERT INTO grade_configurations (course_section_id, assignment_weight, exam_weight, attendance_weight, passing_score) 
                     VALUES (?, 30.00, 60.00, 10.00, 5.00)`,
                    [courseSectionId]
                );

                const [newConfig] = await db.execute(
                    `SELECT * FROM grade_configurations WHERE id = ?`,
                    [result.insertId]
                );

                return ResponseHelper.success(res, newConfig[0], 'Default grade configuration created');
            }

            return ResponseHelper.success(res, configurations[0], 'Grade configuration retrieved successfully');

        } catch (error) {
            console.error('Get grade configuration error:', error);
            return ResponseHelper.error(res, 'Failed to get grade configuration', 500);
        }
    }

    // Cập nhật cấu hình điểm
    static async updateGradeConfiguration(req, res) {
        try {
            const { courseSectionId } = req.params;
            const { assignment_weight, exam_weight, attendance_weight, passing_score } = req.body;

            // Kiểm tra quyền teacher
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            // Validation: tổng trọng số phải = 100%
            const totalWeight = parseFloat(assignment_weight) + parseFloat(exam_weight) + parseFloat(attendance_weight);
            if (Math.abs(totalWeight - 100) > 0.01) {
                return ResponseHelper.error(res, 'Total weight must equal 100%', 400);
            }

            // Kiểm tra teacher có quyền
            const [courseSections] = await db.execute(
                `SELECT cs.teacher_id FROM course_sections cs WHERE cs.id = ?`,
                [courseSectionId]
            );

            if (courseSections.length === 0) {
                return ResponseHelper.error(res, 'Course section not found', 404);
            }

            if (req.user.role === 'teacher' && courseSections[0].teacher_id !== req.user.id) {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            // Cập nhật hoặc tạo mới cấu hình
            const [existing] = await db.execute(
                `SELECT id FROM grade_configurations WHERE course_section_id = ?`,
                [courseSectionId]
            );

            if (existing.length > 0) {
                // Cập nhật
                await db.execute(
                    `UPDATE grade_configurations 
                     SET assignment_weight = ?, exam_weight = ?, attendance_weight = ?, passing_score = ?, updated_at = CURRENT_TIMESTAMP
                     WHERE course_section_id = ?`,
                    [assignment_weight, exam_weight, attendance_weight, passing_score, courseSectionId]
                );
            } else {
                // Tạo mới
                await db.execute(
                    `INSERT INTO grade_configurations (course_section_id, assignment_weight, exam_weight, attendance_weight, passing_score) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [courseSectionId, assignment_weight, exam_weight, attendance_weight, passing_score]
                );
            }

            // Lấy cấu hình đã cập nhật
            const [updated] = await db.execute(
                `SELECT * FROM grade_configurations WHERE course_section_id = ?`,
                [courseSectionId]
            );

            // Tính lại điểm cho tất cả sinh viên
            await GradeConfigurationController.recalculateAllGrades(courseSectionId);

            return ResponseHelper.success(res, updated[0], 'Grade configuration updated successfully');

        } catch (error) {
            console.error('Update grade configuration error:', error);
            return ResponseHelper.error(res, 'Failed to update grade configuration', 500);
        }
    }

    // Tính lại điểm cho tất cả sinh viên trong course section
    static async recalculateAllGrades(courseSectionId) {
        try {
            // Lấy danh sách sinh viên
            const [students] = await db.execute(`
                SELECT DISTINCT u.id as student_id
                FROM users u 
                JOIN class_students cs ON u.id = cs.student_id 
                JOIN course_sections course ON cs.class_id = course.class_id
                WHERE course.id = ? AND u.role = 'student'
            `, [courseSectionId]);

            // Tính lại điểm cho từng sinh viên
            for (const student of students) {
                await this.calculateStudentGrade(courseSectionId, student.student_id);
            }

        } catch (error) {
            console.error('Recalculate all grades error:', error);
            throw error;
        }
    }

    // Tính điểm cho một sinh viên
    static async calculateStudentGrade(courseSectionId, studentId) {
        try {
            // Lấy cấu hình điểm
            const [configs] = await db.execute(
                `SELECT * FROM grade_configurations WHERE course_section_id = ?`,
                [courseSectionId]
            );
            console.log('Grade configuration for courseSectionId', courseSectionId, ':', configs);
            if (configs.length === 0) {
                console.warn(`Course section ${courseSectionId} chưa có cấu hình điểm. Vui lòng cấu hình điểm trước.`);
                return;
            }

            const config = configs[0];

            // Lấy tất cả bài tập đang hoạt động
            const [activeAssignments] = await db.execute(`
                SELECT a.id, a.title, a.max_score
                FROM assignments a
                WHERE a.course_section_id = ? AND a.is_active = TRUE
            `, [courseSectionId]);

            // Lấy tất cả bài kiểm tra đang hoạt động
            const [activeExams] = await db.execute(`
                SELECT e.id, e.title, e.max_score
                FROM exams e
                WHERE e.course_section_id = ? AND e.is_active = TRUE
            `, [courseSectionId]);

            // Tính điểm trung bình bài tập (bao gồm cả điểm 0 cho bài chưa nộp)
            let assignmentTotalScore = 0;
            let assignmentCount = activeAssignments.length;

            if (assignmentCount > 0) {
                for (const assignment of activeAssignments) {
                    const [submission] = await db.execute(`
                        SELECT asub.score
                        FROM assignment_submissions asub
                        WHERE asub.assignment_id = ? AND asub.student_id = ?
                    `, [assignment.id, studentId]);

                    // Nếu có điểm thì lấy điểm, không có thì tính = 0
                    const score = submission.length > 0 && submission[0].score !== null ? submission[0].score : 0;
                    assignmentTotalScore += score;
                }
            }

            // Tính điểm trung bình kiểm tra (bao gồm cả điểm 0 cho bài chưa thi)
            let examTotalScore = 0;
            let examCount = activeExams.length;

            if (examCount > 0) {
                for (const exam of activeExams) {
                    const [examResult] = await db.execute(`
                        SELECT er.score
                        FROM exam_results er
                        WHERE er.exam_id = ? AND er.student_id = ?
                    `, [exam.id, studentId]);

                    // Nếu có điểm thì lấy điểm, không có thì tính = 0
                    const score = examResult.length > 0 && examResult[0].score !== null ? examResult[0].score : 0;
                    examTotalScore += score;
                }
            }

            // Tính điểm chuyên cần (từ attendance)
            const [attendanceScore] = await db.execute(`
                SELECT 
                    COUNT(CASE WHEN att.status = 'present' THEN 1 END) as present_count,
                    COUNT(*) as total_sessions
                FROM attendance_sessions asess
                LEFT JOIN attendances att ON asess.id = att.session_id AND att.student_id = ?
                WHERE asess.course_section_id = ?
            `, [studentId, courseSectionId]);

            // Tính điểm trung bình
            const assignmentAvgScore = assignmentCount > 0 ? assignmentTotalScore / assignmentCount : 0;
            const examAvgScore = examCount > 0 ? examTotalScore / examCount : 0;
            const attendancePercentage = attendanceScore[0]?.total_sessions > 0 
                ? (attendanceScore[0]?.present_count || 0) / attendanceScore[0].total_sessions * 10 
                : 0;

            // Tính điểm cuối theo trọng số
            const finalScore = (
                (assignmentAvgScore * config.assignment_weight / 100) +
                (examAvgScore * config.exam_weight / 100) +
                (attendancePercentage * config.attendance_weight / 100)
            );

            // Xác định xếp loại
            let letterGrade = 'F';
            let gpaPoints = 0;
            const isPassed = finalScore >= config.passing_score;

            if (finalScore >= 9.0) {
                letterGrade = 'A+';
                gpaPoints = 4.0;
            } else if (finalScore >= 8.5) {
                letterGrade = 'A';
                gpaPoints = 3.7;
            } else if (finalScore >= 8.0) {
                letterGrade = 'B+';
                gpaPoints = 3.5;
            } else if (finalScore >= 7.0) {
                letterGrade = 'B';
                gpaPoints = 3.0;
            } else if (finalScore >= 6.5) {
                letterGrade = 'C+';
                gpaPoints = 2.5;
            } else if (finalScore >= 5.5) {
                letterGrade = 'C';
                gpaPoints = 2.0;
            } else if (finalScore >= 5.0) {
                letterGrade = 'D+';
                gpaPoints = 1.5;
            } else if (finalScore >= 4.0) {
                letterGrade = 'D';
                gpaPoints = 1.0;
            }

            // Cập nhật hoặc tạo mới gradebook entry
            const [existingGradebook] = await db.execute(
                `SELECT id FROM gradebook WHERE course_section_id = ? AND student_id = ?`,
                [courseSectionId, studentId]
            );

            if (existingGradebook.length > 0) {
                // Cập nhật
                await db.execute(`
                    UPDATE gradebook 
                    SET assignment_avg = ?, exam_avg = ?, attendance_score = ?, 
                        final_score = ?, letter_grade = ?, gpa_points = ?, is_passed = ?,
                        calculated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE course_section_id = ? AND student_id = ?
                `, [
                    assignmentAvgScore, examAvgScore, attendancePercentage,
                    finalScore, letterGrade, gpaPoints, isPassed,
                    courseSectionId, studentId
                ]);
            } else {
                // Tạo mới
                await db.execute(`
                    INSERT INTO gradebook 
                    (course_section_id, student_id, assignment_avg, exam_avg, attendance_score, 
                     final_score, letter_grade, gpa_points, is_passed)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    courseSectionId, studentId, assignmentAvgScore, examAvgScore, attendancePercentage,
                    finalScore, letterGrade, gpaPoints, isPassed
                ]);
            }

        } catch (error) {
            console.error('Calculate student grade error:', error);
            throw error;
        }
    }
}

module.exports = GradeConfigurationController;