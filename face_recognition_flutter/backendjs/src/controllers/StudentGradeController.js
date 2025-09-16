const db = require('../config/database');
const ResponseHelper = require('../utils/responseHelper');

class StudentGradeController {
    // Lấy điểm các học phần hiện tại của sinh viên
    static async getCurrentGrades(req, res) {
        try {
            const { userId } = req.params;

            // Kiểm tra quyền truy cập (student chỉ xem điểm của mình)
            if (req.user.role === 'student' && req.user.id !== parseInt(userId)) {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            // Lấy điểm các học phần hiện tại (học kỳ đang diễn ra)
            const [grades] = await db.execute(`
                SELECT g.*, 
                       cs.name as course_section_name,
                       s.name as subject_name,
                       s.credits,
                       cs.semester,
                       cs.academic_year,
                       cs.is_active,
                       u.full_name as teacher_name
                FROM gradebook g
                JOIN course_sections cs ON g.course_section_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                JOIN users u ON cs.teacher_id = u.id
                WHERE g.student_id = ? AND cs.is_active = TRUE
                ORDER BY s.name ASC
            `, [userId]);

            return ResponseHelper.success(res, grades, 'Current grades retrieved successfully');

        } catch (error) {
            console.error('Get current grades error:', error);
            return ResponseHelper.error(res, 'Failed to get current grades', 500);
        }
    }

    // Lấy tổng kết điểm theo học kỳ
    static async getSemesterSummaries(req, res) {
        try {
            const { userId } = req.params;

            // Kiểm tra quyền truy cập
            if (req.user.role === 'student' && req.user.id !== parseInt(userId)) {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            // Lấy danh sách học kỳ đã hoàn thành
            const [semesters] = await db.execute(`
                SELECT DISTINCT cs.semester, cs.academic_year
                FROM gradebook g
                JOIN course_sections cs ON g.course_section_id = cs.id
                WHERE g.student_id = ? AND cs.is_active = FALSE
                ORDER BY cs.academic_year DESC, cs.semester DESC
            `, [userId]);

            const semesterSummaries = [];

            for (const semester of semesters) {
                // Lấy tất cả điểm trong học kỳ này
                const [semesterGrades] = await db.execute(`
                    SELECT g.*, 
                           cs.name as course_section_name,
                           s.name as subject_name,
                           s.credits,
                           cs.semester,
                           cs.academic_year
                    FROM gradebook g
                    JOIN course_sections cs ON g.course_section_id = cs.id
                    JOIN subjects s ON cs.subject_id = s.id
                    WHERE g.student_id = ? 
                      AND cs.semester = ? 
                      AND cs.academic_year = ?
                    ORDER BY s.name ASC
                `, [userId, semester.semester, semester.academic_year]);

                // Tính toán thống kê học kỳ
                let totalCredits = 0;
                let totalGpaPoints = 0;
                let passedSubjects = 0;

                semesterGrades.forEach(grade => {
                    const credits = grade.credits || 3; // Mặc định 3 tín chỉ
                    totalCredits += credits;

                    if (grade.gpa_points) {
                        totalGpaPoints += grade.gpa_points * credits;
                    }

                    if (grade.is_passed) {
                        passedSubjects++;
                    }
                });

                const averageGpa = totalCredits > 0 ? totalGpaPoints / totalCredits : 0;

                semesterSummaries.push({
                    semester: semester.semester,
                    academic_year: semester.academic_year,
                    total_credits: totalCredits,
                    average_gpa: parseFloat(averageGpa.toFixed(2)),
                    total_subjects: semesterGrades.length,
                    passed_subjects: passedSubjects,
                    grades: semesterGrades
                });
            }

            return ResponseHelper.success(res, semesterSummaries, 'Semester summaries retrieved successfully');

        } catch (error) {
            console.error('Get semester summaries error:', error);
            return ResponseHelper.error(res, 'Failed to get semester summaries', 500);
        }
    }

    // Lấy GPA tích lũy tổng thể
    static async getGpaOverall(req, res) {
        try {
            const { userId } = req.params;

            // Kiểm tra quyền truy cập
            if (req.user.role === 'student' && req.user.id !== parseInt(userId)) {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            // Tính GPA tích lũy
            const [gpaData] = await db.execute(`
                SELECT 
                    COUNT(DISTINCT CONCAT(cs.semester, '-', cs.academic_year)) as total_semesters,
                    SUM(s.credits) as total_credits,
                    SUM(g.gpa_points * s.credits) as total_gpa_points,
                    AVG(g.final_score) as average_score,
                    COUNT(g.id) as total_subjects,
                    SUM(CASE WHEN g.is_passed = 1 THEN 1 ELSE 0 END) as passed_subjects
                FROM gradebook g
                JOIN course_sections cs ON g.course_section_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                WHERE g.student_id = ? AND g.final_score IS NOT NULL
            `, [userId]);

            const data = gpaData[0];
            const cumulativeGpa = data.total_credits > 0
                ? data.total_gpa_points / data.total_credits
                : 0;

            // Xếp loại học tập
            let classification = 'Kém';
            if (cumulativeGpa >= 3.6) {
                classification = 'Xuất sắc';
            } else if (cumulativeGpa >= 3.2) {
                classification = 'Giỏi';
            } else if (cumulativeGpa >= 2.5) {
                classification = 'Khá';
            } else if (cumulativeGpa >= 2.0) {
                classification = 'Trung bình';
            } else if (cumulativeGpa >= 1.0) {
                classification = 'Yếu';
            }

            const gpaOverall = {
                cumulative_gpa: parseFloat(cumulativeGpa.toFixed(2)),
                total_credits: data.total_credits || 0,
                total_semesters: data.total_semesters || 0,
                average_score: +(Number(data.average_score || 0).toFixed(2)),
                classification: classification,
                total_subjects: data.total_subjects || 0,
                passed_subjects: data.passed_subjects || 0,
                pass_rate: data.total_subjects > 0
                    ? parseFloat(((data.passed_subjects / data.total_subjects) * 100).toFixed(1))
                    : 0
            };

            return ResponseHelper.success(res, gpaOverall, 'GPA overall retrieved successfully');

        } catch (error) {
            console.error('Get GPA overall error:', error);
            return ResponseHelper.error(res, 'Failed to get GPA overall', 500);
        }
    }

    // Lấy chi tiết điểm của một học phần
    static async getCourseSectionGradeDetail(req, res) {
        try {
            const { userId, courseSectionId } = req.params;

            // Kiểm tra quyền truy cập
            if (req.user.role === 'student' && req.user.id !== parseInt(userId)) {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            // Lấy thông tin tổng quát của học phần
            const [overallGrade] = await db.execute(`
                SELECT g.*, 
                       cs.name as course_section_name,
                       s.name as subject_name,
                       s.credits,
                       cs.semester,
                       cs.academic_year,
                       u.full_name as teacher_name
                FROM gradebook g
                JOIN course_sections cs ON g.course_section_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                JOIN users u ON cs.teacher_id = u.id
                WHERE g.student_id = ? AND g.course_section_id = ?
            `, [userId, courseSectionId]);

            if (overallGrade.length === 0) {
                return ResponseHelper.error(res, 'Grade record not found', 404);
            }

            // Lấy cấu hình điểm
            const [gradeConfig] = await db.execute(`
                SELECT * FROM grade_configurations 
                WHERE course_section_id = ?
            `, [courseSectionId]);

            const configuration = gradeConfig[0] || {
                assignment_weight: 30.0,
                exam_weight: 60.0,
                attendance_weight: 10.0,
                passing_score: 5.0
            };

            // Lấy điểm bài tập chi tiết
            const [assignments] = await db.execute(`
                SELECT asub.id, asub.assignment_id, a.title as assignment_title,
                       asub.score, a.max_score, asub.status,
                       asub.submitted_at, asub.graded_at, asub.feedback
                FROM assignments a
                LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = ?
                WHERE a.course_section_id = ? AND a.is_active = TRUE
                ORDER BY a.due_date ASC
            `, [userId, courseSectionId]);

            // Lấy điểm kiểm tra chi tiết
            const [exams] = await db.execute(`
                SELECT er.id, er.exam_id, e.title as exam_title,
                       er.score, e.max_score, er.status,
                       er.end_time as completed_at, er.graded_at
                FROM exams e
                LEFT JOIN exam_results er ON e.id = er.exam_id AND er.student_id = ?
                WHERE e.course_section_id = ? AND e.is_active = TRUE
                ORDER BY e.exam_date ASC
            `, [userId, courseSectionId]);

            const gradeDetail = {
                overall_grade: overallGrade[0],
                assignments: assignments,
                exams: exams,
                grade_configuration: configuration
            };

            return ResponseHelper.success(res, gradeDetail, 'Course section grade detail retrieved successfully');

        } catch (error) {
            console.error('Get course section grade detail error:', error);
            return ResponseHelper.error(res, 'Failed to get course section grade detail', 500);
        }
    }

    // Lấy lịch sử thay đổi điểm
    static async getGradeHistory(req, res) {
        try {
            const { userId } = req.params;

            // Kiểm tra quyền truy cập
            if (req.user.role === 'student' && req.user.id !== parseInt(userId)) {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            // Lấy lịch sử thay đổi điểm (có thể tạo bảng grade_history nếu cần)
            const [assignmentHistory] = await db.execute(`
                SELECT 'assignment' as type, asub.id, a.title, asub.score, 
                       asub.graded_at as updated_at, s.name as subject_name
                FROM assignment_submissions asub
                JOIN assignments a ON asub.assignment_id = a.id
                JOIN course_sections cs ON a.course_section_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                WHERE asub.student_id = ? AND asub.graded_at IS NOT NULL
                
                UNION ALL
                
                SELECT 'exam' as type, er.id, e.title, er.score,
                       er.graded_at as updated_at, s.name as subject_name
                FROM exam_results er
                JOIN exams e ON er.exam_id = e.id
                JOIN course_sections cs ON e.course_section_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                WHERE er.student_id = ? AND er.graded_at IS NOT NULL
                
                ORDER BY updated_at DESC
                LIMIT 50
            `, [userId, userId]);

            return ResponseHelper.success(res, assignmentHistory, 'Grade history retrieved successfully');

        } catch (error) {
            console.error('Get grade history error:', error);
            return ResponseHelper.error(res, 'Failed to get grade history', 500);
        }
    }

    // Lấy thống kê điểm theo thời gian
    static async getGradeStatistics(req, res) {
        try {
            const { userId } = req.params;

            // Kiểm tra quyền truy cập
            if (req.user.role === 'student' && req.user.id !== parseInt(userId)) {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            // Thống kê điểm theo học kỳ
            const [semesterStats] = await db.execute(`
                SELECT 
                    cs.semester,
                    cs.academic_year,
                    AVG(g.final_score) as avg_score,
                    AVG(g.gpa_points) as avg_gpa,
                    COUNT(g.id) as total_subjects,
                    SUM(CASE WHEN g.is_passed = 1 THEN 1 ELSE 0 END) as passed_subjects
                FROM gradebook g
                JOIN course_sections cs ON g.course_section_id = cs.id
                WHERE g.student_id = ? AND g.final_score IS NOT NULL
                GROUP BY cs.semester, cs.academic_year
                ORDER BY cs.academic_year ASC, cs.semester ASC
            `, [userId]);

            // Thống kê theo loại điểm
            const [gradeDistribution] = await db.execute(`
                SELECT 
                    CASE 
                        WHEN g.final_score >= 9.0 THEN 'A+'
                        WHEN g.final_score >= 8.5 THEN 'A'
                        WHEN g.final_score >= 8.0 THEN 'B+'
                        WHEN g.final_score >= 7.0 THEN 'B'
                        WHEN g.final_score >= 6.5 THEN 'C+'
                        WHEN g.final_score >= 5.5 THEN 'C'
                        WHEN g.final_score >= 5.0 THEN 'D+'
                        WHEN g.final_score >= 4.0 THEN 'D'
                        ELSE 'F'
                    END as grade_letter,
                    COUNT(*) as count
                FROM gradebook g
                WHERE g.student_id = ? AND g.final_score IS NOT NULL
                GROUP BY grade_letter
                ORDER BY 
                    CASE grade_letter
                        WHEN 'A+' THEN 1
                        WHEN 'A' THEN 2
                        WHEN 'B+' THEN 3
                        WHEN 'B' THEN 4
                        WHEN 'C+' THEN 5
                        WHEN 'C' THEN 6
                        WHEN 'D+' THEN 7
                        WHEN 'D' THEN 8
                        WHEN 'F' THEN 9
                    END
            `, [userId]);

            const statistics = {
                semester_progression: semesterStats,
                grade_distribution: gradeDistribution
            };

            return ResponseHelper.success(res, statistics, 'Grade statistics retrieved successfully');

        } catch (error) {
            console.error('Get grade statistics error:', error);
            return ResponseHelper.error(res, 'Failed to get grade statistics', 500);
        }
    }
}

module.exports = StudentGradeController;