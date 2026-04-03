import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import ConfirmModal from '../../components/ConfirmModal';
import { AppLayout, Header } from '../../components/layout/AppLayout';

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
    formInputFocus: {
        borderColor: '#3b82f6',
        outline: 'none',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    formTextarea: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        minHeight: '100px',
        resize: 'vertical',
        transition: 'all 0.2s ease'
    },
    formSelect: {
        width: '100%',
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
        backgroundColor: '#ef4444',
        color: '#ffffff'
    },
    errorText: {
        color: '#ef4444',
        fontSize: '12px',
        marginTop: '4px'
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
    fileName: {
        fontSize: '14px',
        color: '#374151'
    },
    loadingSpinner: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        fontSize: '18px',
        color: '#64748b'
    },
    checkboxContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    checkbox: {
        width: '16px',
        height: '16px'
    }
};

// Loading Spinner Component
const LoadingSpinner = () => (
    <div style={styles.loadingSpinner}>
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Đang tải dữ liệu...
    </div>
);

// Main Component
const AssignmentForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = Boolean(id);
    const template = location.state?.template;
    const fromTemplate = location.state?.fromTemplate;
    const { notifications, showNotification, removeNotification } = useNotification();

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [courseSections, setCourseSections] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentUser, setCurrentUser] = useState(null);
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [existingAttachment, setExistingAttachment] = useState(null);
    const [selectedCourseSections, setSelectedCourseSections] = useState([]);
    const [errors, setErrors] = useState({});
    const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignment_type: 'homework',
        max_score: '',
        due_date: '',
        due_time: '',
        instructions: '',
        is_active: true
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        loadData();
        
        // Load template data if creating from template
        if (fromTemplate && template) {
            loadTemplateData();
        }
        
        return () => clearInterval(timer);
    }, []);

    const loadTemplateData = () => {
        setFormData({
            title: template.title || '',
            description: template.description || '',
            assignment_type: template.assignment_type || 'homework',
            max_score: template.default_max_score || '',
            due_date: '',
            due_time: '',
            instructions: template.instructions || '',
            is_active: true
        });
    };

    useEffect(() => {
        if (isEdit && id) {
            fetchAssignment();
        }
    }, [id, isEdit]);

    const loadData = async () => {
        try {
            const user = await ApiService.getProfile();
            setCurrentUser(user.data);
            await fetchCourseSections(user.data.id);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const fetchCourseSections = async (id) => {
        try {
            const response = await ApiService.getCourseSectionsByTeacher(id);
            if (response.success) {
                setCourseSections(response.data.courseSections || []);
            }
        } catch (error) {
            console.error('Error fetching course sections:', error);
            showNotification('Lỗi khi tải danh sách lớp học phần', 'error');
        }
    };

    const fetchAssignment = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getAssignment(id);
            
            if (response.success) {
                const assignment = response.data;
                const dueDateTime = new Date(assignment.due_date);
                
                setFormData({
                    title: assignment.title || '',
                    description: assignment.description || '',
                    assignment_type: assignment.assignment_type || 'homework',
                    max_score: assignment.max_score || '',
                    due_date: dueDateTime.toISOString().split('T')[0],
                    due_time: dueDateTime.toTimeString().slice(0, 5),
                    instructions: assignment.instructions || '',
                    is_active: assignment.is_active !== false
                });

                setSelectedCourseSections([assignment.course_section_id]);
                
                if (assignment.attachment_path) {
                    setExistingAttachment(assignment.attachment_path);
                }
            }
        } catch (error) {
            console.error('Error fetching assignment:', error);
            showNotification('Lỗi khi tải thông tin bài tập', 'error');
            navigate('/teacher/assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/');
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Tiêu đề bài tập là bắt buộc';
        }

        if (!formData.due_date) {
            newErrors.due_date = 'Ngày hạn nộp là bắt buộc';
        }

        if (!formData.due_time) {
            newErrors.due_time = 'Giờ hạn nộp là bắt buộc';
        }

        // if (!formData.max_score || parseFloat(formData.max_score) <= 0) {
        //     newErrors.max_score = 'Điểm tối đa phải lớn hơn 0';
        // }

        if (!isEdit && selectedCourseSections.length === 0) {
            newErrors.course_sections = 'Vui lòng chọn ít nhất một lớp học phần';
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

        setSubmitting(true);

        try {
            // Prepare form data for file upload
            const submitData = new FormData();
            
            // Combine date and time
            const dueDateTime = new Date(`${formData.due_date}T${formData.due_time}`);
            
            const assignmentData = {
                ...formData,
                due_date: dueDateTime.toISOString(),
                max_score: parseFloat(formData.max_score)
            };

            // For edit mode, submit to single course section
            if (isEdit) {
                Object.keys(assignmentData).forEach(key => {
                    if (key !== 'due_time') {
                        submitData.append(key, assignmentData[key]);
                    }
                });

                if (attachmentFile) {
                    submitData.append('attachment', attachmentFile);
                }

                const response = await ApiService.updateAssignment(id, submitData);

                if (response.success) {
                    showNotification('Cập nhật bài tập thành công', 'success');
                    navigate('/teacher/assignments');
                } else {
                    throw new Error('Failed to update assignment');
                }
            } else {
                // For create mode, submit to multiple course sections
                const results = [];
                const errors = [];
                
                for (const courseSectionId of selectedCourseSections) {
                    try {
                        const sectionData = new FormData();
                        
                        Object.keys(assignmentData).forEach(key => {
                            if (key !== 'due_time') {
                                sectionData.append(key, assignmentData[key]);
                            }
                        });
                        
                        sectionData.append('course_section_id', courseSectionId);
                        
                        if (attachmentFile) {
                            sectionData.append('attachment', attachmentFile);
                        }

                        // Nếu tạo từ template, thêm template_id
                        if (fromTemplate && template) {
                            sectionData.append('template_id', template.id);
                        }

                        const response = await ApiService.createAssignment(sectionData);

                        if (response.success) {
                            results.push(response);
                        } else {
                            throw new Error(response.error || 'Failed to create assignment');
                        }
                    } catch (error) {
                        // Lấy tên lớp để hiển thị trong error
                        const section = courseSections.find(s => s.id === courseSectionId);
                        const sectionName = section ? section.name : `ID ${courseSectionId}`;
                        
                        if (error.message.includes('đã tồn tại')) {
                            errors.push(`${sectionName}: Bài tập đã tồn tại`);
                        } else {
                            errors.push(`${sectionName}: ${error.message}`);
                        }
                    }
                }

                if (errors.length > 0 && results.length === 0) {
                    // Tất cả đều fail
                    throw new Error(`Không thể tạo bài tập \n${errors.join('\n')}`);
                } else if (errors.length > 0) {
                    // Một số thành công, một số fail
                    showNotification(
                        `Tạo thành công cho ${results.length} lớp. Lỗi:\n${errors.join('\n')}`, 
                        'warning'
                    );
                } else {
                    // Tất cả thành công
                    showNotification(`Tạo bài tập thành công cho ${results.length} lớp`, 'success');
                }
                navigate('/teacher/assignments');
            }
        } catch (error) {
            console.error('Error submitting assignment:', error);
            showNotification(`${error}`, 'error');
        } finally {
            setSubmitting(false);
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setAttachmentFile(file);
    };

    const removeFile = () => {
        setAttachmentFile(null);
        setExistingAttachment(null);
    };

    const handleCourseSectionChange = (courseSectionId, checked) => {
        if (checked) {
            setSelectedCourseSections(prev => [...prev, courseSectionId]);
        } else {
            setSelectedCourseSections(prev => prev.filter(id => id !== courseSectionId));
        }
    };

    const hasUnsavedChanges = () => {
        return formData.title || formData.description || formData.instructions || 
               selectedCourseSections.length > 0 || attachmentFile;
    };

    const handleCancel = () => {
        if (hasUnsavedChanges()) {
            setShowUnsavedChangesModal(true);
            setPendingNavigation('/teacher/assignments');
        } else {
            navigate('/teacher/assignments');
        }
    };

    const confirmNavigation = () => {
        setShowUnsavedChangesModal(false);
        if (pendingNavigation) {
            navigate(pendingNavigation);
        }
    };

    const cancelNavigation = () => {
        setShowUnsavedChangesModal(false);
        setPendingNavigation(null);
    };

    const breadcrumb = [
        { label: 'Trang chủ', path: '/teacher' },
        { label: 'Bài tập', path: '/teacher/assignments' },
        { label: isEdit ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới', path: '' }
    ];

    if (loading) {
        return (
            <AppLayout
                user={currentUser}
                onLogout={handleLogout}
                currentTime={currentTime}
                title={isEdit ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
            >
                <LoadingSpinner />
            </AppLayout>
        );
    }

    return (
        <AppLayout
            user={currentUser}
            onLogout={handleLogout}
            currentTime={currentTime}
            title={isEdit ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
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
                title={isEdit ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
                titleIcon="fas fa-edit"
                showBack={true}
                onBack={() => navigate('/teacher/assignments')}
                breadcrumb={breadcrumb}
            />

            {/* Form */}
            <div style={styles.section}>
                <form onSubmit={handleSubmit}>
                    {/* Basic Information */}
                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>
                            <i className="fas fa-heading" style={{ marginRight: '6px' }}></i>
                            Tiêu đề bài tập *
                        </label>
                        <input
                            type="text"
                            style={styles.formInput}
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="Nhập tiêu đề bài tập"
                        />
                        {errors.title && <div style={styles.errorText}>{errors.title}</div>}
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>
                            <i className="fas fa-align-left" style={{ marginRight: '6px' }}></i>
                            Mô tả
                        </label>
                        <textarea
                            style={styles.formTextarea}
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Nhập mô tả bài tập"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>
                                <i className="fas fa-tag" style={{ marginRight: '6px' }}></i>
                                Loại bài tập
                            </label>
                            <select
                                style={styles.formSelect}
                                value={formData.assignment_type}
                                onChange={(e) => handleInputChange('assignment_type', e.target.value)}
                            >
                                <option value="homework">Bài tập về nhà</option>
                                <option value="project">Dự án</option>
                                <option value="lab">Thí nghiệm</option>
                                <option value="essay">Tiểu luận</option>
                            </select>
                        </div>

                        {/* <div style={styles.formGroup}>
                            <label style={styles.formLabel}>
                                <i className="fas fa-star" style={{ marginRight: '6px' }}></i>
                                Điểm tối đa *
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                style={styles.formInput}
                                value={formData.max_score}
                                onChange={(e) => handleInputChange('max_score', e.target.value)}
                                placeholder="10"
                            />
                            {errors.max_score && <div style={styles.errorText}>{errors.max_score}</div>}
                        </div> */}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>
                                <i className="fas fa-calendar" style={{ marginRight: '6px' }}></i>
                                Ngày hạn nộp *
                            </label>
                            <input
                                type="date"
                                style={styles.formInput}
                                value={formData.due_date}
                                onChange={(e) => handleInputChange('due_date', e.target.value)}
                            />
                            {errors.due_date && <div style={styles.errorText}>{errors.due_date}</div>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>
                                <i className="fas fa-clock" style={{ marginRight: '6px' }}></i>
                                Giờ hạn nộp *
                            </label>
                            <input
                                type="time"
                                style={styles.formInput}
                                value={formData.due_time}
                                onChange={(e) => handleInputChange('due_time', e.target.value)}
                            />
                            {errors.due_time && <div style={styles.errorText}>{errors.due_time}</div>}
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>
                            <i className="fas fa-list-ul" style={{ marginRight: '6px' }}></i>
                            Hướng dẫn
                        </label>
                        <textarea
                            style={styles.formTextarea}
                            value={formData.instructions}
                            onChange={(e) => handleInputChange('instructions', e.target.value)}
                            placeholder="Nhập hướng dẫn làm bài"
                        />
                    </div>

                    {/* File Upload */}
                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>
                            <i className="fas fa-paperclip" style={{ marginRight: '6px' }}></i>
                            Tệp đính kèm
                        </label>
                        <div style={styles.fileUpload}>
                            <input
                                type="file"
                                id="attachment"
                                style={styles.fileInput}
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png"
                            />
                            <label htmlFor="attachment" style={{ ...styles.button, ...styles.buttonSecondary }}>
                                <i className="fas fa-upload"></i>
                                Chọn tệp
                            </label>
                            {(attachmentFile || existingAttachment) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={styles.fileName}>
                                        {attachmentFile ? attachmentFile.name : existingAttachment}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={removeFile}
                                        style={{ ...styles.button, ...styles.buttonDanger, padding: '4px 8px' }}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Course Sections (only for create mode) */}
                    {!isEdit && (
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>
                                <i className="fas fa-users" style={{ marginRight: '6px' }}></i>
                                Lớp học phần *
                            </label>
                            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px' }}>
                                {courseSections.map(section => (
                                    <div key={section.id} style={styles.checkboxContainer}>
                                        <input
                                            type="checkbox"
                                            id={`section-${section.id}`}
                                            style={styles.checkbox}
                                            checked={selectedCourseSections.includes(section.id)}
                                            onChange={(e) => handleCourseSectionChange(section.id, e.target.checked)}
                                        />
                                        <label htmlFor={`section-${section.id}`} style={{ fontSize: '14px', cursor: 'pointer' }}>
                                            {section.name} - {section.subject?.name} ({section.class?.name})
                                        </label>
                                    </div>
                                ))}
                            </div>
                            {errors.course_sections && <div style={styles.errorText}>{errors.course_sections}</div>}
                        </div>
                    )}

                    {/* Active Status */}
                    <div style={styles.formGroup}>
                        <div style={styles.checkboxContainer}>
                            <input
                                type="checkbox"
                                id="is_active"
                                style={styles.checkbox}
                                checked={formData.is_active}
                                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                            />
                            <label htmlFor="is_active" style={{ fontSize: '14px', cursor: 'pointer' }}>
                                Kích hoạt bài tập
                            </label>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button
                            type="button"
                            style={{ ...styles.button, ...styles.buttonSecondary }}
                            onClick={() => handleCancel()}
                            disabled={submitting}
                        >
                            <i className="fas fa-times"></i>
                            Hủy
                        </button>
                        <button
                            type="submit"
                            style={{ ...styles.button, ...styles.buttonPrimary }}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    {isEdit ? 'Đang cập nhật...' : 'Đang tạo...'}
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i>
                                    {isEdit ? 'Cập nhật bài tập' : 'Tạo bài tập'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Unsaved Changes Modal */}
            <ConfirmModal
                show={showUnsavedChangesModal}
                title="Thay đổi chưa được lưu"
                message="Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang này không?"
                onConfirm={confirmNavigation}
                onCancel={cancelNavigation}
            />
        </AppLayout>
    );
};

export default AssignmentForm;