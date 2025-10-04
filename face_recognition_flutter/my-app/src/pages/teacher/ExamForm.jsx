import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import { AppLayout, Header } from '../../components/layout/AppLayout';
import WordQuestionImporter from '../../components/WordQuestionImporter';
import RichTextEditor from '../../components/RichTextEditor';
import RichTextInput from '../../components/RichTextInput';

// Styles
const styles = {
    section: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0'
    },
    formGroup: {
        marginBottom: '20px'
    },
    formLabel: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '6px'
    },
    formInput: {
        width: '95%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        transition: 'all 0.2s ease'
    },
    formTextarea: {
        width: '98%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        minHeight: '100px',
        resize: 'vertical',
        transition: 'all 0.2s ease'
    },
    formSelect: {
        width: '98%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        backgroundColor: '#ffffff',
        transition: 'all 0.2s ease'
    },
    button: {
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px'
    },
    buttonPrimary: {
        backgroundColor: '#3b82f6',
        color: '#ffffff'
    },
    buttonSecondary: {
        backgroundColor: '#f1f5f9',
        color: '#374151',
        border: '1px solid #e2e8f0'
    },
    buttonDanger: {
        backgroundColor: '#a53030ff',
        color: '#ffffff'
    },
    buttonSuccess: {
        backgroundColor: '#10b981',
        color: '#ffffff'
    },
    formRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px'
    },
    questionCard: {
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
    },
    questionHeader: {
        display: 'flex',
        justifyContent: 'between',
        alignItems: 'center',
        marginBottom: '12px'
    },
    questionNumber: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151'
    },
    optionInput: {
        width: '98%',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        marginBottom: '8px'
    },
    correctOption: {
        backgroundColor: '#dcfce7',
        border: '1px solid #16a34a'
    },
    fileUpload: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        border: '2px dashed #d1d5db',
        borderRadius: '8px',
        backgroundColor: '#f9fafb'
    },
    fileInput: {
        display: 'none'
    },
    errorText: {
        color: '#ef4444',
        fontSize: '12px',
        marginTop: '4px'
    }
};

const ExamForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { notifications, showNotification, removeNotification } = useNotification();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState({
        course_section_id: '',
        title: '',
        description: '',
        exam_type: 'quiz',
        max_score: 10,
        duration_minutes: 60,
        exam_date: '',
        start_time: '',
        end_time: '',
        instructions: ''
    });

    const [questions, setQuestions] = useState([]);
    const [courseSections, setCourseSections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [errors, setErrors] = useState({});
    const [showImporter, setShowImporter] = useState(false);

    useEffect(() => {
        const fetchUserAndSections = async () => {
            try {
                const user = await ApiService.getProfile();
                setCurrentUser(user.data);

                // Gọi tiếp courseSections
                await fetchCourseSections(user.data.id);
            } catch (error) {
                console.error('Error fetching user profile:', error);
                showNotification('Không thể tải thông tin người dùng', 'error');
            }
        };
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);

        fetchUserAndSections();
        return () => clearInterval(timer);
    }, []); // chỉ chạy 1 lần khi component mount

    useEffect(() => {
        if (isEdit) {
            fetchExam();
        }
    }, [id]);

    const fetchCourseSections = async (teacherId) => {
        try {
            const response = await ApiService.getCourseSectionsByTeacher(teacherId);
            console.log('Course Sections:', response.data);
            setCourseSections(response.data.courseSections || []);
        } catch (error) {
            console.error('Error fetching course sections:', error);
            showNotification('Không thể tải danh sách lớp học phần', 'error');
        }
    };

    const fetchExam = async () => {
        try {
            const response = await ApiService.getExam(id);
            const exam = response.data;

            setFormData({
                course_section_id: exam.course_section_id,
                title: exam.title,
                description: exam.description || '',
                exam_type: exam.exam_type,
                max_score: exam.max_score,
                duration_minutes: exam.duration_minutes,
                exam_date: exam.exam_date,
                start_time: exam.start_time,
                end_time: exam.end_time,
                instructions: exam.instructions || ''
            });

            setQuestions(exam.questions || []);
        } catch (error) {
            console.error('Error fetching exam:', error);
            showNotification('Không thể tải thông tin bài kiểm tra', 'error');
            navigate('/teacher/exams');
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const addQuestion = () => {
        const newQuestion = {
            id: Date.now(),
            question_text: '',
            question_type: 'multiple_choice',
            points: 1,
            question_order: questions.length + 1,
            correct_answer: '',
            options: ['', '', '', '']
        };
        setQuestions([...questions, newQuestion]);
    };

    const updateQuestion = (index, field, value) => {
        setQuestions(prev => prev.map((q, i) =>
            i === index ? { ...q, [field]: value } : q
        ));
    };

    const updateQuestionOption = (questionIndex, optionIndex, value) => {
        setQuestions(prev => prev.map((q, i) =>
            i === questionIndex ? {
                ...q,
                options: q.options.map((opt, oi) => oi === optionIndex ? value : opt)
            } : q
        ));
    };

    const setCorrectAnswer = (questionIndex, optionIndex) => {
        setQuestions(prev => prev.map((q, i) =>
            i === questionIndex ? { ...q, correct_answer: q.options[optionIndex] } : q
        ));
    };

    const removeQuestion = (index) => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    };

    const handleQuestionsImported = (importedQuestions) => {
        const questionsWithOrder = importedQuestions.map((q, index) => ({
            ...q,
            question_order: questions.length + index + 1
        }));
        setQuestions(prev => [...prev, ...questionsWithOrder]);
        setShowImporter(false);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };
    
    const validateForm = () => {
        const newErrors = {};

        if (!formData.course_section_id) newErrors.course_section_id = 'Vui lòng chọn lớp học phần';
        if (!formData.title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề';
        if (!formData.exam_date) newErrors.exam_date = 'Vui lòng chọn ngày thi';
        if (!formData.start_time) newErrors.start_time = 'Vui lòng nhập giờ bắt đầu';
        if (!formData.end_time) newErrors.end_time = 'Vui lòng nhập giờ kết thúc';

        if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
            newErrors.end_time = 'Giờ kết thúc phải sau giờ bắt đầu';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showNotification('Vui lòng kiểm tra lại thông tin', 'error');
            return;
        }

        setLoading(true);
        try {
            const examData = {
                ...formData,
                questions: questions.map(q => ({
                    question_text: q.question_text,
                    question_type: q.question_type,
                    points: q.points,
                    question_order: q.question_order,
                    correct_answer: q.correct_answer,
                    options: q.question_type === 'multiple_choice' ? q.options : null
                }))
            };

            if (isEdit) {
                await ApiService.updateExam(id, examData);
                showNotification('Cập nhật bài kiểm tra thành công', 'success');
            } else {
                await ApiService.createExam(examData);
                showNotification('Tạo bài kiểm tra thành công', 'success');
            }

            navigate('/teacher/exams');
        } catch (error) {
            console.error('Error saving exam:', error);
            showNotification('Không thể lưu bài kiểm tra', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (

        <AppLayout
            user={currentUser}
            onLogout={handleLogout}
            currentTime={currentTime}
            title={isEdit ? 'Chỉnh sửa bài kiểm tra' : 'Tạo bài kiểm tra mới'}
        >

            {/* Notifications */}
            <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000 }}>
                {notifications.map((notification) => (
                    <Notification
                        key={notification.id}
                        notification={notification}
                        onRemove={removeNotification}
                    />
                ))}
            </div>

            <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div style={styles.section}>
                    <h3>Thông tin cơ bản</h3>

                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Lớp học phần *</label>
                        <select
                            style={styles.formSelect}
                            value={formData.course_section_id}
                            onChange={(e) => handleInputChange('course_section_id', e.target.value)}
                        >
                            <option value="">Chọn lớp học phần</option>
                            {courseSections.map(cs => (
                                <option key={cs.id} value={cs.id}>
                                    {cs.name} - {cs.subject_name}
                                </option>
                            ))}
                        </select>
                        {errors.course_section_id && <div style={styles.errorText}>{errors.course_section_id}</div>}
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Tiêu đề *</label>
                        <input
                            type="text"
                            style={styles.formInput}
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="Nhập tiêu đề bài kiểm tra"
                        />
                        {errors.title && <div style={styles.errorText}>{errors.title}</div>}
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Mô tả</label>
                        <RichTextEditor
                            value={formData.description}
                            onChange={(value) => handleInputChange('description', value)}
                            placeholder="Mô tả về bài kiểm tra - Sử dụng toolbar để định dạng văn bản"
                            height="100px"
                        />
                    </div>

                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Loại bài kiểm tra</label>
                            <select
                                style={styles.formSelect}
                                value={formData.exam_type}
                                onChange={(e) => handleInputChange('exam_type', e.target.value)}
                            >
                                <option value="quiz">Kiểm tra</option>
                                <option value="midterm">Giữa kỳ</option>
                                <option value="final">Cuối kỳ</option>
                                <option value="practical">Thực hành</option>
                            </select>
                        </div>

                        {/* <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Điểm tối đa</label>
                            <input
                                type="number"
                                style={styles.formInput}
                                value={formData.max_score}
                                onChange={(e) => handleInputChange('max_score', parseFloat(e.target.value))}
                                min="0"
                                step="0.1"
                            />
                        </div> */}
                    </div>

                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Thời gian làm bài (phút)</label>
                            <input
                                type="number"
                                style={styles.formInput}
                                value={formData.duration_minutes}
                                onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value))}
                                min="1"
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Ngày thi *</label>
                            <input
                                type="date"
                                style={styles.formInput}
                                value={formData.exam_date}
                                onChange={(e) => handleInputChange('exam_date', e.target.value)}
                            />
                            {errors.exam_date && <div style={styles.errorText}>{errors.exam_date}</div>}
                        </div>
                    </div>

                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Giờ bắt đầu *</label>
                            <input
                                type="time"
                                style={styles.formInput}
                                value={formData.start_time}
                                onChange={(e) => handleInputChange('start_time', e.target.value)}
                            />
                            {errors.start_time && <div style={styles.errorText}>{errors.start_time}</div>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Giờ kết thúc *</label>
                            <input
                                type="time"
                                style={styles.formInput}
                                value={formData.end_time}
                                onChange={(e) => handleInputChange('end_time', e.target.value)}
                            />
                            {errors.end_time && <div style={styles.errorText}>{errors.end_time}</div>}
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Hướng dẫn</label>
                        <RichTextEditor
                            value={formData.instructions}
                            onChange={(value) => handleInputChange('instructions', value)}
                            placeholder="Hướng dẫn làm bài cho học sinh - Sử dụng toolbar để định dạng văn bản"
                            height="120px"
                        />
                    </div>
                </div>

                {/* Questions Section */}
                <div style={styles.section}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>Câu hỏi ({questions.length})</h3>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                style={{ ...styles.button, ...styles.buttonSecondary }}
                                onClick={() => setShowImporter(true)}
                            >
                                📄 Import từ Word
                            </button>
                            <button
                                type="button"
                                style={{ ...styles.button, ...styles.buttonSuccess }}
                                onClick={addQuestion}
                            >
                                ➕ Thêm câu hỏi
                            </button>
                        </div>
                    </div>

                    {showImporter && (
                        <WordQuestionImporter
                            onQuestionsImported={handleQuestionsImported}
                            onClose={() => setShowImporter(false)}
                        />
                    )}

                    {questions.map((question, index) => (
                        <div key={question.id} style={styles.questionCard}>
                            <div style={styles.questionHeader}>
                                <span style={styles.questionNumber}>Câu hỏi {index + 1}</span>
                                <button
                                    type="button"
                                    style={{ ...styles.button, ...styles.buttonDanger, fontSize: '12px', padding: '6px 12px', marginLeft: 'auto' }}
                                    onClick={() => removeQuestion(index)}
                                >
                                    🗑️ Xóa
                                </button>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>Nội dung câu hỏi</label>
                                <RichTextEditor
                                    value={question.question_text}
                                    onChange={(value) => updateQuestion(index, 'question_text', value)}
                                    placeholder="Nhập nội dung câu hỏi - Sử dụng toolbar để định dạng văn bản và chèn công thức hóa học"
                                    height="120px"
                                />
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Loại câu hỏi</label>
                                    <select
                                        style={styles.formSelect}
                                        value={question.question_type}
                                        onChange={(e) => updateQuestion(index, 'question_type', e.target.value)}
                                    >
                                        <option value="multiple_choice">Trắc nghiệm</option>
                                        <option value="true_false">Đúng/Sai</option>
                                        <option value="short_answer">Trả lời ngắn</option>
                                        <option value="essay">Tự luận</option>
                                    </select>
                                </div>

                                {/* <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Điểm</label>
                                    <input
                                        type="number"
                                        style={styles.formInput}
                                        value={question.points}
                                        onChange={(e) => updateQuestion(index, 'points', parseFloat(e.target.value))}
                                        min="0"
                                        step="0.1"
                                    />
                                </div> */}
                            </div>

                            {question.question_type === 'multiple_choice' && (
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Các đáp án (click để chọn đáp án đúng)</label>
                                    {question.options.map((option, optionIndex) => (
                                        <div key={optionIndex} style={{ marginBottom: '8px' }}>
                                            <RichTextInput
                                                value={option}
                                                onChange={(value) => updateQuestionOption(index, optionIndex, value)}
                                                onClick={() => setCorrectAnswer(index, optionIndex)}
                                                placeholder={`Đáp án ${String.fromCharCode(65 + optionIndex)} - Sử dụng toolbar để định dạng`}
                                                style={{
                                                    ...(question.correct_answer === option ? {
                                                        backgroundColor: '#dcfce7',
                                                        border: '2px solid #16a34a'
                                                    } : {})
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {(question.question_type === 'true_false' || question.question_type === 'short_answer') && (
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Đáp án đúng</label>
                                    <RichTextInput
                                        value={question.correct_answer}
                                        onChange={(value) => updateQuestion(index, 'correct_answer', value)}
                                        placeholder="Nhập đáp án đúng - Sử dụng toolbar để định dạng"
                                        style={{ backgroundColor: '#dcfce7', border: '1px solid #16a34a' }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div style={styles.section}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            style={{ ...styles.button, ...styles.buttonSecondary }}
                            onClick={() => navigate('/teacher/exams')}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            style={{ ...styles.button, ...styles.buttonPrimary }}
                            disabled={loading}
                        >
                            {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo bài kiểm tra')}
                        </button>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
};

export default ExamForm;