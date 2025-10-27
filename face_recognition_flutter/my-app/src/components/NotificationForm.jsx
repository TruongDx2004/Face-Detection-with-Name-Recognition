import React, { useState, useEffect } from 'react';
import apiService from '../services/api-service';
import useNotification from '../hooks/useNotification';

const NotificationForm = ({ 
    isOpen, 
    onClose, 
    notification = null, 
    onSuccess 
}) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'notification',
        category: 'general',
        publish_date: '',
        event_start_datetime: '',
        event_end_datetime: '',
        registration_deadline: '',
        location: '',
        organizer: '',
        allow_registration: false,
        max_participants: '',
        registration_fee: 0,
        target_audience: { all_students: true },
        status: 'draft',
        is_priority: false,
        tags: []
    });
    
    const [files, setFiles] = useState({
        image: null,
        attachment: null
    });
    
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [newTag, setNewTag] = useState('');
    
    const { showNotification } = useNotification();

    useEffect(() => {
        if (isOpen) {
            loadCategories();
            if (notification) {
                // Edit mode
                setFormData({
                    ...notification,
                    publish_date: notification.publish_date ? 
                        new Date(notification.publish_date).toISOString().slice(0, 16) : '',
                    event_start_datetime: notification.event_start_datetime ? 
                        new Date(notification.event_start_datetime).toISOString().slice(0, 16) : '',
                    event_end_datetime: notification.event_end_datetime ? 
                        new Date(notification.event_end_datetime).toISOString().slice(0, 16) : '',
                    registration_deadline: notification.registration_deadline ? 
                        new Date(notification.registration_deadline).toISOString().slice(0, 16) : '',
                    tags: notification.tags || []
                });
            } else {
                // Create mode - reset form
                setFormData({
                    title: '',
                    content: '',
                    type: 'notification',
                    category: 'general',
                    publish_date: '',
                    event_start_datetime: '',
                    event_end_datetime: '',
                    registration_deadline: '',
                    location: '',
                    organizer: '',
                    allow_registration: false,
                    max_participants: '',
                    registration_fee: 0,
                    target_audience: { all_students: true },
                    status: 'draft',
                    is_priority: false,
                    tags: []
                });
            }
            setFiles({ image: null, attachment: null });
            setErrors({});
        }
    }, [isOpen, notification]);

    const loadCategories = async () => {
        try {
            const response = await apiService.getNotificationCategories();
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleFileChange = (field, file) => {
        setFiles(prev => ({ ...prev, [field]: file }));
    };

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Tiêu đề là bắt buộc';
        }

        if (!formData.content.trim()) {
            newErrors.content = 'Nội dung là bắt buộc';
        }

        if (formData.type === 'event') {
            if (!formData.event_start_datetime) {
                newErrors.event_start_datetime = 'Thời gian bắt đầu là bắt buộc cho sự kiện';
            }

            if (formData.allow_registration && !formData.registration_deadline) {
                newErrors.registration_deadline = 'Hạn đăng ký là bắt buộc khi cho phép đăng ký';
            }

            if (formData.event_start_datetime && formData.event_end_datetime) {
                if (new Date(formData.event_start_datetime) >= new Date(formData.event_end_datetime)) {
                    newErrors.event_end_datetime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
                }
            }

            if (formData.allow_registration && formData.registration_deadline && formData.event_start_datetime) {
                if (new Date(formData.registration_deadline) >= new Date(formData.event_start_datetime)) {
                    newErrors.registration_deadline = 'Hạn đăng ký phải trước thời gian bắt đầu sự kiện';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            // Prepare form data
            const submitData = new FormData();
            
            // Add all form fields
            Object.keys(formData).forEach(key => {
                if (key === 'target_audience' || key === 'tags') {
                    submitData.append(key, JSON.stringify(formData[key]));
                } else if (formData[key] !== null && formData[key] !== '') {
                    submitData.append(key, formData[key]);
                }
            });

            // Add files if present
            if (files.image) {
                submitData.append('image', files.image);
            }
            if (files.attachment) {
                submitData.append('attachment', files.attachment);
            }

            let response;
            if (notification) {
                // Update existing notification
                response = await apiService.updateNotification(notification.id, submitData);
            } else {
                // Create new notification
                response = await apiService.createNotification(submitData);
            }

            showNotification(
                notification ? 'Cập nhật thông báo thành công' : 'Tạo thông báo thành công',
                'success'
            );
            
            onSuccess && onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving notification:', error);
            showNotification(
                error.message || 'Có lỗi xảy ra khi lưu thông báo',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        },
        modal: {
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
        },
        header: {
            padding: '20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 1
        },
        title: {
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
        },
        closeButton: {
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '5px'
        },
        body: {
            padding: '20px'
        },
        form: {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        },
        formGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
        },
        label: {
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151'
        },
        input: {
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
        },
        textarea: {
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            minHeight: '120px',
            resize: 'vertical'
        },
        select: {
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white'
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
        errorText: {
            color: '#ef4444',
            fontSize: '12px',
            marginTop: '2px'
        },
        twoColumn: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px'
        },
        threeColumn: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '20px'
        },
        fileUpload: {
            position: 'relative',
            display: 'inline-block',
            cursor: 'pointer'
        },
        fileInput: {
            position: 'absolute',
            left: '-9999px'
        },
        fileButton: {
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        tagContainer: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '8px'
        },
        tag: {
            padding: '4px 8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },
        tagRemove: {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            fontSize: '12px'
        },
        tagInput: {
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
        },
        addTagButton: {
            padding: '8px 12px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
        },
        footer: {
            padding: '20px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'white'
        },
        cancelButton: {
            padding: '10px 20px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
        },
        submitButton: {
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        sectionTitle: {
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            margin: '20px 0 10px 0',
            paddingBottom: '8px',
            borderBottom: '1px solid #e5e7eb'
        }
    };

    return (
        <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={styles.title}>
                        {notification ? 'Chỉnh sửa' : 'Tạo mới'} thông báo/sự kiện
                    </h2>
                    <button style={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                <div style={styles.body}>
                    <form style={styles.form} onSubmit={handleSubmit}>
                        {/* Basic Information */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Tiêu đề *</label>
                            <input
                                type="text"
                                style={styles.input}
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder="Nhập tiêu đề thông báo/sự kiện"
                            />
                            {errors.title && <span style={styles.errorText}>{errors.title}</span>}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Nội dung *</label>
                            <textarea
                                style={styles.textarea}
                                value={formData.content}
                                onChange={(e) => handleInputChange('content', e.target.value)}
                                placeholder="Nhập nội dung chi tiết"
                            />
                            {errors.content && <span style={styles.errorText}>{errors.content}</span>}
                        </div>

                        <div style={styles.threeColumn}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Loại *</label>
                                <select
                                    style={styles.select}
                                    value={formData.type}
                                    onChange={(e) => handleInputChange('type', e.target.value)}
                                >
                                    <option value="notification">Thông báo</option>
                                    <option value="event">Sự kiện</option>
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Phân loại</label>
                                <select
                                    style={styles.select}
                                    value={formData.category}
                                    onChange={(e) => handleInputChange('category', e.target.value)}
                                >
                                    {categories.map(cat => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Trạng thái</label>
                                <select
                                    style={styles.select}
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                >
                                    <option value="draft">Bản nháp</option>
                                    <option value="published">Đã đăng</option>
                                    <option value="archived">Đã lưu trữ</option>
                                </select>
                            </div>
                        </div>

                        <div style={styles.twoColumn}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Ngày đăng</label>
                                <input
                                    type="datetime-local"
                                    style={styles.input}
                                    value={formData.publish_date || ''}
                                    onChange={(e) => handleInputChange('publish_date', e.target.value)}
                                    title="Để trống sẽ đăng ngay lập tức"
                                />
                                <small style={{ color: '#6b7280', fontSize: '12px' }}>
                                    Để trống để đăng ngay lập tức
                                </small>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        style={styles.checkbox}
                                        checked={formData.is_priority}
                                        onChange={(e) => handleInputChange('is_priority', e.target.checked)}
                                    />
                                    Thông báo ưu tiên
                                </label>
                            </div>
                        </div>

                        {/* Event-specific fields */}
                        {formData.type === 'event' && (
                            <>
                                <h3 style={styles.sectionTitle}>Thông tin sự kiện</h3>
                                
                                <div style={styles.twoColumn}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Thời gian bắt đầu *</label>
                                        <input
                                            type="datetime-local"
                                            style={styles.input}
                                            value={formData.event_start_datetime}
                                            onChange={(e) => handleInputChange('event_start_datetime', e.target.value)}
                                        />
                                        {errors.event_start_datetime && <span style={styles.errorText}>{errors.event_start_datetime}</span>}
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Thời gian kết thúc</label>
                                        <input
                                            type="datetime-local"
                                            style={styles.input}
                                            value={formData.event_end_datetime}
                                            onChange={(e) => handleInputChange('event_end_datetime', e.target.value)}
                                        />
                                        {errors.event_end_datetime && <span style={styles.errorText}>{errors.event_end_datetime}</span>}
                                    </div>
                                </div>

                                <div style={styles.twoColumn}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Địa điểm</label>
                                        <input
                                            type="text"
                                            style={styles.input}
                                            value={formData.location}
                                            onChange={(e) => handleInputChange('location', e.target.value)}
                                            placeholder="Nhập địa điểm tổ chức"
                                        />
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Đơn vị tổ chức</label>
                                        <input
                                            type="text"
                                            style={styles.input}
                                            value={formData.organizer}
                                            onChange={(e) => handleInputChange('organizer', e.target.value)}
                                            placeholder="Nhập đơn vị tổ chức"
                                        />
                                    </div>
                                </div>

                                {/* Registration settings */}
                                <div style={styles.formGroup}>
                                    <label style={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            style={styles.checkbox}
                                            checked={formData.allow_registration}
                                            onChange={(e) => handleInputChange('allow_registration', e.target.checked)}
                                        />
                                        Cho phép đăng ký
                                    </label>
                                </div>

                                {formData.allow_registration && (
                                    <div style={styles.threeColumn}>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Hạn đăng ký *</label>
                                            <input
                                                type="datetime-local"
                                                style={styles.input}
                                                value={formData.registration_deadline}
                                                onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
                                            />
                                            {errors.registration_deadline && <span style={styles.errorText}>{errors.registration_deadline}</span>}
                                        </div>

                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Số lượng tối đa</label>
                                            <input
                                                type="number"
                                                style={styles.input}
                                                value={formData.max_participants}
                                                onChange={(e) => handleInputChange('max_participants', e.target.value)}
                                                placeholder="Không giới hạn"
                                                min="1"
                                            />
                                        </div>

                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Phí đăng ký (VNĐ)</label>
                                            <input
                                                type="number"
                                                style={styles.input}
                                                value={formData.registration_fee}
                                                onChange={(e) => handleInputChange('registration_fee', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                step="1000"
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Target Audience */}
                        <h3 style={styles.sectionTitle}>Đối tượng nhận thông báo</h3>
                        
                        <div style={styles.formGroup}>
                            <label style={styles.checkboxLabel}>
                                <input
                                    type="radio"
                                    name="audience_type"
                                    style={styles.checkbox}
                                    checked={formData.target_audience.all_students === true}
                                    onChange={() => handleInputChange('target_audience', { all_students: true })}
                                />
                                Tất cả sinh viên
                            </label>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.checkboxLabel}>
                                <input
                                    type="radio"
                                    name="audience_type"
                                    style={styles.checkbox}
                                    checked={!!formData.target_audience.classes}
                                    onChange={() => handleInputChange('target_audience', { classes: [] })}
                                />
                                Các lớp cụ thể
                            </label>
                            {formData.target_audience.classes && (
                                <div style={{ marginTop: '10px', marginLeft: '25px' }}>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        placeholder="Nhập ID các lớp, cách nhau bằng dấu phẩy (VD: 1, 2, 3)"
                                        value={formData.target_audience.classes?.join(', ') || ''}
                                        onChange={(e) => {
                                            const classIds = e.target.value
                                                .split(',')
                                                .map(id => parseInt(id.trim()))
                                                .filter(id => !isNaN(id));
                                            handleInputChange('target_audience', { classes: classIds });
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.checkboxLabel}>
                                <input
                                    type="radio"
                                    name="audience_type"
                                    style={styles.checkbox}
                                    checked={!!formData.target_audience.years}
                                    onChange={() => handleInputChange('target_audience', { years: [] })}
                                />
                                Các năm học cụ thể
                            </label>
                            {formData.target_audience.years && (
                                <div style={{ marginTop: '10px', marginLeft: '25px' }}>
                                    <input
                                        type="text"
                                        style={styles.input}
                                        placeholder="Nhập các năm học, cách nhau bằng dấu phẩy (VD: 2024, 2025)"
                                        value={formData.target_audience.years?.join(', ') || ''}
                                        onChange={(e) => {
                                            const years = e.target.value
                                                .split(',')
                                                .map(year => year.trim())
                                                .filter(year => year.length === 4 && !isNaN(year));
                                            handleInputChange('target_audience', { years });
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* File uploads */}
                        <h3 style={styles.sectionTitle}>File đính kèm</h3>
                        
                        <div style={styles.twoColumn}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Hình ảnh minh họa</label>
                                <div style={styles.fileUpload}>
                                    <input
                                        type="file"
                                        style={styles.fileInput}
                                        accept="image/*"
                                        onChange={(e) => handleFileChange('image', e.target.files[0])}
                                        id="image-upload"
                                    />
                                    <label htmlFor="image-upload" style={styles.fileButton}>
                                        <i className="fas fa-image"></i>
                                        {files.image ? files.image.name : 'Chọn hình ảnh'}
                                    </label>
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>File đính kèm</label>
                                <div style={styles.fileUpload}>
                                    <input
                                        type="file"
                                        style={styles.fileInput}
                                        onChange={(e) => handleFileChange('attachment', e.target.files[0])}
                                        id="attachment-upload"
                                    />
                                    <label htmlFor="attachment-upload" style={styles.fileButton}>
                                        <i className="fas fa-paperclip"></i>
                                        {files.attachment ? files.attachment.name : 'Chọn file'}
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Tags</label>
                            <div style={styles.tagInput}>
                                <input
                                    type="text"
                                    style={styles.input}
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Nhập tag"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                />
                                <button
                                    type="button"
                                    style={styles.addTagButton}
                                    onClick={addTag}
                                >
                                    Thêm
                                </button>
                            </div>
                            {formData.tags.length > 0 && (
                                <div style={styles.tagContainer}>
                                    {formData.tags.map((tag, index) => (
                                        <span key={index} style={styles.tag}>
                                            {tag}
                                            <button
                                                type="button"
                                                style={styles.tagRemove}
                                                onClick={() => removeTag(tag)}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div style={styles.footer}>
                    <button
                        type="button"
                        style={styles.cancelButton}
                        onClick={onClose}
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        style={styles.submitButton}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading && <i className="fas fa-spinner fa-spin"></i>}
                        {notification ? 'Cập nhật' : 'Tạo mới'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationForm;