const Exam = require('../models/Exam');
const ExamQuestion = require('../models/ExamQuestion');
const ExamResult = require('../models/ExamResult');
const ExamAnswer = require('../models/ExamAnswer');
const ResponseHelper = require('../utils/responseHelper');

class ExamController {
    // Tạo bài kiểm tra mới
    static async createExam(req, res) {
        try {
            const {
                course_section_id,
                title,
                description,
                exam_type,
                max_score,
                duration_minutes,
                exam_date,
                start_time,
                end_time,
                instructions,
                questions
            } = req.body;

            // Kiểm tra quyền giáo viên
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            // Tạo bài thi
            const examId = await Exam.create({
                course_section_id,
                title,
                description,
                exam_type,
                max_score,
                duration_minutes,
                exam_date,
                start_time,
                end_time,
                instructions
            });

            // Thêm câu hỏi nếu có
            if (questions && questions.length > 0) {
                await ExamQuestion.createMultiple(examId, questions);
            }

            const exam = await Exam.getById(examId);
            ResponseHelper.success(res, exam, 'Exam created successfully', 201);

        } catch (error) {
            console.error('Create exam error:', error);
            ResponseHelper.error(res, 'Failed to create exam', 500);
        }
    }

    // Lấy danh sách bài kiểm tra theo lớp học phần
    static async getExamsByCourseSection(req, res) {
        try {
            const { courseSectionId } = req.params;
            const exams = await Exam.getByCourseSection(courseSectionId);

            // Lấy câu hỏi cho từng exam (không bao gồm đáp án cho sinh viên)
            const includeAnswers = req.user.role === 'teacher' || req.user.role === 'admin';
            const examsWithQuestions = await Promise.all(
                exams.map(async (exam) => {
                    const questions = await ExamQuestion.getByExam(exam.id, includeAnswers);
                    
                    // Tính điểm cho mỗi câu hỏi = max_score / số lượng câu hỏi
                    const pointsPerQuestion = questions.length > 0 ? exam.max_score / questions.length : 0;
                    const questionsWithPoints = questions.map(question => ({
                        ...question,
                        points: pointsPerQuestion
                    }));
                    
                    return {
                        ...exam,
                        questions: questionsWithPoints
                    };
                })
            );

            ResponseHelper.success(res, examsWithQuestions, 'Exams retrieved successfully');

        } catch (error) {
            console.error('Get exams error:', error);
            ResponseHelper.error(res, 'Failed to retrieve exams', 500);
        }
    }

    // Lấy chi tiết bài kiểm tra
    static async getExamById(req, res) {
        try {
            const { id } = req.params;
            const exam = await Exam.getById(id);

            if (!exam) {
                return ResponseHelper.error(res, 'Exam not found', 404);
            }

            // Lấy câu hỏi (ẩn đáp án nếu là sinh viên)
            const includeAnswers = req.user.role === 'teacher' || req.user.role === 'admin';
            const questions = await ExamQuestion.getByExam(id, includeAnswers);

            // Tính điểm cho mỗi câu hỏi = max_score / số lượng câu hỏi
            const pointsPerQuestion = questions.length > 0 ? exam.max_score / questions.length : 0;
            const questionsWithPoints = questions.map(question => ({
                ...question,
                points: pointsPerQuestion
            }));

            // Trả về exam với questions đã được bao gồm
            const examWithQuestions = {
                ...exam,
                questions: questionsWithPoints
            };

            ResponseHelper.success(res, examWithQuestions, 'Exam retrieved successfully');

        } catch (error) {
            console.error('Get exam error:', error);
            ResponseHelper.error(res, 'Failed to retrieve exam', 500);
        }
    }

    // Cập nhật bài kiểm tra
    static async updateExam(req, res) {
        try {
            const { id } = req.params;
            const { questions, ...examData } = req.body;

            // Kiểm tra quyền
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Truy cập bị từ chối', 403);
            }

            // Cập nhật exam
            const updated = await Exam.update(id, examData);
            if (!updated) {
                return ResponseHelper.error(res, 'Không tìm thấy dữ liệu', 404);
            }

            // Nếu có danh sách câu hỏi thì cập nhật
            if (questions && questions.length > 0) {
                await ExamQuestion.replaceMultiple(id, questions);
                // bạn có thể viết hàm replaceMultiple = xóa cũ, thêm mới
            }

            const exam = await Exam.getById(id);
            ResponseHelper.success(res, exam, 'Câp nhật thành công');

        } catch (error) {
            console.error('Update exam error:', error);
            ResponseHelper.error(res, 'Failed to update exam', 500);
        }
    }


    // Xóa bài kiểm tra
    static async deleteExam(req, res) {
        try {
            const { id } = req.params;

            // Kiểm tra quyền
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            const deleted = await Exam.delete(id);
            if (!deleted) {
                return ResponseHelper.error(res, 'Exam not found', 404);
            }

            ResponseHelper.success(res, null, 'Exam deleted successfully');

        } catch (error) {
            console.error('Delete exam error:', error);
            ResponseHelper.error(res, 'Failed to delete exam', 500);
        }
    }

    // Bắt đầu làm bài thi
    static async startExam(req, res) {
        try {
            const { examId } = req.params;
            const studentId = req.user.id;

            // Kiểm tra quyền sinh viên
            if (req.user.role !== 'student') {
                return ResponseHelper.error(res, 'Only students can take exams', 403);
            }

            // Kiểm tra xem có thể làm bài không
            const { canTake, reason, exam } = await Exam.canTakeExam(examId, studentId);
            if (!canTake) {
                return ResponseHelper.error(res, reason, 400);
            }

            // Lấy câu hỏi (không bao gồm đáp án cho sinh viên)
            const questions = await ExamQuestion.getByExam(examId, false);
            
            if (!questions || questions.length === 0) {
                return ResponseHelper.error(res, 'Exam has no questions', 400);
            }

            // Tính điểm cho mỗi câu hỏi = max_score / số lượng câu hỏi
            const pointsPerQuestion = exam.max_score / questions.length;
            
            // Cập nhật điểm cho từng câu hỏi
            const questionsWithPoints = questions.map(question => ({
                ...question,
                points: pointsPerQuestion
            }));

            // Sử dụng max_score của exam làm tổng điểm
            const totalScore = exam.max_score;

            // Bắt đầu làm bài
            const resultId = await ExamResult.startExam(examId, studentId, totalScore);

            // Tạo exam object với đầy đủ thông tin và questions (với điểm đã cập nhật)
            const examWithQuestions = {
                ...exam,
                questions: questionsWithPoints
            };

            ResponseHelper.success(res, {
                result_id: resultId,
                exam: examWithQuestions,
                questions: questionsWithPoints,
                duration_minutes: exam.duration_minutes
            }, 'Exam started successfully');

        } catch (error) {
            console.error('Start exam error:', error);
            ResponseHelper.error(res, error.message || 'Failed to start exam', 500);
        }
    }

    // Lưu câu trả lời
    static async saveAnswer(req, res) {
        try {
            const { resultId } = req.params;
            const { question_id, student_answer } = req.body;

            // Kiểm tra quyền sinh viên
            if (req.user.role !== 'student') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            await ExamAnswer.saveAnswer({
                exam_result_id: resultId,
                question_id,
                student_answer
            });

            ResponseHelper.success(res, null, 'Answer saved successfully');

        } catch (error) {
            console.error('Save answer error:', error);
            ResponseHelper.error(res, 'Failed to save answer', 500);
        }
    }

    // Nộp bài thi
    static async submitExam(req, res) {
        try {
            const { resultId } = req.params;
            const { answers } = req.body;

            // Kiểm tra quyền sinh viên
            if (req.user.role !== 'student') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            // Lưu tất cả câu trả lời
            if (answers && answers.length > 0) {
                await ExamAnswer.saveMultipleAnswers(resultId, answers);
            }

            // Nộp bài
            const submitted = await ExamResult.submitExam(resultId);
            if (!submitted) {
                return ResponseHelper.error(res, 'Failed to submit exam', 400);
            }

            const result = await ExamResult.getById(resultId);
            ResponseHelper.success(res, result, 'Exam submitted successfully');

        } catch (error) {
            console.error('Submit exam error:', error);
            ResponseHelper.error(res, 'Failed to submit exam', 500);
        }
    }

    // Lấy kết quả thi
    static async getExamResults(req, res) {
        try {
            const { examId } = req.params;

            // Kiểm tra quyền giáo viên
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            const results = await ExamResult.getByExam(examId);
            ResponseHelper.success(res, results, 'Exam results retrieved successfully');

        } catch (error) {
            console.error('Get exam results error:', error);
            ResponseHelper.error(res, 'Failed to retrieve exam results', 500);
        }
    }

    // Lấy kết quả thi của sinh viên
    static async getStudentExamResult(req, res) {
        try {
            const { examId } = req.params;
            const studentId = req.user.role === 'student' ? req.user.id : req.query.studentId;

            if (!studentId) {
                return ResponseHelper.error(res, 'Student ID is required', 400);
            }

            const result = await ExamResult.getByExamAndStudent(examId, studentId);
            if (!result) {
                return ResponseHelper.error(res, 'Exam result not found', 404);
            }

            // Lấy câu trả lời
            const answers = await ExamAnswer.getByExamResult(result.id);

            ResponseHelper.success(res, { ...result, answers }, 'Exam result retrieved successfully');

        } catch (error) {
            console.error('Get student exam result error:', error);
            ResponseHelper.error(res, 'Failed to retrieve exam result', 500);
        }
    }

    // Chấm điểm thủ công
    static async gradeExam(req, res) {
        try {
            const { resultId } = req.params;
            const { score, grades } = req.body;

            // Kiểm tra quyền giáo viên
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            // Chấm điểm từng câu nếu có
            if (grades && grades.length > 0) {
                await ExamAnswer.gradeMultipleAnswers(grades);
            }
            
            // Cập nhật điểm tổng
            if (score !== undefined) {
                await ExamResult.gradeManually(resultId, score, req.user.id);
            } else {
                // Tính lại điểm tự động
                await ExamResult.calculateAutoScore(resultId);
            }

            const result = await ExamResult.getById(resultId);
            ResponseHelper.success(res, result, 'Exam graded successfully');

        } catch (error) {
            console.error('Grade exam error:', error);
            ResponseHelper.error(res, 'Failed to grade exam', 500);
        }
    }

    // Cập nhật kết quả thi (cho gradebook)
    static async updateExamResult(req, res) {
        try {
            const { resultId } = req.params;
            const { score, status } = req.body;

            // Kiểm tra quyền giáo viên
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            // Kiểm tra kết quả thi có tồn tại không
            const existingResult = await ExamResult.getById(resultId);
            if (!existingResult) {
                return ResponseHelper.error(res, 'Exam result not found', 404);
            }

            // Cập nhật điểm và trạng thái
            const updateData = {};
            if (score !== undefined) {
                updateData.score = parseFloat(score);
                updateData.graded_by = req.user.id;
                updateData.graded_at = new Date();
            }
            if (status !== undefined) {
                updateData.status = status;
            }

            // Nếu có điểm thì tự động chuyển sang graded
            if (score !== undefined) {
                updateData.status = 'graded';
            }

            await ExamResult.update(resultId, updateData);

            // Tự động tính lại điểm cho sinh viên
            await this.autoCalculateGradesAfterExamGrading(resultId);

            const updatedResult = await ExamResult.getById(resultId);
            ResponseHelper.success(res, updatedResult, 'Exam result updated successfully');

        } catch (error) {
            console.error('Update exam result error:', error);
            ResponseHelper.error(res, 'Failed to update exam result', 500);
        }
    }

    // Tự động tính lại điểm sau khi chấm bài kiểm tra
    static async autoCalculateGradesAfterExamGrading(examResultId) {
        try {
            const db = require('../config/database');
            
            // Lấy thông tin exam result và course section
            const [examResults] = await db.execute(`
                SELECT er.student_id, e.course_section_id
                FROM exam_results er
                JOIN exams e ON er.exam_id = e.id
                WHERE er.id = ?
            `, [examResultId]);

            if (examResults.length > 0) {
                const { student_id, course_section_id } = examResults[0];
                
                // Import và gọi hàm tính điểm
                const GradeConfigurationController = require('./GradeConfigurationController');
                await GradeConfigurationController.calculateStudentGrade(course_section_id, student_id);
                console.log('Auto calculate grades after exam grading completed for student:', student_id, 'in course section:', course_section_id);
            }
        } catch (error) {
            console.error('Auto calculate grades after exam grading error:', error);
            // Không throw error để không ảnh hưởng đến flow chính
        }
    }

    // Lấy bài thi của sinh viên
    static async getStudentExams(req, res) {
        try {
            const { courseSectionId } = req.params;
            const studentId = req.user.role === 'student' ? req.user.id : req.query.studentId;
            if (!studentId) {
                return ResponseHelper.error(res, 'Student ID is required', 400);
            }
            
            const exams = await Exam.getStudentExams(studentId, courseSectionId);
            
            // Thêm câu hỏi cho từng exam (không bao gồm đáp án)
            const examsWithQuestions = await Promise.all(
                exams.map(async (exam) => {
                    const questions = await ExamQuestion.getByExam(exam.id, false);
                    
                    // Tính điểm cho mỗi câu hỏi = max_score / số lượng câu hỏi
                    const pointsPerQuestion = questions.length > 0 ? exam.max_score / questions.length : 0;
                    const questionsWithPoints = questions.map(question => ({
                        ...question,
                        points: pointsPerQuestion
                    }));
                    
                    return {
                        ...exam,
                        questions: questionsWithPoints
                    };
                })
            );
            
            ResponseHelper.success(res, examsWithQuestions, 'Student exams retrieved successfully');

        } catch (error) {
            console.error('Get student exams error:', error);
            ResponseHelper.error(res, 'Failed to retrieve student exams', 500);
        }
    }

    // Lấy thống kê bài thi
    static async getExamStatistics(req, res) {
        try {
            const { examId } = req.params;

            // Kiểm tra quyền giáo viên
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            const stats = await ExamResult.getExamStatistics(examId);
            ResponseHelper.success(res, stats, 'Exam statistics retrieved successfully');

        } catch (error) {
            console.error('Get exam statistics error:', error);
            ResponseHelper.error(res, 'Failed to retrieve exam statistics', 500);
        }
    }

    // Kiểm tra thời gian làm bài
    static async checkTimeLimit(req, res) {
        try {
            const { resultId } = req.params;
            const { duration_minutes } = req.query;

            // Kiểm tra quyền sinh viên
            if (req.user.role !== 'student') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            const timeCheck = await ExamResult.checkTimeLimit(resultId, parseInt(duration_minutes));
            ResponseHelper.success(res, timeCheck, 'Time check completed');

        } catch (error) {
            console.error('Check time limit error:', error);
            ResponseHelper.error(res, 'Failed to check time limit', 500);
        }
    }

    // Lấy bài thi cần chấm điểm
    static async getUngraded(req, res) {
        try {
            const teacherId = req.user.id;

            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            const results = await ExamResult.getUngraded(teacherId);
            ResponseHelper.success(res, results, 'Ungraded exams retrieved successfully');

        } catch (error) {
            console.error('Get ungraded error:', error);
            ResponseHelper.error(res, 'Failed to retrieve ungraded exams', 500);
        }
    }

    // Thay thế tất cả câu hỏi của bài thi (dành cho Word import)
    static async replaceExamQuestions(req, res) {
        try {
            const { examId } = req.params;
            const { questions } = req.body;

            // Kiểm tra quyền
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Truy cập bị từ chối', 403);
            }

            // Kiểm tra bài thi có tồn tại không
            const exam = await Exam.getById(examId);
            if (!exam) {
                return ResponseHelper.error(res, 'Không tìm thấy bài thi', 404);
            }

            // Kiểm tra danh sách câu hỏi
            if (!questions || !Array.isArray(questions) || questions.length === 0) {
                return ResponseHelper.error(res, 'Danh sách câu hỏi không hợp lệ', 400);
            }

            // Validate từng câu hỏi
            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                if (!question.question_text || !question.question_text.trim()) {
                    return ResponseHelper.error(res, `Câu hỏi ${i + 1}: Nội dung câu hỏi không được trống`, 400);
                }
                if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
                    return ResponseHelper.error(res, `Câu hỏi ${i + 1}: Phải có ít nhất 2 đáp án`, 400);
                }
                if (!question.correct_answer || !question.correct_answer.trim()) {
                    return ResponseHelper.error(res, `Câu hỏi ${i + 1}: Chưa có đáp án đúng`, 400);
                }
            }

            // Thay thế câu hỏi
            const result = await ExamQuestion.replaceMultiple(examId, questions);

            // Cập nhật tổng điểm của bài thi (không cần tính từ questions vì sẽ chia đều)
            // Giữ nguyên max_score hiện tại hoặc sử dụng từ request
            const totalPoints = questions.length; // Mỗi câu 1 điểm base, sẽ chia theo max_score
            // await Exam.update(examId, { max_score: totalPoints }); // Comment out để giữ max_score gốc

            ResponseHelper.success(res, {
                examId: examId,
                questionsCount: questions.length,
                totalPoints: totalPoints,
                questionIds: result.questionIds
            }, `Đã thay thế thành công ${questions.length} câu hỏi cho bài thi`);

        } catch (error) {
            console.error('Replace exam questions error:', error);
            ResponseHelper.error(res, error.message || 'Không thể thay thế câu hỏi', 500);
        }
    }
}

module.exports = ExamController;