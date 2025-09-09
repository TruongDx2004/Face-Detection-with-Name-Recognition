const pool = require('../config/database');

class ExamQuestion {
    constructor(data) {
        this.id = data.id;
        this.exam_id = data.exam_id;
        this.question_text = data.question_text;
        this.question_type = data.question_type;
        this.points = data.points;
        this.question_order = data.question_order;
        this.correct_answer = data.correct_answer;
        this.options = data.options;
        this.created_at = data.created_at;
    }

    // Tạo câu hỏi mới
    static async create(questionData) {
        const {
            exam_id,
            question_text,
            question_type = 'multiple_choice',
            points = 1.00,
            question_order = 1,
            correct_answer,
            options
        } = questionData;

        const optionsJson = options ? JSON.stringify(options) : null;

        const [result] = await pool.execute(
            `INSERT INTO exam_questions 
            (exam_id, question_text, question_type, points, question_order, correct_answer, options) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [exam_id, question_text, question_type, points, question_order, correct_answer, optionsJson]
        );

        return result.insertId;
    }

    // Tạo nhiều câu hỏi cùng lúc
    static async createMultiple(examId, questions) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const questionIds = [];
            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                const optionsJson = question.options ? JSON.stringify(question.options) : null;
                
                const [result] = await connection.execute(
                    `INSERT INTO exam_questions 
                    (exam_id, question_text, question_type, points, question_order, correct_answer, options) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        examId,
                        question.question_text,
                        question.question_type || 'multiple_choice',
                        question.points || 1.00,
                        question.question_order || (i + 1),
                        question.correct_answer,
                        optionsJson
                    ]
                );
                questionIds.push(result.insertId);
            }

            await connection.commit();
            return questionIds;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Lấy câu hỏi theo ID
    static async getById(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM exam_questions WHERE id = ?',
            [id]
        );
        
        if (rows.length > 0) {
            const question = rows[0];
            if (question.options) {
                question.options = JSON.parse(question.options);
            }
            return new ExamQuestion(question);
        }
        return null;
    }

    // Lấy tất cả câu hỏi của một bài thi
    static async getByExam(examId, includeAnswers = true) {
        const [rows] = await pool.execute(
            'SELECT * FROM exam_questions WHERE exam_id = ? ORDER BY question_order ASC',
            [examId]
        );

        return rows.map(row => {
            if (row.options) {
                row.options = JSON.parse(row.options);
            }
            
            // Nếu không bao gồm đáp án (cho sinh viên làm bài)
            if (!includeAnswers) {
                delete row.correct_answer;
            }
            
            return new ExamQuestion(row);
        });
    }

    // Cập nhật câu hỏi
    static async update(id, updateData) {
        const fields = [];
        const values = [];

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                if (key === 'options') {
                    fields.push(`${key} = ?`);
                    values.push(JSON.stringify(updateData[key]));
                } else {
                    fields.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            }
        });

        if (fields.length === 0) return false;

        values.push(id);
        const [result] = await pool.execute(
            `UPDATE exam_questions SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    // Xóa câu hỏi
    static async delete(id) {
        const [result] = await pool.execute(
            'DELETE FROM exam_questions WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    // Xóa tất cả câu hỏi của một bài thi
    static async deleteByExam(examId) {
        const [result] = await pool.execute(
            'DELETE FROM exam_questions WHERE exam_id = ?',
            [examId]
        );
        return result.affectedRows;
    }

    // Sắp xếp lại thứ tự câu hỏi
    static async reorderQuestions(examId, questionOrders) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            for (const { questionId, order } of questionOrders) {
                await connection.execute(
                    'UPDATE exam_questions SET question_order = ? WHERE id = ? AND exam_id = ?',
                    [order, questionId, examId]
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

    // Lấy thống kê câu hỏi
    static async getQuestionStats(questionId) {
        const [rows] = await pool.execute(
            `SELECT 
                COUNT(ea.id) as total_answers,
                COUNT(CASE WHEN ea.is_correct = TRUE THEN 1 END) as correct_answers,
                AVG(ea.points_earned) as avg_points,
                eq.points as max_points
            FROM exam_questions eq
            LEFT JOIN exam_answers ea ON eq.id = ea.question_id
            WHERE eq.id = ?
            GROUP BY eq.id`,
            [questionId]
        );
        return rows[0] || null;
    }

    // Kiểm tra đáp án
    static checkAnswer(question, studentAnswer) {
        if (!question.correct_answer || !studentAnswer) {
            return { isCorrect: false, points: 0 };
        }

        let isCorrect = false;
        
        switch (question.question_type) {
            case 'multiple_choice':
            case 'true_false':
                isCorrect = studentAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
                break;
            case 'short_answer':
                // So sánh không phân biệt hoa thường và khoảng trắng
                isCorrect = studentAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
                break;
            case 'essay':
                // Câu tự luận cần chấm thủ công
                isCorrect = null;
                break;
        }

        const points = isCorrect === true ? question.points : 0;
        return { isCorrect, points };
    }
}

module.exports = ExamQuestion;