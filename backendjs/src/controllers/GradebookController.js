const Gradebook = require('../models/Gradebook');
const GradeConfiguration = require('../models/GradeConfiguration');
const { responseHelper } = require('../utils/responseHelper');

class GradebookController {
    // Tính toán điểm cho một sinh viên
    static async calculateStudentGrade(req, res) {
        try {
            const { courseSectionId, studentId } = req.params;

            // Kiểm tra quyền
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return responseHelper.error(res, 'Access denied', 403);
            }

            const grade = await Gradebook.calculateGrade(courseSectionId, studentId);
            responseHelper.success(res, grade, 'Grade calculated successfully');

        } catch (error) {
            console.error('Calculate grade error:', error);
            responseHelper.error(res, 'Failed to calculate grade', 500);
        }
    }

    // Tính toán lại điểm cho tất cả sinh viên trong lớp
    static async recalculateAllGrades(req, res) {
        try {
            const { courseSectionId } = req.params;

            // Kiểm tra quyền
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return responseHelper.error(res, 'Access denied', 403);
            }

            const results = await Gradebook.recalculateAllGrades(courseSectionId);
            responseHelper.success(res, results, 'All grades recalculated successfully');

        } catch (error) {
            console.error('Recalculate grades error:', error);
            responseHelper.error(res, 'Failed to recalculate grades', 500);
        }
    }

    // Lấy sổ điểm theo lớp học phần
    static async getGradebookByCourseSection(req, res) {
        try {
            const { courseSectionId } = req.params;

            // Kiểm tra quyền
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return responseHelper.error(res, 'Access denied', 403);
            }

            const gradebook = await Gradebook.getByCourseSection(courseSectionId);
            responseHelper.success(res, gradebook, 'Gradebook retrieved successfully');

        } catch (error) {
            console.error('Get gradebook error:', error);
            responseHelper.error(res, 'Failed to retrieve gradebook', 500);
        }
    }

    // Lấy sổ điểm của sinh viên
    static async getStudentGradebook(req, res) {
        try {
            const { studentId } = req.params;
            const { courseSectionId } = req.query;

            // Kiểm tra quyền: sinh viên chỉ xem được điểm của mình
            if (req.user.role === 'student' && req.user.id != studentId) {
                return responseHelper.error(res, 'Access denied', 403);
            }

            const gradebook = await Gradebook.getByStudent(studentId, courseSectionId);
            responseHelper.success(res, gradebook, 'Student gradebook retrieved successfully');

        } catch (error) {
            console.error('Get student gradebook error:', error);
            responseHelper.error(res, 'Failed to retrieve student gradebook', 500);
        }
    }

    // Lấy thống kê điểm số
    static async getGradeStatistics(req, res) {
        try {
            const { courseSectionId } = req.params;

            // Kiểm tra quyền
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return responseHelper.error(res, 'Access denied', 403);
            }

            const stats = await Gradebook.getGradeStatistics(courseSectionId);
            responseHelper.success(res, stats, 'Grade statistics retrieved successfully');

        } catch (error) {
            console.error('Get grade statistics error:', error);
            responseHelper.error(res, 'Failed to retrieve grade statistics', 500);
        }
    }

    // Tính GPA của sinh viên
    static async getStudentGPA(req, res) {
        try {
            const { studentId } = req.params;

            // Kiểm tra quyền: sinh viên chỉ xem được GPA của mình
            if (req.user.role === 'student' && req.user.id != studentId) {
                return responseHelper.error(res, 'Access denied', 403);
            }

            const gpa = await Gradebook.calculateStudentGPA(studentId);
            responseHelper.success(res, { gpa }, 'Student GPA calculated successfully');

        } catch (error) {
            console.error('Calculate GPA error:', error);
            responseHelper.error(res, 'Failed to calculate GPA', 500);
        }
    }

    // Lấy cấu hình điểm số
    static async getGradeConfiguration(req, res) {
        try {
            const { courseSectionId } = req.params;

            const config = await GradeConfiguration.getByCourseSection(courseSectionId);
            if (!config) {
                // Trả về cấu hình mặc định nếu chưa có
                const defaultConfig = GradeConfiguration.getDefaultConfiguration();
                return responseHelper.success(res, defaultConfig, 'Default grade configuration retrieved');
            }

            responseHelper.success(res, config, 'Grade configuration retrieved successfully');

        } catch (error) {
            console.error('Get grade configuration error:', error);
            responseHelper.error(res, 'Failed to retrieve grade configuration', 500);
        }
    }

    // Cập nhật cấu hình điểm số
    static async updateGradeConfiguration(req, res) {
        try {
            const { courseSectionId } = req.params;
            const configData = req.body;

            // Kiểm tra quyền
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return responseHelper.error(res, 'Access denied', 403);
            }

            // Validate cấu hình
            const validation = GradeConfiguration.validateConfiguration(configData);
            if (!validation.isValid) {
                return responseHelper.error(res, validation.errors.join(', '), 400);
            }

            await GradeConfiguration.createOrUpdate({
                course_section_id: courseSectionId,
                ...configData
            });

            const config = await GradeConfiguration.getByCourseSection(courseSectionId);
            responseHelper.success(res, config, 'Grade configuration updated successfully');

        } catch (error) {
            console.error('Update grade configuration error:', error);
            responseHelper.error(res, 'Failed to update grade configuration', 500);
        }
    }

    // Copy cấu hình từ lớp khác
    static async copyGradeConfiguration(req, res) {
        try {
            const { courseSectionId } = req.params;
            const { fromCourseSectionId } = req.body;

            // Kiểm tra quyền
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return responseHelper.error(res, 'Access denied', 403);
            }

            await GradeConfiguration.copyConfiguration(fromCourseSectionId, courseSectionId);
            const config = await GradeConfiguration.getByCourseSection(courseSectionId);
            
            responseHelper.success(res, config, 'Grade configuration copied successfully');

        } catch (error) {
            console.error('Copy grade configuration error:', error);
            responseHelper.error(res, error.message || 'Failed to copy grade configuration', 500);
        }
    }

    // Lấy cấu hình của giáo viên
    static async getTeacherConfigurations(req, res) {
        try {
            const teacherId = req.user.id;

            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return responseHelper.error(res, 'Access denied', 403);
            }

            const configurations = await GradeConfiguration.getByTeacher(teacherId);
            responseHelper.success(res, configurations, 'Teacher configurations retrieved successfully');

        } catch (error) {
            console.error('Get teacher configurations error:', error);
            responseHelper.error(res, 'Failed to retrieve teacher configurations', 500);
        }
    }

    // Xuất sổ điểm (CSV format)
    static async exportGradebook(req, res) {
        try {
            const { courseSectionId } = req.params;

            // Kiểm tra quyền
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return responseHelper.error(res, 'Access denied', 403);
            }

            const gradebook = await Gradebook.getByCourseSection(courseSectionId);
            
            // Tạo CSV content
            const csvHeader = 'Student Code,Student Name,Assignment Avg,Exam Avg,Attendance Score,Final Score,Letter Grade,GPA Points,Status\n';
            const csvRows = gradebook.map(record => {
                return [
                    record.student_code || '',
                    record.student_name,
                    record.assignment_avg,
                    record.exam_avg,
                    record.attendance_score,
                    record.final_score,
                    record.letter_grade || '',
                    record.gpa_points,
                    record.is_passed ? 'Passed' : 'Failed'
                ].join(',');
            }).join('\n');

            const csvContent = csvHeader + csvRows;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="gradebook_${courseSectionId}.csv"`);
            res.send(csvContent);

        } catch (error) {
            console.error('Export gradebook error:', error);
            responseHelper.error(res, 'Failed to export gradebook', 500);
        }
    }

    // Lấy bảng xếp hạng lớp
    static async getClassRanking(req, res) {
        try {
            const { courseSectionId } = req.params;

            // Kiểm tra quyền
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return responseHelper.error(res, 'Access denied', 403);
            }

            const gradebook = await Gradebook.getByCourseSection(courseSectionId);
            
            // Thêm thứ hạng
            const ranking = gradebook.map((record, index) => ({
                ...record,
                rank: index + 1
            }));

            responseHelper.success(res, ranking, 'Class ranking retrieved successfully');

        } catch (error) {
            console.error('Get class ranking error:', error);
            responseHelper.error(res, 'Failed to retrieve class ranking', 500);
        }
    }

    // Xóa bản ghi sổ điểm
    static async deleteGradebookRecord(req, res) {
        try {
            const { courseSectionId, studentId } = req.params;

            // Kiểm tra quyền
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return responseHelper.error(res, 'Access denied', 403);
            }

            const deleted = await Gradebook.delete(courseSectionId, studentId);
            if (!deleted) {
                return responseHelper.error(res, 'Gradebook record not found', 404);
            }

            responseHelper.success(res, null, 'Gradebook record deleted successfully');

        } catch (error) {
            console.error('Delete gradebook record error:', error);
            responseHelper.error(res, 'Failed to delete gradebook record', 500);
        }
    }
}

module.exports = GradebookController;