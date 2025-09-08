const CourseSection = require('../models/CourseSection');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const User = require('../models/User');
const ResponseHelper = require('../utils/responseHelper');

class CourseSectionController {
    // Lấy tất cả course sections
    static async getAllCourseSections(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                class_id: req.query.class_id,
                subject_id: req.query.subject_id,
                teacher_id: req.query.teacher_id,
                semester: req.query.semester,
                academic_year: req.query.academic_year
            };

            // Remove undefined filters
            Object.keys(filters).forEach(key => {
                if (filters[key] === undefined) {
                    delete filters[key];
                }
            });

            const result = await CourseSection.getAll(page, limit, filters);
            
            return ResponseHelper.success(res, result, 'Course sections retrieved successfully');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    // Lấy course section theo ID
    static async getCourseSectionById(req, res) {
        try {
            const { id } = req.params;
            const courseSection = await CourseSection.findById(id);
            
            if (!courseSection) {
                return ResponseHelper.error(res, 'Course section not found', 404);
            }

            return ResponseHelper.success(res, courseSection, 'Course section retrieved successfully');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    // Tạo course section mới
    static async createCourseSection(req, res) {
        try {
            const {
                name, code, class_id, subject_id, teacher_id,
                semester, academic_year, max_students, description
            } = req.body;
            // Validate required fields
            if (!name || !code || !class_id || !subject_id || !teacher_id || !semester || !academic_year) {
                return ResponseHelper.error(res, 'Missing required fields', 400);
            }

            // Check if code already exists
            const codeExists = await CourseSection.codeExists(code);
            if (codeExists) {
                return ResponseHelper.error(res, 'Course section code already exists', 400);
            }

            // Validate foreign keys
            const classExists = await Class.findById(class_id);
            if (!classExists) {
                return ResponseHelper.error(res, 'Class not found', 400);
            }

            const subjectExists = await Subject.findById(subject_id);
            if (!subjectExists) {
                return ResponseHelper.error(res, 'Subject not found', 400);
            }

            const teacherExists = await User.findById(teacher_id);
            if (!teacherExists || teacherExists.role !== 'teacher') {
                return ResponseHelper.error(res, 'Teacher not found', 400);
            }

            // Check for duplicate course section (same class, subject, semester, academic_year)
            const duplicateCheck = await CourseSection.getAll(1, 1, {
                class_id, subject_id, semester, academic_year
            });
            if (duplicateCheck.total > 0) {
                return ResponseHelper.error(res, 'Course section already exists for this class, subject, semester and academic year', 400);
            }

            const courseSection = await CourseSection.create({
                name, code, class_id, subject_id, teacher_id,
                semester, academic_year, max_students, description
            });

            return ResponseHelper.success(res, courseSection, 'Course section created successfully', 201);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    // Cập nhật course section
    static async updateCourseSection(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const courseSection = await CourseSection.findById(id);
            if (!courseSection) {
                return ResponseHelper.error(res, 'Course section not found', 404);
            }

            // Check if code is being updated and already exists
            if (updateData.code && updateData.code !== courseSection.code) {
                const codeExists = await CourseSection.codeExists(updateData.code, id);
                if (codeExists) {
                    return ResponseHelper.error(res, 'Course section code already exists', 400);
                }
            }

            // Validate foreign keys if being updated
            if (updateData.class_id) {
                const classExists = await Class.findById(updateData.class_id);
                if (!classExists) {
                    return ResponseHelper.error(res, 'Class not found', 400);
                }
            }

            if (updateData.subject_id) {
                const subjectExists = await Subject.findById(updateData.subject_id);
                if (!subjectExists) {
                    return ResponseHelper.error(res, 'Subject not found', 400);
                }
            }

            if (updateData.teacher_id) {
                const teacherExists = await User.findById(updateData.teacher_id);
                if (!teacherExists || teacherExists.role !== 'teacher') {
                    return ResponseHelper.error(res, 'Teacher not found', 400);
                }
            }

            const updatedCourseSection = await CourseSection.update(id, updateData);
            
            return ResponseHelper.success(res, updatedCourseSection, 'Course section updated successfully');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    // Xóa course section
    static async deleteCourseSection(req, res) {
        try {
            const { id } = req.params;
            
            const courseSection = await CourseSection.findById(id);
            if (!courseSection) {
                return ResponseHelper.error(res, 'Course section not found', 404);
            }

            await CourseSection.delete(id);
            
            return ResponseHelper.success(res, null, 'Course section deleted successfully');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    // Lấy schedules của course section
    static async getCourseSectionSchedules(req, res) {
        try {
            const { id } = req.params;
            
            const courseSection = await CourseSection.findById(id);
            if (!courseSection) {
                return ResponseHelper.error(res, 'Course section not found', 404);
            }

            const schedules = await CourseSection.getSchedules(id);
            
            return ResponseHelper.success(res, schedules, 'Course section schedules retrieved successfully');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    // Lấy students của course section
    static async getCourseSectionStudents(req, res) {
        try {
            const { id } = req.params;
            
            const courseSection = await CourseSection.findById(id);
            if (!courseSection) {
                return ResponseHelper.error(res, 'Course section not found', 404);
            }

            const students = await CourseSection.getStudents(id);
            
            return ResponseHelper.success(res, students, 'Course section students retrieved successfully');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    // Lấy attendance sessions của course section
    static async getCourseSectionAttendanceSessions(req, res) {
        try {
            const { id } = req.params;
            
            const courseSection = await CourseSection.findById(id);
            if (!courseSection) {
                return ResponseHelper.error(res, 'Course section not found', 404);
            }

            const sessions = await CourseSection.getAttendanceSessions(id);
            
            return ResponseHelper.success(res, sessions, 'Course section attendance sessions retrieved successfully');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    // Lấy course sections theo teacher
    static async getCourseSectionsByTeacher(req, res) {
        try {
            const { teacherId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const teacher = await User.findById(teacherId);
            if (!teacher || teacher.role !== 'teacher') {
                return ResponseHelper.error(res, 'Teacher not found', 404);
            }

            const result = await CourseSection.getByTeacher(teacherId, page, limit);
            
            return ResponseHelper.success(res, result, 'Teacher course sections retrieved successfully');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    // Lấy course sections theo class
    static async getCourseSectionsByClass(req, res) {
        try {
            const { classId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const classExists = await Class.findById(classId);
            if (!classExists) {
                return ResponseHelper.error(res, 'Class not found', 404);
            }

            const result = await CourseSection.getByClass(classId, page, limit);
            
            return ResponseHelper.success(res, result, 'Class course sections retrieved successfully');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 500);
        }
    }
}

module.exports = CourseSectionController;