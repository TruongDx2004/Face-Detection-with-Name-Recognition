import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import { AppLayout, Header } from '../../components/layout/AppLayout';
import RichTextEditor from '../../components/RichTextEditor';
import AdvancedRichTextEditor from '../../components/AdvancedRichTextEditor';

// Styles
const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px'
    },
    section: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1a202c',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    formGroup: {
        marginBottom: '20px'
    },
    label: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '8px'
    },
    required: {
        color: '#ef4444'
    },
    input: {
        width: '100%',
        padding: '12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        transition: 'border-color 0.2s ease',
        boxSizing: 'border-box'
    },
    textarea: {
        width: '100%',
        padding: '12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        minHeight: '120px',
        resize: 'vertical',
        transition: 'border-color 0.2s ease',
        boxSizing: 'border-box'
    },
    select: {
        width: '100%',
        padding: '12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        backgroundColor: '#ffffff',
        transition: 'border-color 0.2s ease',
        boxSizing: 'border-box'
    },
    checkbox: {
        marginRight: '8px'
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '14px',
        color: '#374151',
        cursor: 'pointer'
    },
    tagsContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '8px'
    },
    tag: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        padding: '6px 10px',
        backgroundColor: '#f1f5f9',
        color: '#475569',
        borderRadius: '6px',
        border: '1px solid #e2e8f0'
    },
    tagRemove: {
        cursor: 'pointer',
        color: '#ef4444',
        fontSize: '14px'
    },
    tagInput: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        marginRight: '8px',
        minWidth: '120px'
    },
    button: {
        padding: '12px 24px',
        borderRadius: '6px',
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
        backgroundColor: '#ef4444',
        color: '#ffffff'
    },
    buttonSmall: {
        padding: '8px 12px',
        fontSize: '12px'
    },
    actionBar: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        paddingTop: '20px',
        borderTop: '1px solid #e2e8f0'
    },
    helpText: {
        fontSize: '12px',
        color: '#64748b',
        marginTop: '4px'
    },
    errorText: {
        fontSize: '12px',
        color: '#ef4444',
        marginTop: '4px'
    },
    questionTabs: {
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap'
    },
    questionTab: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    questionTabActive: {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        border: '1px solid #3b82f6'
    },
    questionTabInactive: {
        backgroundColor: '#f9fafb',
        color: '#374151'
    },
    optionInput: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px'
    },
    radioOption: {
        marginRight: '8px'
    }
};

const ExamTemplateForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { notifications, showNotification, removeNotification } = useNotification();
    const isEdit = Boolean(id);

    // State management
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [allTags, setAllTags] = useState([]);

    // Form data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject_id: '',
        difficulty_level: 'medium',
        duration_minutes: 60,
        total_points: 100,
        questions: [],
        tags: [],
        is_public: false
    });

    // UI state
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        loadCurrentUser();
        loadInitialData();
        if (isEdit) {
            loadTemplate();
        } else {
            // Add first question for new template
            addQuestion();
        }
    }, [id]);

    const loadCurrentUser = async () => {
        try {
            const user = await ApiService.getProfile();
            setCurrentUser(user.data);
        } catch (error) {
            console.error('Error loading user:', error);
            navigate('/');
        }
    };

    const loadInitialData = async () => {
        try {
            const [subjectsRes, tagsRes] = await Promise.all([
                ApiService.getSubjects(),
                ApiService.getExamTemplateTags()
            ]);
            console.log("Su", subjectsRes);
            setSubjects(subjectsRes.data.subjects || []);
            setAllTags(tagsRes.data || []);
        } catch (error) {
            console.error('Error loading initial data:', error);
            showNotification('Lỗi khi tải dữ liệu', 'error');
        }
    };

    const loadTemplate = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getExamTemplateById();
            const template = response.data;
            
            // Cập nhật điểm cho các câu hỏi hiện có theo logic mới
            const questionsWithUpdatedPoints = template.questions && template.questions.length > 0 
                ? updateAllQuestionPoints(template.questions) 
                : [];
            
            setFormData({
                title: template.title,
                description: template.description || '',
                subject_id: template.subject_id,
                difficulty_level: template.difficulty_level,
                duration_minutes: template.duration_minutes,
                total_points: template.total_points,
                questions: questionsWithUpdatedPoints,
                tags: template.tags || [],
                is_public: template.is_public
            });
        } catch (error) {
            console.error('Error loading template:', error);
            showNotification('Lỗi khi tải template', 'error');
            navigate('/teacher/exam-templates');
        } finally {
            setLoading(false);
        }
    };

    const generateQuestionId = () => {
        return Date.now() + Math.random();
    };

    // Hàm tính điểm tự động cho mỗi câu hỏi
    const calculateQuestionPoints = (totalQuestions) => {
        return totalQuestions > 0 ? parseFloat((10 / totalQuestions).toFixed(2)) : 10;
    };

    // Hàm cập nhật điểm cho tất cả câu hỏi
    const updateAllQuestionPoints = (questions) => {
        const pointsPerQuestion = calculateQuestionPoints(questions.length);
        return questions.map(q => ({ ...q, points: pointsPerQuestion }));
    };

    const addQuestion = (type = 'multiple_choice') => {
        const currentQuestions = [...formData.questions];
        const newQuestion = {
            id: generateQuestionId(),
            questionText: '',
            questionType: type,
            points: 10, // Sẽ được cập nhật sau
            correctAnswer: '',
            options: type === 'multiple_choice' ? ['', '', '', ''] : [],
            explanation: ''
        };

        const updatedQuestions = [...currentQuestions, newQuestion];
        const questionsWithUpdatedPoints = updateAllQuestionPoints(updatedQuestions);

        setFormData(prev => ({
            ...prev,
            questions: questionsWithUpdatedPoints
        }));
        setActiveQuestionIndex(formData.questions.length);
    };

    const updateQuestion = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => 
                i === index ? { ...q, [field]: value } : q
            )
        }));
    };

    const deleteQuestion = (index) => {
        if (formData.questions.length <= 1) {
            showNotification('Phải có ít nhất 1 câu hỏi', 'error');
            return;
        }

        const updatedQuestions = formData.questions.filter((_, i) => i !== index);
        const questionsWithUpdatedPoints = updateAllQuestionPoints(updatedQuestions);

        setFormData(prev => ({
            ...prev,
            questions: questionsWithUpdatedPoints
        }));

        if (activeQuestionIndex >= formData.questions.length - 1) {
            setActiveQuestionIndex(Math.max(0, formData.questions.length - 2));
        }
    };

    const updateQuestionOption = (questionIndex, optionIndex, value) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => 
                i === questionIndex 
                    ? { 
                        ...q, 
                        options: q.options.map((opt, j) => j === optionIndex ? value : opt)
                    }
                    : q
            )
        }));
    };

    const addQuestionOption = (questionIndex) => {
        const question = formData.questions[questionIndex];
        if (question.options.length >= 6) {
            showNotification('Tối đa 6 đáp án cho mỗi câu hỏi', 'error');
            return;
        }

        updateQuestion(questionIndex, 'options', [...question.options, '']);
    };

    const removeQuestionOption = (questionIndex, optionIndex) => {
        const question = formData.questions[questionIndex];
        if (question.options.length <= 2) {
            showNotification('Phải có ít nhất 2 đáp án', 'error');
            return;
        }

        const newOptions = question.options.filter((_, i) => i !== optionIndex);
        updateQuestion(questionIndex, 'options', newOptions);

        // Reset correct answer if it was the deleted option
        if (question.correctAnswer === question.options[optionIndex]) {
            updateQuestion(questionIndex, 'correctAnswer', '');
        }
    };

    const calculateTotalPoints = () => {
        return formData.questions.reduce((total, q) => total + parseFloat(q.points || 0), 0);
    };

    const addTag = (tag) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !formData.tags.includes(trimmedTag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, trimmedTag]
            }));
        }
        setTagInput('');
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const validateForm = () => {
        if (!formData.title.trim()) {
            showNotification('Vui lòng nhập tiêu đề', 'error');
            return false;
        }

        if (!formData.subject_id) {
            showNotification('Vui lòng chọn môn học', 'error');
            return false;
        }

        if (formData.questions.length === 0) {
            showNotification('Phải có ít nhất 1 câu hỏi', 'error');
            return false;
        }

        // Validate each question
        for (let i = 0; i < formData.questions.length; i++) {
            const question = formData.questions[i];
            
            if (!question.questionText.trim()) {
                showNotification(`Câu hỏi ${i + 1}: Vui lòng nhập nội dung câu hỏi`, 'error');
                setActiveQuestionIndex(i);
                return false;
            }

            if (!question.points || question.points <= 0) {
                showNotification(`Câu hỏi ${i + 1}: Điểm phải lớn hơn 0`, 'error');
                setActiveQuestionIndex(i);
                return false;
            }

            if (question.questionType === 'multiple_choice') {
                const validOptions = question.options.filter(opt => opt.trim());
                if (validOptions.length < 2) {
                    showNotification(`Câu hỏi ${i + 1}: Phải có ít nhất 2 đáp án`, 'error');
                    setActiveQuestionIndex(i);
                    return false;
                }

                if (!question.correctAnswer || !question.options.includes(question.correctAnswer)) {
                    showNotification(`Câu hỏi ${i + 1}: Vui lòng chọn đáp án đúng`, 'error');
                    setActiveQuestionIndex(i);
                    return false;
                }
            } else if (!question.correctAnswer.trim()) {
                showNotification(`Câu hỏi ${i + 1}: Vui lòng nhập đáp án đúng`, 'error');
                setActiveQuestionIndex(i);
                return false;
            }
        }

        // Kiểm tra tổng điểm có bằng 10 không (vì chúng ta luôn chia từ 10 điểm)
        const calculatedPoints = calculateTotalPoints();
        if (Math.abs(calculatedPoints - 10) > 0.01) {
            showNotification(
                `Tổng điểm câu hỏi (${calculatedPoints}) phải bằng 10 điểm`,
                'error'
            );
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            
            const submitData = {
                ...formData,
                total_points: 10 // Luôn là 10 điểm theo yêu cầu
            };

            if (isEdit) {
                await ApiService.updateExamTemplate(id,submitData);
                showNotification('Cập nhật template thành công', 'success');
            } else {
                await ApiService.createExamTemplate(submitData);
                showNotification('Tạo template thành công', 'success');
            }

            navigate('/teacher/exam-templates');
        } catch (error) {
            console.error('Error saving template:', error);
            showNotification(
                error.response?.data?.message || 'Lỗi khi lưu template',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyLabel = (level) => {
        switch (level) {
            case 'easy': return 'Dễ';
            case 'medium': return 'Trung bình';
            case 'hard': return 'Khó';
            default: return level;
        }
    };

    const breadcrumb = [
        { label: 'Trang chủ', path: '/teacher' },
        { label: 'Bài kiểm tra', path: '/teacher/exams' },
        { label: 'Ngân hàng bài kiểm tra', path: '/teacher/exam-templates' },
        { label: isEdit ? 'Chỉnh sửa template' : 'Tạo template mới', path: '' }
    ];

    return (
        <AppLayout
            user={currentUser}
            onLogout={() => { authService.logout(); navigate('/login'); }}
            currentTime={new Date()}
            title={isEdit ? 'Chỉnh sửa template' : 'Tạo template mới'}
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

            {/* Header */}
            <Header
                title={isEdit ? 'Chỉnh sửa template bài kiểm tra' : 'Tạo template bài kiểm tra mới'}
                titleIcon={isEdit ? 'fas fa-edit' : 'fas fa-plus'}
                showBack={true}
                onBack={() => navigate('/teacher/exam-templates')}
                breadcrumb={breadcrumb}
            />

            <div style={styles.container}>
                <form onSubmit={handleSubmit}>
                    {/* Thông tin cơ bản */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>
                            <i className="fas fa-info-circle"></i>
                            Thông tin cơ bản
                        </h3>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>
                                Tiêu đề <span style={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                style={styles.input}
                                placeholder="Nhập tiêu đề template..."
                                required
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>
                                Mô tả
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                style={styles.textarea}
                                placeholder="Mô tả về template này..."
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>
                                    Môn học <span style={styles.required}>*</span>
                                </label>
                                <select
                                    value={formData.subject_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subject_id: e.target.value }))}
                                    style={styles.select}
                                    required
                                >
                                    <option value="">Chọn môn học</option>
                                    {subjects.map(subject => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Mức độ khó</label>
                                <select
                                    value={formData.difficulty_level}
                                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty_level: e.target.value }))}
                                    style={styles.select}
                                >
                                    <option value="easy">Dễ</option>
                                    <option value="medium">Trung bình</option>
                                    <option value="hard">Khó</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>
                                    Thời gian (phút) <span style={styles.required}>*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.duration_minutes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                                    min="5"
                                    max="600"
                                    style={styles.input}
                                    required
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Tổng điểm</label>
                                <input
                                    type="number"
                                    value={calculateTotalPoints()}
                                    style={{ ...styles.input, backgroundColor: '#f9fafb' }}
                                    readOnly
                                    title="Tổng điểm được tính tự động từ các câu hỏi"
                                />
                                <div style={styles.helpText}>
                                    Tính tự động từ các câu hỏi ({formData.questions.length} câu × {formData.questions.length > 0 ? calculateQuestionPoints(formData.questions.length) : 0} điểm)
                                </div>
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_public}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                                    style={styles.checkbox}
                                />
                                Chia sẻ template này với các giáo viên khác
                            </label>
                            <div style={styles.helpText}>
                                Template công khai có thể được sử dụng bởi các giáo viên khác
                            </div>
                        </div>
                    </div>

                    {/* Câu hỏi */}
                    <div style={styles.section}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={styles.sectionTitle}>
                                <i className="fas fa-question-circle"></i>
                                Câu hỏi ({formData.questions.length})
                            </h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => addQuestion('multiple_choice')}
                                    style={{ ...styles.button, ...styles.buttonPrimary, ...styles.buttonSmall }}
                                >
                                    <i className="fas fa-plus"></i>
                                    Trắc nghiệm
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addQuestion('true_false')}
                                    style={{ ...styles.button, ...styles.buttonSecondary, ...styles.buttonSmall }}
                                >
                                    <i className="fas fa-plus"></i>
                                    Đúng/Sai
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addQuestion('short_answer')}
                                    style={{ ...styles.button, ...styles.buttonSecondary, ...styles.buttonSmall }}
                                >
                                    <i className="fas fa-plus"></i>
                                    Tự luận
                                </button>
                            </div>
                        </div>

                        {/* Question Tabs */}
                        {formData.questions.length > 0 && (
                            <div style={styles.questionTabs}>
                                {formData.questions.map((_, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setActiveQuestionIndex(index)}
                                        style={{
                                            ...styles.questionTab,
                                            ...(activeQuestionIndex === index ? styles.questionTabActive : styles.questionTabInactive)
                                        }}
                                    >
                                        Câu {index + 1}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Question Editor */}
                        {formData.questions.length > 0 && formData.questions[activeQuestionIndex] && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#374151' }}>
                                        Chỉnh sửa câu hỏi {activeQuestionIndex + 1}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => deleteQuestion(activeQuestionIndex)}
                                        style={{ ...styles.button, ...styles.buttonDanger, ...styles.buttonSmall }}
                                        disabled={formData.questions.length <= 1}
                                    >
                                        <i className="fas fa-trash"></i>
                                        Xóa
                                    </button>
                                </div>

                                {(() => {
                                    const question = formData.questions[activeQuestionIndex];
                                    return (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                <div style={styles.formGroup}>
                                                    <label style={styles.label}>Loại câu hỏi</label>
                                                    <select
                                                        value={question.questionType}
                                                        onChange={(e) => updateQuestion(activeQuestionIndex, 'questionType', e.target.value)}
                                                        style={styles.select}
                                                    >
                                                        <option value="multiple_choice">Trắc nghiệm</option>
                                                        <option value="true_false">Đúng/Sai</option>
                                                        <option value="short_answer">Tự luận ngắn</option>
                                                    </select>
                                                </div>
                                                <div style={styles.formGroup}>
                                                    <label style={styles.label}>Điểm số</label>
                                                    <input
                                                        type="number"
                                                        value={question.points}
                                                        style={{ ...styles.input, backgroundColor: '#f9fafb' }}
                                                        readOnly
                                                        title="Điểm được tính tự động: 10 chia cho số lượng câu hỏi"
                                                    />
                                                    <div style={styles.helpText}>
                                                        Tự động tính: 10 ÷ {formData.questions.length} = {question.points} điểm
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>
                                                    Nội dung câu hỏi <span style={styles.required}>*</span>
                                                </label>
                                                <AdvancedRichTextEditor
                                                    value={question.questionText}
                                                    onChange={(value) => updateQuestion(activeQuestionIndex, 'questionText', value)}
                                                    placeholder="Nhập nội dung câu hỏi - Sử dụng toolbar để định dạng văn bản và chèn công thức hóa học"
                                                    height="120px"
                                                />
                                            </div>

                                            {question.questionType === 'multiple_choice' && (
                                                <div style={styles.formGroup}>
                                                    <label style={styles.label}>Các đáp án</label>
                                                    <div>
                                                        {question.options.map((option, optionIndex) => (
                                                            <div key={optionIndex} style={styles.optionInput}>
                                                                <input
                                                                    type="radio"
                                                                    name={`correct-${question.id}`}
                                                                    checked={question.correctAnswer === option}
                                                                    onChange={() => updateQuestion(activeQuestionIndex, 'correctAnswer', option)}
                                                                    style={styles.radioOption}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={option}
                                                                    onChange={(e) => updateQuestionOption(activeQuestionIndex, optionIndex, e.target.value)}
                                                                    placeholder={`Đáp án ${optionIndex + 1}`}
                                                                    style={{ ...styles.input, flex: 1 }}
                                                                />
                                                                {question.options.length > 2 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeQuestionOption(activeQuestionIndex, optionIndex)}
                                                                        style={{ ...styles.button, ...styles.buttonDanger, ...styles.buttonSmall, padding: '8px' }}
                                                                    >
                                                                        <i className="fas fa-trash"></i>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {question.options.length < 6 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => addQuestionOption(activeQuestionIndex)}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '12px',
                                                                    border: '2px dashed #d1d5db',
                                                                    borderRadius: '6px',
                                                                    backgroundColor: '#f9fafb',
                                                                    color: '#64748b',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                            >
                                                                <i className="fas fa-plus"></i> Thêm đáp án
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {question.questionType === 'true_false' && (
                                                <div style={styles.formGroup}>
                                                    <label style={styles.label}>Đáp án đúng</label>
                                                    <div style={{ display: 'flex', gap: '20px' }}>
                                                        <label style={styles.checkboxLabel}>
                                                            <input
                                                                type="radio"
                                                                name={`tf-${question.id}`}
                                                                value="true"
                                                                checked={question.correctAnswer === 'true'}
                                                                onChange={(e) => updateQuestion(activeQuestionIndex, 'correctAnswer', e.target.value)}
                                                                style={styles.radioOption}
                                                            />
                                                            Đúng
                                                        </label>
                                                        <label style={styles.checkboxLabel}>
                                                            <input
                                                                type="radio"
                                                                name={`tf-${question.id}`}
                                                                value="false"
                                                                checked={question.correctAnswer === 'false'}
                                                                onChange={(e) => updateQuestion(activeQuestionIndex, 'correctAnswer', e.target.value)}
                                                                style={styles.radioOption}
                                                            />
                                                            Sai
                                                        </label>
                                                    </div>
                                                </div>
                                            )}

                                            {question.questionType === 'short_answer' && (
                                                <div style={styles.formGroup}>
                                                    <label style={styles.label}>Đáp án mẫu</label>
                                                    <AdvancedRichTextEditor
                                                        value={question.correctAnswer}
                                                        onChange={(value) => updateQuestion(activeQuestionIndex, 'correctAnswer', value)}
                                                        placeholder="Nhập đáp án mẫu - Sử dụng toolbar để định dạng và chèn công thức..."
                                                        height="80px"
                                                    />
                                                    <div style={styles.helpText}>
                                                        Đáp án mẫu giúp giáo viên chấm điểm nhanh hơn
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Tags và phân loại */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>
                            <i className="fas fa-tags"></i>
                            Tags và phân loại
                        </h3>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Tags</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag(tagInput);
                                        }
                                    }}
                                    style={styles.tagInput}
                                    placeholder="Nhập tag..."
                                />
                                <button
                                    type="button"
                                    onClick={() => addTag(tagInput)}
                                    style={{ ...styles.button, ...styles.buttonSecondary }}
                                >
                                    <i className="fas fa-plus"></i>
                                    Thêm
                                </button>
                            </div>

                            {formData.tags.length > 0 && (
                                <div style={styles.tagsContainer}>
                                    {formData.tags.map((tag, index) => (
                                        <div key={index} style={styles.tag}>
                                            #{tag}
                                            <span
                                                style={styles.tagRemove}
                                                onClick={() => removeTag(tag)}
                                            >
                                                ×
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={styles.helpText}>
                                Tags giúp phân loại và tìm kiếm template dễ dàng hơn
                            </div>
                        </div>

                        {allTags.length > 0 && (
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Tags phổ biến</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {allTags
                                        .filter(tag => !formData.tags.includes(tag))
                                        .slice(0, 8)
                                        .map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => addTag(tag)}
                                                style={{
                                                    padding: '4px 8px',
                                                    fontSize: '12px',
                                                    backgroundColor: '#f1f5f9',
                                                    color: '#64748b',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                + {tag}
                                            </button>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div style={styles.actionBar}>
                        <button
                            type="button"
                            onClick={() => navigate('/teacher/exam-templates')}
                            style={{ ...styles.button, ...styles.buttonSecondary }}
                            disabled={loading}
                        >
                            <i className="fas fa-times"></i>
                            Hủy
                        </button>
                        <button
                            type="submit"
                            style={{ ...styles.button, ...styles.buttonPrimary }}
                            disabled={loading}
                        >
                            {loading ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                                <i className={isEdit ? 'fas fa-save' : 'fas fa-plus'}></i>
                            )}
                            {loading ? 'Đang xử lý...' : (isEdit ? 'Cập nhật' : 'Tạo template')}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default ExamTemplateForm;