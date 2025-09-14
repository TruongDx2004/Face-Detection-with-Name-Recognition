const pool = require('../config/database');
const ExamQuestion = require('./ExamQuestion');

class ExamAnswer {
    constructor(data) {
        this.id = data.id;
        this.exam_result_id = data.exam_result_id;
        this.question_id = data.question_id;
        this.student_answer = data.student_answer;
        this.is_correct = data.is_correct;
        this.points_earned = data.points_earned;
        this.answered_at = data.answered_at;
    }

    // Lưu câu trả lời
    static async saveAnswer(answerData) {
        const {
            exam_result_id,
            question_id,
            student_answer
        } = answerData;

        // Lấy thông tin câu hỏi để kiểm tra đáp án
        const question = await ExamQuestion.getById(question_id);
        if (!question) {
            throw new Error('Question not found');
        }

        // Kiểm tra đáp án
        const { isCorrect, points } = ExamQuestion.checkAnswer(question, student_answer);

        const [result] = await pool.execute(
            `INSERT INTO exam_answers 
            (exam_result_id, question_id, student_answer, is_correct, points_earned) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            student_answer = VALUES(student_answer),
            is_correct = VALUES(is_correct),
            points_earned = VALUES(points_earned),
            answered_at = CURRENT_TIMESTAMP`,
            [exam_result_id, question_id, student_answer, isCorrect, points]
        );

        return result.insertId || result.affectedRows > 0;
    }

    // Lưu nhiều câu trả lời cùng lúc
    static async saveMultipleAnswers(examResultId, answers) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            for (const answer of answers) {
                const question = await ExamQuestion.getById(answer.question_id);
                if (question) {
                    const { isCorrect, points } = ExamQuestion.checkAnswer(question, answer.student_answer);

                    await connection.execute(
                        `INSERT INTO exam_answers 
                        (exam_result_id, question_id, student_answer, is_correct, points_earned) 
                        VALUES (?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                        student_answer = VALUES(student_answer),
                        is_correct = VALUES(is_correct),
                        points_earned = VALUES(points_earned),
                        answered_at = CURRENT_TIMESTAMP`,
                        [examResultId, answer.question_id, answer.student_answer, isCorrect, points]
                    );
                }
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Lấy câu trả lời theo ID
    static async getById(id) {
        const [rows] = await pool.execute(
            `SELECT ea.*, 
                    eq.question_text,
                    eq.question_type,
                    eq.points as max_points,
                    eq.correct_answer
            FROM exam_answers ea
            JOIN exam_questions eq ON ea.question_id = eq.id
            WHERE ea.id = ?`,
            [id]
        );
        return rows.length > 0 ? new ExamAnswer(rows[0]) : null;
    }

    // Lấy tất cả câu trả lời của một bài làm
    static async getByExamResult(examResultId) {
        const [rows] = await pool.execute(
            `SELECT ea.*, 
                    eq.question_text,
                    eq.question_type,
                    eq.points as max_points,
                    eq.correct_answer,
                    eq.options,
                    eq.question_order
            FROM exam_answers ea
            JOIN exam_questions eq ON ea.question_id = eq.id
            WHERE ea.exam_result_id = ?
            ORDER BY eq.question_order ASC`,
            [examResultId]
        );

        return rows.map(row => {
            if (row.options) {
                try {
                    const trimmed = row.options.trim();
                    // chỉ parse nếu bắt đầu bằng [ hoặc {
                    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                        row.options = JSON.parse(row.options);
                    }
                } catch (e) {
                    // Nếu parse thất bại, giữ nguyên string
                    row.options = row.options;
                }
            }
            return new ExamAnswer(row);
        });
    }

    // Lấy câu trả lời cụ thể
    static async getAnswer(examResultId, questionId) {
        const [rows] = await pool.execute(
            `SELECT ea.*, 
                    eq.question_text,
                    eq.question_type,
                    eq.points as max_points
            FROM exam_answers ea
            JOIN exam_questions eq ON ea.question_id = eq.id
            WHERE ea.exam_result_id = ? AND ea.question_id = ?`,
            [examResultId, questionId]
        );
        return rows.length > 0 ? new ExamAnswer(rows[0]) : null;
    }

    // Chấm điểm thủ công cho câu tự luận
    static async gradeEssayAnswer(answerId, isCorrect, pointsEarned) {
        const [result] = await pool.execute(
            `UPDATE exam_answers 
            SET is_correct = ?, points_earned = ?
            WHERE id = ?`,
            [isCorrect, pointsEarned, answerId]
        );
        return result.affectedRows > 0;
    }

    // Chấm điểm thủ công cho nhiều câu
    static async gradeMultipleAnswers(grades) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            for (const grade of grades) {
                await connection.execute(
                    `UPDATE exam_answers 
                    SET is_correct = ?, points_earned = ?
                    WHERE id = ?`,
                    [grade.is_correct, grade.points_earned, grade.answer_id]
                );
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Lấy câu trả lời cần chấm thủ công
    static async getUngraded(teacherId) {
        const [rows] = await pool.execute(
            `SELECT ea.*, 
                    eq.question_text,
                    eq.question_type,
                    eq.points as max_points,
                    e.title as exam_title,
                    u.full_name as student_name,
                    cs.name as course_name
            FROM exam_answers ea
            JOIN exam_questions eq ON ea.question_id = eq.id
            JOIN exam_results er ON ea.exam_result_id = er.id
            JOIN exams e ON er.exam_id = e.id
            JOIN course_sections cs ON e.course_section_id = cs.id
            JOIN users u ON er.student_id = u.id
            WHERE cs.teacher_id = ? 
            AND eq.question_type = 'essay' 
            AND ea.is_correct IS NULL
            ORDER BY er.submitted_at ASC`,
            [teacherId]
        );
        return rows.map(row => new ExamAnswer(row));
    }

    // Thống kê câu trả lời
    static async getAnswerStatistics(questionId) {
        const [rows] = await pool.execute(
            `SELECT 
                student_answer,
                COUNT(*) as answer_count,
                COUNT(CASE WHEN is_correct = TRUE THEN 1 END) as correct_count,
                AVG(points_earned) as avg_points
            FROM exam_answers
            WHERE question_id = ?
            GROUP BY student_answer
            ORDER BY answer_count DESC`,
            [questionId]
        );
        return rows;
    }

    // Xóa câu trả lời
    static async delete(id) {
        const [result] = await pool.execute(
            'DELETE FROM exam_answers WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    // Xóa tất cả câu trả lời của một bài làm
    static async deleteByExamResult(examResultId) {
        const [result] = await pool.execute(
            'DELETE FROM exam_answers WHERE exam_result_id = ?',
            [examResultId]
        );
        return result.affectedRows;
    }

    // Kiểm tra xem đã trả lời hết chưa
    static async checkCompleteness(examResultId) {
        const [rows] = await pool.execute(
            `SELECT 
                COUNT(eq.id) as total_questions,
                COUNT(ea.id) as answered_questions
            FROM exam_results er
            JOIN exams e ON er.exam_id = e.id
            JOIN exam_questions eq ON e.id = eq.exam_id
            LEFT JOIN exam_answers ea ON eq.id = ea.question_id AND ea.exam_result_id = er.id
            WHERE er.id = ?`,
            [examResultId]
        );

        const result = rows[0];
        return {
            totalQuestions: result.total_questions,
            answeredQuestions: result.answered_questions,
            isComplete: result.total_questions === result.answered_questions,
            completionRate: result.total_questions > 0 ? (result.answered_questions / result.total_questions) * 100 : 0
        };
    }
}

module.exports = ExamAnswer;