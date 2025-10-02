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
            navigate('/login');
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
                title={isEdit ? 'Chỉnh sửa template' : 'Tạo template mới'}
                titleIcon={isEdit ? 'fas fa-edit' : 'fas fa-plus'}
                showBack={true}
                onBack={() => navigate('/teacher/assignment-templates')}
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
            </div>
        </AppLayout>
    );
};

export default AssignmentTemplateForm;