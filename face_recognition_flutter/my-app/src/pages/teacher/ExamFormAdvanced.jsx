import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import { AppLayout, Header } from '../../components/layout/AppLayout';
import WordQuestionImporter from '../../components/WordQuestionImporter';
import AdvancedRichTextEditor from '../../components/AdvancedRichTextEditor';
import QuestionEditor from '../../components/QuestionEditor';

// Styles
const styles = {
    section: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    formGroup: {
        marginBottom: '20px'
    },
    formLabel: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '8px'
    },
    required: {
        color: '#ef4444'
    },
    formInput: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box'
    },
    formSelect: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        backgroundColor: '#ffffff',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box'
    },
    formRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
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
    buttonSuccess: {
        backgroundColor: '#10b981',
        color: '#ffffff'
    },
    buttonDanger: {
        backgroundColor: '#ef4444',
        color: '#ffffff'
    },
    actionButtons: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        paddingTop: '20px',
        borderTop: '1px solid #e2e8f0'
    },
    errorText: {
        color: '#ef4444',
        fontSize: '12px',
        marginTop: '4px'
    },
    successText: {
        color: '#10b981',
        fontSize: '12px',
        marginTop: '4px'
    },
    infoCard: {
        backgroundColor: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
    },
    infoCardTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#0369a1',
        marginBottom: '8px'
    },
    infoCardText: {
        fontSize: '13px',
        color: '#0369a1',
        lineHeight: '1.5'
    },
    statsContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
    },
    statCard: {
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        textAlign: 'center'
    },
    statValue: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: '4px'
    },
    statLabel: {
        fontSize: '12px',
        color: '#64748b',
        fontWeight: '500'
    }
};

const ExamFormAdvanced = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { notifications, showNotification, removeNotification } = useNotification();
    const isEdit = Boolean(id);
    
    // Check if we're creating from template
    const fromTemplate = location.state?.fromTemplate;

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
                await fetchCourseSections(user.data.id);
            } catch (error) {
                console.error('Error fetching user profile:', error);
                showNotification('Không thể tải thông tin người dùng', 'error');
            }
        };
        
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        fetchUserAndSections();
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (isEdit) {
            fetchExam();
        } else if (fromTemplate) {
            loadFromTemplate();
        }
    }, [id, fromTemplate]);

    const fetchCourseSections = async (teacherId) => {
        try {
            const response = await ApiService.getCourseSectionsByTeacher(teacherId);
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

    const loadFromTemplate = () => {
        try {
            const template = fromTemplate;
            
            const convertedQuestions = template.questions.map((q, index) => ({
                id: Date.now() + index,
                question_text: q.questionText,
                question_type: q.questionType,
                points: q.points,
                question_order: index + 1,
                correct_answer: q.correctAnswer,
                options: q.options || ['', '', '', ''],
                explanation: q.explanation || ''
            }));

            setFormData(prev => ({
                ...prev,
                title: template.title,
                description: template.description || '',
                duration_minutes: template.duration_minutes,
                max_score: template.total_points,
                course_section_id: '',
                exam_type: 'quiz',
                exam_date: '',
                start_time: '',
                end_time: '',
                instructions: ''
            }));

            setQuestions(convertedQuestions);
            showNotification(`Đã tải template "${template.title}" thành công`, 'success');
        } catch (error) {
            console.error('Error loading template:', error);
            showNotification('Lỗi khi tải template', 'error');
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

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
            options: ['', '', '', ''],
            explanation: ''
        };
        setQuestions([...questions, newQuestion]);
    };

    const updateQuestion = (index, field, value) => {
        setQuestions(prev => prev.map((q, i) =>
            i === index ? { ...q, [field]: value } : q
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

    const calculateTotalPoints = () => {
        return questions.reduce((total, q) => total + parseFloat(q.points || 0), 0);
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

        if (questions.length === 0) {
            newErrors.questions = 'Phải có ít nhất 1 câu hỏi';
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
                max_score: calculateTotalPoints(),
                questions: questions.map(q => ({
                    question_text: q.question_text,
                    question_type: q.question_type,
                    points: q.points,
                    question_order: q.question_order,
                    correct_answer: q.correct_answer,
                    options: q.question_type === 'multiple_choice' ? q.options : null,
                    explanation: q.explanation
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

    const handleLogout = () => {
        authService.logout();
        navigate('/');
    };

    return (
        <AppLayout
            user={currentUser}
            onLogout={handleLogout}
            currentTime={currentTime}
            title={isEdit ? 'Chỉnh sửa bài kiểm tra' : fromTemplate ? `Tạo bài thi từ template: ${fromTemplate.title}` : 'Tạo bài kiểm tra mới'}
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
                {/* Template Info Banner */}
                {fromTemplate && (
                    <div style={styles.infoCard}>
                        <div style={styles.infoCardTitle}>
                            📚 Tạo bài thi từ template: {fromTemplate.title}
                        </div>
                        <div style={styles.infoCardText}>
                            Template đã được tải với {fromTemplate.questions?.length || 0} câu hỏi. 
                            Bạn có thể chỉnh sửa và thêm thông tin cần thiết.
                        </div>
                    </div>
                )}

                {/* Statistics */}
                <div style={styles.statsContainer}>
                    <div style={styles.statCard}>
                        <div style={styles.statValue}>{questions.length}</div>
                        <div style={styles.statLabel}>Số câu hỏi</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statValue}>{calculateTotalPoints()}</div>
                        <div style={styles.statLabel}>Tổng điểm</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statValue}>{formData.duration_minutes}</div>
                        <div style={styles.statLabel}>Phút làm bài</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statValue}>
                            {questions.filter(q => q.question_type === 'multiple_choice').length}
                        </div>
                        <div style={styles.statLabel}>Trắc nghiệm</div>
                    </div>
                </div>

                {/* Basic Information */}
                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <div style={styles.sectionTitle}>
                            📋 Thông tin cơ bản
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>
                            Lớp học phần <span style={styles.required}>*</span>
                        </label>
                        <select
                            style={styles.formSelect}
                            value={formData.course_section_id}
                            onChange={(e) => handleInputChange('course_section_id', e.target.value)}
                        >
                            <option value="">Chọn lớp học phần</option>
                            {courseSections.map(cs => (
                                <option key={cs.id} value={cs.id}>
                                    {cs.class_name} - {cs.subject_name}
                                </option>
                            ))}
                        </select>
                        {errors.course_section_id && <div style={styles.errorText}>{errors.course_section_id}</div>}
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>
                            Tiêu đề <span style={styles.required}>*</span>
                        </label>
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
                        <AdvancedRichTextEditor
                            value={formData.description}
                            onChange={(value) => handleInputChange('description', value)}
                            placeholder="Mô tả về bài kiểm tra - Sử dụng toolbar để định dạng văn bản và chèn công thức"
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
                    </div>

                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>
                                Ngày thi <span style={styles.required}>*</span>
                            </label>
                            <input
                                type="date"
                                style={styles.formInput}
                                value={formData.exam_date}
                                onChange={(e) => handleInputChange('exam_date', e.target.value)}
                            />
                            {errors.exam_date && <div style={styles.errorText}>{errors.exam_date}</div>}
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>
                                Giờ bắt đầu <span style={styles.required}>*</span>
                            </label>
                            <input
                                type="time"
                                style={styles.formInput}
                                value={formData.start_time}
                                onChange={(e) => handleInputChange('start_time', e.target.value)}
                            />
                            {errors.start_time && <div style={styles.errorText}>{errors.start_time}</div>}
                        </div>
                    </div>

                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>
                                Giờ kết thúc <span style={styles.required}>*</span>
                            </label>
                            <input
                                type="time"
                                style={styles.formInput}
                                value={formData.end_time}
                                onChange={(e) => handleInputChange('end_time', e.target.value)}
                            />
                            {errors.end_time && <div style={styles.errorText}>{errors.end_time}</div>}
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Tổng điểm (tự động tính)</label>
                            <input
                                type="number"
                                style={{ ...styles.formInput, backgroundColor: '#f9fafb' }}
                                value={calculateTotalPoints()}
                                readOnly
                            />
                            <div style={styles.successText}>
                                Tính từ tổng điểm các câu hỏi
                            </div>
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Hướng dẫn</label>
                        <AdvancedRichTextEditor
                            value={formData.instructions}
                            onChange={(value) => handleInputChange('instructions', value)}
                            placeholder="Hướng dẫn làm bài cho học sinh - Sử dụng toolbar để định dạng văn bản"
                            height="120px"
                        />
                    </div>
                </div>

                {/* Questions Section */}
                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <div style={styles.sectionTitle}>
                            ❓ Câu hỏi ({questions.length})
                        </div>
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

                    {errors.questions && <div style={styles.errorText}>{errors.questions}</div>}

                    {showImporter && (
                        <WordQuestionImporter
                            onQuestionsImported={handleQuestionsImported}
                            onClose={() => setShowImporter(false)}
                        />
                    )}

                    {questions.map((question, index) => (
                        <QuestionEditor
                            key={question.id || index}
                            question={question}
                            questionIndex={index}
                            onQuestionUpdate={updateQuestion}
                            onDeleteQuestion={removeQuestion}
                            canDelete={questions.length > 1}
                        />
                    ))}

                    {questions.length === 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: '#64748b',
                            fontStyle: 'italic'
                        }}>
                            Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div style={styles.section}>
                    <div style={styles.actionButtons}>
                        <button
                            type="button"
                            style={{ ...styles.button, ...styles.buttonSecondary }}
                            onClick={() => navigate('/teacher/exams')}
                        >
                            ❌ Hủy
                        </button>
                        <button
                            type="submit"
                            style={{ ...styles.button, ...styles.buttonPrimary }}
                            disabled={loading}
                        >
                            {loading ? '⏳ Đang lưu...' : (isEdit ? '💾 Cập nhật' : '✅ Tạo bài kiểm tra')}
                        </button>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
};

export default ExamFormAdvanced;