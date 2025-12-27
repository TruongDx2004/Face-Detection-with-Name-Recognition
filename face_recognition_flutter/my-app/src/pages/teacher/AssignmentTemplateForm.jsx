import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import { AppLayout, Header } from '../../components/layout/AppLayout';

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
    fileUpload: {
        width: '100%',
        padding: '12px',
        borderRadius: '6px',
        border: '2px dashed #d1d5db',
        backgroundColor: '#f9fafb',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    fileUploadHover: {
        borderColor: '#3b82f6',
        backgroundColor: '#dbeafe'
    },
    currentFile: {
        fontSize: '14px',
        color: '#64748b',
        marginTop: '8px',
        padding: '8px',
        backgroundColor: '#f1f5f9',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
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
    }
};

const AssignmentTemplateForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;
    const { notifications, showNotification, removeNotification } = useNotification();

    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [newTag, setNewTag] = useState('');
    const [dragOver, setDragOver] = useState(false);
    
    // AI Generation states
    const [creationMode, setCreationMode] = useState('manual'); // 'manual' or 'ai'
    const [aiStep, setAiStep] = useState(0);
    const [aiFile, setAiFile] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiCapabilities, setAiCapabilities] = useState(null);
    const [previewQuestions, setPreviewQuestions] = useState(null);
    const [aiConfig, setAiConfig] = useState({
        question_count: 10,
        question_types: ['multiple_choice', 'short_answer'],
        difficulty: 'medium',
        language: 'vietnamese'
    });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignment_type: 'homework',
        default_max_score: 10,
        instructions: '',
        tags: [],
        is_public: false,
        attachment: null
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadCurrentUser();
        loadAiCapabilities();
        if (isEdit) {
            loadTemplate();
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

    const loadAiCapabilities = async () => {
        try {
            const capabilities = await ApiService.getAICapabilities();
            setAiCapabilities(capabilities.data);
            console.log('✅ AI capabilities loaded:', capabilities);
        } catch (error) {
            console.warn('⚠️ AI capabilities not available:', error);
            // Set mock capabilities for testing UI
            setAiCapabilities({
                supported_formats: ['PDF', 'DOCX', 'TXT', 'XLSX'],
                question_types: [
                    { type: 'multiple_choice', name: 'Trắc nghiệm', description: 'Câu hỏi với 4 lựa chọn A, B, C, D' },
                    { type: 'short_answer', name: 'Tự luận ngắn', description: 'Câu hỏi yêu cầu trả lời 1-2 câu' },
                    { type: 'true_false', name: 'Đúng/Sai', description: 'Câu hỏi đúng hoặc sai' },
                    { type: 'essay', name: 'Tự luận dài', description: 'Câu hỏi yêu cầu phân tích chi tiết' }
                ],
                limits: { max_questions: 20, max_file_size: '10MB' }
            });
        }
    };

    const loadTemplate = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getTemplate(id);
            if (response.success) {
                const template = response.data;
                setFormData({
                    title: template.title || '',
                    description: template.description || '',
                    assignment_type: template.assignment_type || 'homework',
                    default_max_score: template.default_max_score || 10,
                    instructions: template.instructions || '',
                    tags: Array.isArray(template.tags) ? template.tags : JSON.parse(template.tags || '[]'),
                    is_public: template.is_public || false,
                    attachment: null
                });
            } else {
                throw new Error(response.message || 'Không thể tải template');
            }
        } catch (error) {
            console.error('Error loading template:', error);
            showNotification('Không thể tải template', 'error');
            navigate('/teacher/assignment-templates');
        } finally {
            setLoading(false);
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
                [field]: null
            }));
        }
    };

    const handleAddTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                attachment: file
            }));
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                attachment: file
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Tiêu đề là bắt buộc';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Mô tả là bắt buộc';
        }

        if (formData.default_max_score <= 0) {
            newErrors.default_max_score = 'Điểm phải lớn hơn 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // AI Generation functions
    const handleAiFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setAiFile(file);
            setAiStep(1);
        }
    };

    const handleAiFileDrop = (event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            setAiFile(file);
            setAiStep(1);
        }
    };

    const handleAiConfigChange = (field, value) => {
        setAiConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleAiQuestionTypeChange = (type) => {
        setAiConfig(prev => ({
            ...prev,
            question_types: prev.question_types.includes(type)
                ? prev.question_types.filter(t => t !== type)
                : [...prev.question_types, type]
        }));
    };

    const handlePreviewAiQuestions = async () => {
        if (!aiFile) {
            showNotification('Vui lòng upload tài liệu trước', 'error');
            return;
        }

        setAiLoading(true);
        try {
            const previewData = new FormData();
            previewData.append('document', aiFile);
            previewData.append('question_count', '5');
            previewData.append('question_types', aiConfig.question_types.join(','));
            previewData.append('difficulty', aiConfig.difficulty);
            previewData.append('language', aiConfig.language);

            console.log('📤 Sending preview request with file:', aiFile.name, aiFile.size, 'bytes');
            console.log('📤 FormData contents:', {
                document: aiFile,
                question_count: '5',
                question_types: aiConfig.question_types.join(','),
                difficulty: aiConfig.difficulty,
                language: aiConfig.language
            });

            const previewResult = await ApiService.previewAIQuestions(previewData);

            setPreviewQuestions(previewResult);
            setAiStep(2);
            showNotification('Tạo preview thành công!', 'success');
        } catch (error) {
            console.error('AI preview failed:', error);
            showNotification(error.message || 'Không thể tạo preview', 'error');
        } finally {
            setAiLoading(false);
        }
    };

    const handleGenerateAiAssignment = async () => {
        if (!aiFile) {
            showNotification('Vui lòng upload tài liệu trước', 'error');
            return;
        }

        setAiLoading(true);
        try {
            const generationData = new FormData();
            generationData.append('document', aiFile);
            
            // Add form data
            generationData.append('title', formData.title || '');
            generationData.append('description', formData.description || '');
            generationData.append('assignment_type', formData.assignment_type);
            generationData.append('question_count', aiConfig.question_count);
            generationData.append('question_types', aiConfig.question_types.join(','));
            generationData.append('difficulty', aiConfig.difficulty);
            generationData.append('language', aiConfig.language);
            generationData.append('is_public', formData.is_public);
            generationData.append('tags', JSON.stringify(formData.tags));

            const generationResult = await ApiService.generateAIAssignment(generationData);

            showNotification('Tạo bài tập AI thành công!', 'success');
            navigate('/teacher/assignment-templates');
        } catch (error) {
            console.error('AI generation failed:', error);
            showNotification(error.message || 'Không thể tạo bài tập AI', 'error');
        } finally {
            setAiLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showNotification('Vui lòng kiểm tra lại thông tin', 'error');
            return;
        }

        try {
            setLoading(true);

            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('assignment_type', formData.assignment_type);
            submitData.append('default_max_score', formData.default_max_score);
            submitData.append('instructions', formData.instructions);
            submitData.append('tags', JSON.stringify(formData.tags));
            submitData.append('is_public', formData.is_public);

            if (formData.attachment) {
                submitData.append('attachment', formData.attachment);
            }

            let response;
            if (isEdit) {
                response = await ApiService.updateTemplate(id, submitData);
            } else {
                response = await ApiService.createTemplate(submitData);
            }

            if (response.success) {
                showNotification(
                    isEdit ? 'Cập nhật template thành công' : 'Tạo template thành công',
                    'success'
                );
                navigate('/teacher/assignment-templates');
            } else {
                throw new Error(response.message || 'Có lỗi xảy ra');
            }

        } catch (error) {
            console.error('Error saving template:', error);
            showNotification(error.message || 'Không thể lưu template', 'error');
        } finally {
            setLoading(false);
        }
    };

    const breadcrumb = [
        { label: 'Trang chủ', path: '/teacher' },
        { label: 'Bài tập', path: '/teacher/assignments' },
        { label: 'Ngân hàng bài tập', path: '/teacher/assignment-templates' },
        { label: isEdit ? 'Chỉnh sửa template' : 'Tạo template mới', path: '' }
    ];

    return (
        <AppLayout
            user={currentUser}
            onLogout={() => { authService.logout(); navigate('/'); }}
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
                title={isEdit ? 'Chỉnh sửa template' : 'Tạo template mới'}
                titleIcon={isEdit ? 'fas fa-edit' : 'fas fa-plus'}
                showBack={true}
                onBack={() => navigate('/teacher/assignment-templates')}
                breadcrumb={breadcrumb}
            />

            <div style={styles.container}>
                {/* Mode Selection */}
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                        <i className="fas fa-tools"></i>
                        Chọn phương thức tạo template
                    </h3>
                    
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                        <button
                            type="button"
                            onClick={() => setCreationMode('manual')}
                            style={{
                                ...styles.button,
                                ...(creationMode === 'manual' ? styles.buttonPrimary : styles.buttonSecondary),
                                flex: 1
                            }}
                        >
                            <i className="fas fa-edit"></i>
                            Tạo thủ công
                        </button>
                        {aiCapabilities && (
                            <button
                                type="button"
                                onClick={() => setCreationMode('ai')}
                                style={{
                                    ...styles.button,
                                    ...(creationMode === 'ai' ? styles.buttonPrimary : styles.buttonSecondary),
                                    flex: 1
                                }}
                                disabled={isEdit}
                            >
                                <i className="fas fa-robot"></i>
                                Tạo bằng AI {isEdit && '(Chỉ khả dụng khi tạo mới)'}
                            </button>
                        )}
                    </div>
                    
                    {creationMode === 'ai' && (
                        <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <i className="fas fa-info-circle" style={{ color: '#0ea5e9' }}></i>
                                <strong style={{ color: '#0369a1' }}>Tạo bài tập bằng AI</strong>
                            </div>
                            <div style={{ fontSize: '14px', color: '#0369a1' }}>
                                Upload tài liệu và để AI tự động tạo câu hỏi phù hợp. Hỗ trợ PDF, DOCX, TXT, XLSX.
                            </div>
                        </div>
                    )}
                </div>

                {creationMode === 'manual' ? (
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
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                style={styles.input}
                                placeholder="Nhập tiêu đề template..."
                            />
                            {errors.title && <div style={styles.errorText}>{errors.title}</div>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>
                                Mô tả <span style={styles.required}>*</span>
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                style={styles.textarea}
                                placeholder="Mô tả chi tiết về template..."
                            />
                            {errors.description && <div style={styles.errorText}>{errors.description}</div>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Loại bài tập</label>
                                <select
                                    value={formData.assignment_type}
                                    onChange={(e) => handleInputChange('assignment_type', e.target.value)}
                                    style={styles.select}
                                >
                                    <option value="homework">Bài tập</option>
                                    <option value="project">Dự án</option>
                                    <option value="lab">Thực hành</option>
                                    <option value="essay">Luận văn</option>
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Điểm tối đa mặc định</label>
                                <input
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    value={formData.default_max_score}
                                    onChange={(e) => handleInputChange('default_max_score', parseFloat(e.target.value))}
                                    style={styles.input}
                                />
                                {errors.default_max_score && <div style={styles.errorText}>{errors.default_max_score}</div>}
                            </div>
                        </div>
                    </div>

                    {/* Hướng dẫn */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>
                            <i className="fas fa-list-ol"></i>
                            Hướng dẫn thực hiện
                        </h3>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Hướng dẫn chi tiết</label>
                            <textarea
                                value={formData.instructions}
                                onChange={(e) => handleInputChange('instructions', e.target.value)}
                                style={{ ...styles.textarea, minHeight: '200px' }}
                                placeholder="Nhập hướng dẫn chi tiết cho bài tập..."
                            />
                            <div style={styles.helpText}>
                                Mô tả chi tiết cách thực hiện bài tập, yêu cầu, tiêu chí đánh giá...
                            </div>
                        </div>
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
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    style={styles.tagInput}
                                    placeholder="Nhập tag..."
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTag}
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
                                                onClick={() => handleRemoveTag(tag)}
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

                        <div style={styles.formGroup}>
                            <label style={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_public}
                                    onChange={(e) => handleInputChange('is_public', e.target.checked)}
                                    style={styles.checkbox}
                                />
                                Chia sẻ template này với các giáo viên khác
                            </label>
                            <div style={styles.helpText}>
                                Template công khai có thể được sử dụng bởi các giáo viên khác
                            </div>
                        </div>
                    </div>

                    {/* File đính kèm */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>
                            <i className="fas fa-paperclip"></i>
                            File đính kèm (tùy chọn)
                        </h3>

                        <div style={styles.formGroup}>
                            <div
                                style={{
                                    ...styles.fileUpload,
                                    ...(dragOver ? styles.fileUploadHover : {})
                                }}
                                onDragOver={(e) => (e.preventDefault(), setDragOver(true))}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('file-input').click()}
                            >
                                <i className="fas fa-cloud-upload-alt" style={{ fontSize: '24px', color: '#64748b', marginBottom: '8px' }}></i>
                                <div>Kéo thả file vào đây hoặc click để chọn file</div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                    Hỗ trợ: PDF, Word, PowerPoint, hình ảnh (tối đa 10MB)
                                </div>
                            </div>
                            <input
                                id="file-input"
                                type="file"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                            />

                            {formData.attachment && (
                                <div style={styles.currentFile}>
                                    <i className="fas fa-file"></i>
                                    <span>{formData.attachment.name}</span>
                                    <span
                                        style={styles.tagRemove}
                                        onClick={() => handleInputChange('attachment', null)}
                                    >
                                        ×
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div style={styles.actionBar}>
                        <button
                            type="button"
                            onClick={() => navigate('/teacher/assignment-templates')}
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
                ) : (
                    /* AI Generation Interface */
                    <div>
                        {/* AI Step Indicator */}
                        <div style={styles.section}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ 
                                    padding: '8px 16px', 
                                    borderRadius: '20px', 
                                    backgroundColor: aiStep >= 0 ? '#10b981' : '#d1d5db',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    1. Upload
                                </div>
                                <div style={{ flex: 1, height: '2px', backgroundColor: aiStep >= 1 ? '#10b981' : '#d1d5db' }}></div>
                                <div style={{ 
                                    padding: '8px 16px', 
                                    borderRadius: '20px', 
                                    backgroundColor: aiStep >= 1 ? '#10b981' : '#d1d5db',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    2. Config
                                </div>
                                <div style={{ flex: 1, height: '2px', backgroundColor: aiStep >= 2 ? '#10b981' : '#d1d5db' }}></div>
                                <div style={{ 
                                    padding: '8px 16px', 
                                    borderRadius: '20px', 
                                    backgroundColor: aiStep >= 2 ? '#10b981' : '#d1d5db',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    3. Preview
                                </div>
                                <div style={{ flex: 1, height: '2px', backgroundColor: aiStep >= 3 ? '#10b981' : '#d1d5db' }}></div>
                                <div style={{ 
                                    padding: '8px 16px', 
                                    borderRadius: '20px', 
                                    backgroundColor: aiStep >= 3 ? '#10b981' : '#d1d5db',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    4. Generate
                                </div>
                            </div>
                        </div>

                        {/* Step 1: Document Upload */}
                        {aiStep === 0 && (
                            <div style={styles.section}>
                                <h3 style={styles.sectionTitle}>
                                    <i className="fas fa-upload"></i>
                                    Upload Tài Liệu
                                </h3>
                                
                                <div
                                    style={{
                                        ...styles.fileUpload,
                                        ...(dragOver ? styles.fileUploadHover : {}),
                                        minHeight: '200px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                    onDragOver={(e) => (e.preventDefault(), setDragOver(true))}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleAiFileDrop}
                                    onClick={() => document.getElementById('ai-file-input').click()}
                                >
                                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: '48px', color: '#64748b', marginBottom: '16px' }}></i>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                                        {aiFile ? aiFile.name : 'Upload Tài Liệu để Tạo Bài Tập'}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                                        Drag & drop hoặc click để chọn file
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                                        Hỗ trợ: PDF, DOCX, TXT, XLSX (Tối đa 10MB)
                                    </div>
                                    
                                    <input
                                        id="ai-file-input"
                                        type="file"
                                        onChange={handleAiFileSelect}
                                        style={{ display: 'none' }}
                                        accept=".pdf,.docx,.txt,.xlsx"
                                    />
                                </div>

                                {aiFile && (
                                    <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ 
                                                width: '40px', 
                                                height: '40px', 
                                                borderRadius: '8px', 
                                                backgroundColor: '#10b981', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center' 
                                            }}>
                                                <i className="fas fa-file" style={{ color: 'white' }}></i>
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{aiFile.name}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                    {(aiFile.size / 1024 / 1024).toFixed(2)} MB
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setAiStep(1)}
                                            style={{ ...styles.button, ...styles.buttonPrimary }}
                                        >
                                            <i className="fas fa-arrow-right"></i>
                                            Tiếp tục
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: AI Configuration */}
                        {aiStep === 1 && (
                            <div style={styles.section}>
                                <h3 style={styles.sectionTitle}>
                                    <i className="fas fa-cogs"></i>
                                    Cấu Hình AI Generation
                                </h3>

                                {/* Basic Info */}
                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>Thông tin cơ bản</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Tiêu đề (tùy chọn)</label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => handleInputChange('title', e.target.value)}
                                                style={styles.input}
                                                placeholder="Để trống để AI tự tạo..."
                                            />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Loại bài tập</label>
                                            <select
                                                value={formData.assignment_type}
                                                onChange={(e) => handleInputChange('assignment_type', e.target.value)}
                                                style={styles.select}
                                            >
                                                <option value="homework">Bài tập</option>
                                                <option value="quiz">Quiz</option>
                                                <option value="exam">Kiểm tra</option>
                                                <option value="practice">Luyện tập</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Configuration */}
                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>Cấu hình AI</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Số câu hỏi</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="20"
                                                value={aiConfig.question_count}
                                                onChange={(e) => handleAiConfigChange('question_count', parseInt(e.target.value))}
                                                style={styles.input}
                                            />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Độ khó</label>
                                            <select
                                                value={aiConfig.difficulty}
                                                onChange={(e) => handleAiConfigChange('difficulty', e.target.value)}
                                                style={styles.select}
                                            >
                                                <option value="easy">Dễ</option>
                                                <option value="medium">Trung bình</option>
                                                <option value="hard">Khó</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Loại câu hỏi</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            {aiCapabilities?.question_types.map(type => (
                                                <label key={type.type} style={styles.checkboxLabel}>
                                                    <input
                                                        type="checkbox"
                                                        checked={aiConfig.question_types.includes(type.type)}
                                                        onChange={() => handleAiQuestionTypeChange(type.type)}
                                                        style={styles.checkbox}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: 'bold' }}>{type.name}</div>
                                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{type.description}</div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setAiStep(0)}
                                        style={{ ...styles.button, ...styles.buttonSecondary }}
                                    >
                                        <i className="fas fa-arrow-left"></i>
                                        Quay lại
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handlePreviewAiQuestions}
                                        style={{ ...styles.button, ...styles.buttonSecondary }}
                                        disabled={aiLoading || aiConfig.question_types.length === 0}
                                    >
                                        {aiLoading ? (
                                            <i className="fas fa-spinner fa-spin"></i>
                                        ) : (
                                            <i className="fas fa-eye"></i>
                                        )}
                                        Preview Câu Hỏi
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleGenerateAiAssignment}
                                        style={{ ...styles.button, ...styles.buttonPrimary }}
                                        disabled={aiLoading || aiConfig.question_types.length === 0}
                                    >
                                        {aiLoading ? (
                                            <i className="fas fa-spinner fa-spin"></i>
                                        ) : (
                                            <i className="fas fa-magic"></i>
                                        )}
                                        Tạo Template AI
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Preview Questions */}
                        {aiStep === 2 && previewQuestions && (
                            <div style={styles.section}>
                                <h3 style={styles.sectionTitle}>
                                    <i className="fas fa-eye"></i>
                                    Preview Câu Hỏi
                                </h3>

                                {/* Document Info */}
                                <div style={{ 
                                    padding: '16px', 
                                    backgroundColor: '#f8fafc', 
                                    borderRadius: '8px', 
                                    marginBottom: '20px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>Thông tin tài liệu</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '12px' }}>
                                        <div>
                                            <div style={{ color: '#64748b' }}>Định dạng</div>
                                            <div style={{ fontWeight: 'bold' }}>{previewQuestions.document_info.format.toUpperCase()}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#64748b' }}>Số từ</div>
                                            <div style={{ fontWeight: 'bold' }}>{previewQuestions.document_info.word_count}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#64748b' }}>Trang</div>
                                            <div style={{ fontWeight: 'bold' }}>{previewQuestions.document_info.pages}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#64748b' }}>Thời gian đọc</div>
                                            <div style={{ fontWeight: 'bold' }}>{previewQuestions.document_info.estimated_reading_time} phút</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview Questions */}
                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                                        Câu hỏi mẫu ({previewQuestions.questions.length}/5)
                                    </h4>
                                    {previewQuestions.questions.map((question, index) => (
                                        <div key={index} style={{ 
                                            padding: '16px', 
                                            backgroundColor: '#ffffff', 
                                            borderRadius: '8px', 
                                            marginBottom: '12px',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                <span style={{ 
                                                    padding: '4px 8px', 
                                                    fontSize: '10px', 
                                                    borderRadius: '4px', 
                                                    backgroundColor: '#3b82f6', 
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {question.type.replace('_', ' ').toUpperCase()}
                                                </span>
                                                <span style={{ 
                                                    padding: '4px 8px', 
                                                    fontSize: '10px', 
                                                    borderRadius: '4px', 
                                                    backgroundColor: question.difficulty === 'hard' ? '#ef4444' : 
                                                                   question.difficulty === 'medium' ? '#f59e0b' : '#10b981', 
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {question.difficulty.toUpperCase()}
                                                </span>
                                            </div>
                                            
                                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                                Q{index + 1}: {question.question}
                                            </div>
                                            
                                            {question.type === 'multiple_choice' && question.options && (
                                                <div style={{ marginLeft: '16px', marginBottom: '8px' }}>
                                                    {question.options.map((option, optIndex) => (
                                                        <div key={optIndex} style={{ marginBottom: '4px', fontSize: '14px' }}>
                                                            {String.fromCharCode(65 + optIndex)}. {option}
                                                        </div>
                                                    ))}
                                                    <div style={{ color: '#10b981', fontWeight: 'bold', marginTop: '8px', fontSize: '12px' }}>
                                                        Đáp án: {question.correct_answer}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {question.explanation && (
                                                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                                                    Giải thích: {question.explanation}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setAiStep(1)}
                                        style={{ ...styles.button, ...styles.buttonSecondary }}
                                    >
                                        <i className="fas fa-arrow-left"></i>
                                        Quay lại
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleGenerateAiAssignment}
                                        style={{ ...styles.button, ...styles.buttonPrimary }}
                                        disabled={aiLoading}
                                    >
                                        {aiLoading ? (
                                            <i className="fas fa-spinner fa-spin"></i>
                                        ) : (
                                            <i className="fas fa-magic"></i>
                                        )}
                                        Tạo Template Hoàn Chỉnh ({aiConfig.question_count} câu)
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Loading Overlay */}
                        {aiLoading && (
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 9999
                            }}>
                                <div style={{ 
                                    backgroundColor: 'white', 
                                    padding: '32px', 
                                    borderRadius: '12px', 
                                    textAlign: 'center',
                                    minWidth: '300px'
                                }}>
                                    <i className="fas fa-robot fa-3x" style={{ color: '#3b82f6', marginBottom: '16px' }}></i>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                                        {aiStep === 2 ? 'Đang tạo preview...' : 'AI đang tạo bài tập...'}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                                        Quá trình này có thể mất vài phút
                                    </div>
                                    <div style={{ marginTop: '16px' }}>
                                        <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#3b82f6' }}></i>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default AssignmentTemplateForm;