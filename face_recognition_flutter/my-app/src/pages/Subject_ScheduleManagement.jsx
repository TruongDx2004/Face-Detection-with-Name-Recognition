import React, { useState, useEffect } from 'react';
import Notification from '../components/Notification';
import ImportModal from '../components/ImportModal';
import Sidebar from '../components/Sidebar';
import LoadingOverlay from '../components/LoadingOverlay';
import useNotification from '../hooks/useNotification';
import useTime from '../hooks/useTime';
import styles from '../components/styles';
import classManagementStyles from '../styles/ClassManagementStyles';
import apiService from '../services/api-service';
import authService from '../services/auth-service';
import * as XLSX from 'xlsx';

// Stats Card Component
const StatsCard = ({ title, value, icon, color, change }) => {
    const [isHovered, setIsHovered] = useState(false);

    const cardStyle = {
        ...styles.statCard,
        ...(isHovered ? styles.statCardHover : {})
    };

    return (
        <div
            style={cardStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={styles.statCardBorder}></div>
            <div style={styles.statHeader}>
                <div style={{ ...styles.statIcon, background: color }}>
                    <i className={icon}></i>
                </div>
                <div style={styles.statChange}>
                    <i className="fas fa-arrow-up"></i>
                    {change}
                </div>
            </div>
            <div style={styles.statValue}>{value?.toLocaleString()}</div>
            <div style={styles.statLabel}>{title}</div>
        </div>
    );
};

// Subject Card Component
const SubjectCard = ({ subject, onEdit, onDelete }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [hoveredAction, setHoveredAction] = useState(null);

    const cardStyle = {
        ...classManagementStyles.classCard,
        ...(isHovered ? classManagementStyles.classCardHover : {})
    };

    const getActionBtnStyle = (action, isDanger = false) => {
        const baseStyle = classManagementStyles.classActionBtn;
        if (hoveredAction === action) {
            return {
                ...baseStyle,
                ...(isDanger ? classManagementStyles.classActionBtnDanger : classManagementStyles.classActionBtnHover)
            };
        }
        return baseStyle;
    };

    return (
        <div
            style={cardStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={classManagementStyles.classCardHeader}>
                <div style={classManagementStyles.classInfo}>
                    <div style={classManagementStyles.className}>{subject.name}</div>
                    <div style={classManagementStyles.classCode}>
                        ID: {subject.id}
                    </div>
                </div>
            </div>
            <div style={classManagementStyles.classCardBody}>
                <div style={classManagementStyles.classActions}>
                    <button
                        style={getActionBtnStyle('edit')}
                        onClick={() => onEdit(subject)}
                        onMouseEnter={() => setHoveredAction('edit')}
                        onMouseLeave={() => setHoveredAction(null)}
                    >
                        <i className="fas fa-edit"></i>
                        Sửa
                    </button>
                    <button
                        style={getActionBtnStyle('delete', true)}
                        onClick={() => onDelete(subject)}
                        onMouseEnter={() => setHoveredAction('delete')}
                        onMouseLeave={() => setHoveredAction(null)}
                    >
                        <i className="fas fa-trash"></i>
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    );
};

// Schedule Card Component
const ScheduleCard = ({ schedule, onEdit, onDelete }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [hoveredAction, setHoveredAction] = useState(null);

    const cardStyle = {
        ...classManagementStyles.classCard,
        ...(isHovered ? classManagementStyles.classCardHover : {}),
        minHeight: '200px'
    };

    const getActionBtnStyle = (action, isDanger = false) => {
        const baseStyle = classManagementStyles.classActionBtn;
        if (hoveredAction === action) {
            return {
                ...baseStyle,
                ...(isDanger ? classManagementStyles.classActionBtnDanger : classManagementStyles.classActionBtnHover)
            };
        }
        return baseStyle;
    };

    const weekdayNames = {
        1: 'Chủ nhật',
        2: 'Thứ hai',
        3: 'Thứ ba',
        4: 'Thứ tư',
        5: 'Thứ năm',
        6: 'Thứ sáu',
        7: 'Thứ bảy'
    };

    return (
        <div
            style={cardStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={classManagementStyles.classCardHeader}>
                <div style={classManagementStyles.classInfo}>
                    <div style={classManagementStyles.className}>{schedule.subject_name}</div>
                    <div style={classManagementStyles.classCode}>
                        {schedule.class_name} - {schedule.teacher_name}
                    </div>
                </div>
            </div>
            <div style={classManagementStyles.classCardBody}>
                <div style={{
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '0.5rem'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#64748b'
                    }}>
                        <i className="fas fa-calendar-day" style={{ marginRight: '0.5rem', color: '#6366f1' }}></i>
                        {weekdayNames[schedule.weekday]}
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                        color: '#64748b'
                    }}>
                        <i className="fas fa-clock" style={{ marginRight: '0.5rem', color: '#10b981' }}></i>
                        {schedule.start_time} - {schedule.end_time}
                    </div>
                </div>

                <div style={classManagementStyles.classActions}>
                    <button
                        style={getActionBtnStyle('edit')}
                        onClick={() => onEdit(schedule)}
                        onMouseEnter={() => setHoveredAction('edit')}
                        onMouseLeave={() => setHoveredAction(null)}
                    >
                        <i className="fas fa-edit"></i>
                        Sửa
                    </button>
                    <button
                        style={getActionBtnStyle('delete', true)}
                        onClick={() => onDelete(schedule)}
                        onMouseEnter={() => setHoveredAction('delete')}
                        onMouseLeave={() => setHoveredAction(null)}
                    >
                        <i className="fas fa-trash"></i>
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, size = 'normal', children }) => {
    if (!isOpen) return null;

    const modalStyle = {
        ...classManagementStyles.modal,
        ...(size === 'large' ? classManagementStyles.modalLarge : {}),
        ...(size === 'small' ? { maxWidth: '400px' } : {})
    };

    return (
        <div style={classManagementStyles.modalOverlay} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <div style={classManagementStyles.modalHeader}>
                    <h3 style={classManagementStyles.modalTitle}>{title}</h3>
                    <button
                        style={classManagementStyles.modalClose}
                        onClick={onClose}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

// Subject Form Component
const SubjectForm = ({ subject, onSave, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        name: subject?.name || ''
    });
    const [errors, setErrors] = useState({});

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Tên môn học không được để trống';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            onSave(formData);
        }
    };

    return (
        <>
            <div style={classManagementStyles.modalBody}>
                <div style={classManagementStyles.formGroup}>
                    <label style={classManagementStyles.formLabel}>
                        Tên môn học <span style={classManagementStyles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        style={classManagementStyles.formInput}
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Ví dụ: Toán học, Lập trình"
                    />
                    {errors.name && <div style={classManagementStyles.formError}>{errors.name}</div>}
                </div>
            </div>

            <div style={classManagementStyles.modalFooter}>
                <button
                    style={{ ...classManagementStyles.btn, ...classManagementStyles.btnOutline }}
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Hủy
                </button>
                <button
                    style={{ ...classManagementStyles.btn, ...classManagementStyles.btnPrimary }}
                    onClick={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-save"></i>
                            {subject ? 'Cập nhật' : 'Tạo môn học'}
                        </>
                    )}
                </button>
            </div>
        </>
    );
};

// Schedule Form Component
const ScheduleForm = ({ schedule, onSave, onCancel, isLoading, options }) => {
    const [formData, setFormData] = useState({
        class_id: schedule?.class_id || '',
        subject_id: schedule?.subject_id || '',
        teacher_id: schedule?.teacher_id || '',
        weekday: schedule?.weekday || '',
        start_time: schedule?.start_time || '',
        end_time: schedule?.end_time || ''
    });
    const [errors, setErrors] = useState({});

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.class_id) newErrors.class_id = 'Vui lòng chọn lớp học';
        if (!formData.subject_id) newErrors.subject_id = 'Vui lòng chọn môn học';
        if (!formData.teacher_id) newErrors.teacher_id = 'Vui lòng chọn giáo viên';
        if (!formData.weekday) newErrors.weekday = 'Vui lòng chọn thứ';
        if (!formData.start_time) newErrors.start_time = 'Vui lòng nhập giờ bắt đầu';
        if (!formData.end_time) newErrors.end_time = 'Vui lòng nhập giờ kết thúc';

        if (formData.start_time && formData.end_time) {
            if (formData.start_time >= formData.end_time) {
                newErrors.end_time = 'Giờ kết thúc phải sau giờ bắt đầu';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            onSave({
                ...formData,
                class_id: parseInt(formData.class_id),
                subject_id: parseInt(formData.subject_id),
                teacher_id: parseInt(formData.teacher_id),
                weekday: parseInt(formData.weekday)
            });
        }
    };

    const weekdayOptions = [
        { value: 2, label: 'Thứ hai' },
        { value: 3, label: 'Thứ ba' },
        { value: 4, label: 'Thứ tư' },
        { value: 5, label: 'Thứ năm' },
        { value: 6, label: 'Thứ sáu' },
        { value: 7, label: 'Thứ bảy' },
        { value: 1, label: 'Chủ nhật' }
    ];

    return (
        <>
            <div style={classManagementStyles.modalBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={classManagementStyles.formGroup}>
                        <label style={classManagementStyles.formLabel}>
                            Lớp học <span style={classManagementStyles.required}>*</span>
                        </label>
                        <select
                            style={classManagementStyles.formInput}
                            value={formData.class_id}
                            onChange={(e) => handleInputChange('class_id', e.target.value)}
                        >
                            <option value="">Chọn lớp học</option>
                            {options.classes?.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                        {errors.class_id && <div style={classManagementStyles.formError}>{errors.class_id}</div>}
                    </div>

                    <div style={classManagementStyles.formGroup}>
                        <label style={classManagementStyles.formLabel}>
                            Môn học <span style={classManagementStyles.required}>*</span>
                        </label>
                        <select
                            style={classManagementStyles.formInput}
                            value={formData.subject_id}
                            onChange={(e) => handleInputChange('subject_id', e.target.value)}
                        >
                            <option value="">Chọn môn học</option>
                            {options.subjects?.map(subject => (
                                <option key={subject.id} value={subject.id}>{subject.name}</option>
                            ))}
                        </select>
                        {errors.subject_id && <div style={classManagementStyles.formError}>{errors.subject_id}</div>}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={classManagementStyles.formGroup}>
                        <label style={classManagementStyles.formLabel}>
                            Giáo viên <span style={classManagementStyles.required}>*</span>
                        </label>
                        <select
                            style={classManagementStyles.formInput}
                            value={formData.teacher_id}
                            onChange={(e) => handleInputChange('teacher_id', e.target.value)}
                        >
                            <option value="">Chọn giáo viên</option>
                            {options.teachers?.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>
                            ))}
                        </select>
                        {errors.teacher_id && <div style={classManagementStyles.formError}>{errors.teacher_id}</div>}
                    </div>

                    <div style={classManagementStyles.formGroup}>
                        <label style={classManagementStyles.formLabel}>
                            Thứ <span style={classManagementStyles.required}>*</span>
                        </label>
                        <select
                            style={classManagementStyles.formInput}
                            value={formData.weekday}
                            onChange={(e) => handleInputChange('weekday', e.target.value)}
                        >
                            <option value="">Chọn thứ</option>
                            {weekdayOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                        {errors.weekday && <div style={classManagementStyles.formError}>{errors.weekday}</div>}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={classManagementStyles.formGroup}>
                        <label style={classManagementStyles.formLabel}>
                            Giờ bắt đầu <span style={classManagementStyles.required}>*</span>
                        </label>
                        <input
                            type="time"
                            style={classManagementStyles.formInput}
                            value={formData.start_time}
                            onChange={(e) => handleInputChange('start_time', e.target.value)}
                        />
                        {errors.start_time && <div style={classManagementStyles.formError}>{errors.start_time}</div>}
                    </div>

                    <div style={classManagementStyles.formGroup}>
                        <label style={classManagementStyles.formLabel}>
                            Giờ kết thúc <span style={classManagementStyles.required}>*</span>
                        </label>
                        <input
                            type="time"
                            style={classManagementStyles.formInput}
                            value={formData.end_time}
                            onChange={(e) => handleInputChange('end_time', e.target.value)}
                        />
                        {errors.end_time && <div style={classManagementStyles.formError}>{errors.end_time}</div>}
                    </div>
                </div>
            </div>

            <div style={classManagementStyles.modalFooter}>
                <button
                    style={{ ...classManagementStyles.btn, ...classManagementStyles.btnOutline }}
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Hủy
                </button>
                <button
                    style={{ ...classManagementStyles.btn, ...classManagementStyles.btnPrimary }}
                    onClick={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-save"></i>
                            {schedule ? 'Cập nhật' : 'Tạo lịch học'}
                        </>
                    )}
                </button>
            </div>
        </>
    );
};

// Weekly Schedule View Component
const WeeklyScheduleView = ({ schedules }) => {
    const weekdays = [
        { id: 2, name: 'Thứ hai' },
        { id: 3, name: 'Thứ ba' },
        { id: 4, name: 'Thứ tư' },
        { id: 5, name: 'Thứ năm' },
        { id: 6, name: 'Thứ sáu' },
        { id: 7, name: 'Thứ bảy' },
        { id: 1, name: 'Chủ nhật' }
    ];

    const timeSlots = [
        '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
    ];

    const getSchedulesForDay = (weekday) => {
        return schedules.filter(s => s.weekday === weekday);
    };

    return (
        <div style={{
            background: '#fff',
            borderRadius: '1rem',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
        }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: 0, color: '#1e293b' }}>Lịch học trong tuần</h3>
            </div>

            <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={{
                                padding: '0.75rem',
                                textAlign: 'left',
                                fontWeight: '600',
                                minWidth: '80px',
                                borderRight: '1px solid #e2e8f0'
                            }}>
                                Giờ
                            </th>
                            {weekdays.map(day => (
                                <th key={day.id} style={{
                                    padding: '0.75rem',
                                    textAlign: 'center',
                                    fontWeight: '600',
                                    minWidth: '140px',
                                    borderRight: '1px solid #e2e8f0'
                                }}>
                                    {day.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map((time, timeIndex) => (
                            <tr key={time} style={{
                                borderBottom: timeIndex < timeSlots.length - 1 ? '1px solid #e2e8f0' : 'none'
                            }}>
                                <td style={{
                                    padding: '0.5rem 0.75rem',
                                    fontWeight: '500',
                                    fontSize: '0.875rem',
                                    color: '#64748b',
                                    borderRight: '1px solid #e2e8f0',
                                    background: '#f8fafc'
                                }}>
                                    {time}
                                </td>
                                {weekdays.map(day => {
                                    const daySchedules = getSchedulesForDay(day.id);
                                    const currentSchedule = daySchedules.find(s =>
                                        s.start_time <= time && s.end_time > time
                                    );
                                    return (
                                        <td key={day.id} style={{
                                            padding: '0.25rem',
                                            borderRight: '1px solid #e2e8f0',
                                            verticalAlign: 'top',
                                            position: 'relative'
                                        }}>
                                            {currentSchedule && currentSchedule.start_time === time && (
                                                <div style={{
                                                    background: '#6366f1',
                                                    color: 'white',
                                                    padding: '0.5rem',
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.75rem',
                                                    textAlign: 'center',
                                                    margin: '0.125rem'
                                                }}>
                                                    <div style={{ fontWeight: '600' }}>{currentSchedule.subject_name}</div>
                                                    <div style={{ opacity: 0.9 }}>{currentSchedule.class_name}</div>
                                                    <div style={{ opacity: 0.8 }}>{currentSchedule.teacher_name}</div>
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Main Component
const SubjectScheduleManagement = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState('subjects'); // 'subjects', 'schedules', 'weekly'

    // Subjects data
    const [subjects, setSubjects] = useState([]);
    const [filteredSubjects, setFilteredSubjects] = useState([]);

    // Schedules data
    const [schedules, setSchedules] = useState([]);
    const [filteredSchedules, setFilteredSchedules] = useState([]);
    const [scheduleOptions, setScheduleOptions] = useState({
        classes: [],
        subjects: [],
        teachers: []
    });

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [scheduleFilters, setScheduleFilters] = useState({
        class_id: '',
        subject_id: '',
        teacher_id: '',
        weekday: ''
    });

    // Modal states
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSubjectImportModal, setShowSubjectImportModal] = useState(false);
    const [showScheduleImportModal, setShowScheduleImportModal] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteType, setDeleteType] = useState(''); // 'subject' or 'schedule'
    const [modalLoading, setModalLoading] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [subjectTemplate, setSubjectTemplate] = useState(null);
    const [scheduleTemplate, setScheduleTemplate] = useState(null);

    const { notifications, showNotification, removeNotification } = useNotification();

    useEffect(() => {
        const checkPermission = () => {
            const allowedRoles = ['admin'];
            const userHasPermission = authService.hasPermission(allowedRoles);
            setHasPermission(userHasPermission);

            if (!userHasPermission) {
                showNotification("Bạn không có quyền truy cập trang này.", 'error');
                setLoading(false);
                return;
            }

            fetchData();
        };

        checkPermission();
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            // Try to fetch subject template from API
            try {
                const subjectResponse = await apiService.get('/subjects/template');
                setSubjectTemplate(subjectResponse.data);
            } catch (error) {
                console.log('Using fallback subject template');
                setSubjectTemplate(createSubjectTemplate());
            }

            // Try to fetch schedule template from API
            try {
                const scheduleResponse = await apiService.get('/subjects/schedules/template');
                setScheduleTemplate(scheduleResponse.data);
            } catch (error) {
                console.log('Using fallback schedule template');
                setScheduleTemplate(await createScheduleTemplate());
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            // Set fallback templates
            setSubjectTemplate(createSubjectTemplate());
            setScheduleTemplate(await createScheduleTemplate());
        }
    };

    const createSubjectTemplate = () => {
        return {
            template: [
                { name: 'Toán rời rạc' },
                { name: 'Bảo mật thông tin' },
            ],
            instructions: {
                required_fields: ['name'],
                field_descriptions: {
                    name: 'Tên môn học (bắt buộc, duy nhất)'
                },
                notes: [
                    'Tên môn học phải là duy nhất trong hệ thống',
                    'Tên môn học không được để trống',
                    'Xóa các dòng ví dụ trước khi import',
                    'Tối đa 100 môn học mỗi lần import',
                    'Chỉ hỗ trợ file Excel (.xlsx, .xls)'
                ]
            }
        };
    };

    const createScheduleTemplate = async () => {
        // Get current data for realistic examples
        let availableClasses = [];
        let availableSubjects = [];
        let availableTeachers = [];

        try {
            // Try to get current data for examples
            if (scheduleOptions.classes.length > 0) {
                availableClasses = scheduleOptions.classes.slice(0, 3).map(c => c.name);
            }
            if (scheduleOptions.subjects.length > 0) {
                availableSubjects = scheduleOptions.subjects.slice(0, 3).map(s => s.name);
            }
            if (scheduleOptions.teachers.length > 0) {
                availableTeachers = scheduleOptions.teachers.slice(0, 3).map(t => t.full_name);
            }
        } catch (error) {
            console.log('Using default examples for schedule template');
        }

        return {
            template: [
                {
                    class_name: availableClasses[0] || 'Lớp 10A1',
                    subject_name: availableSubjects[0] || 'Toán học',
                    teacher_name: availableTeachers[0] || 'Nguyễn Văn A',
                    weekday: 1,
                    start_time: '08:00:00',
                    end_time: '09:30:00'
                },
                {
                    class_name: availableClasses[1] || 'Lớp 10A2',
                    subject_name: availableSubjects[1] || 'Vật lý',
                    teacher_name: availableTeachers[1] || 'Nguyễn Văn A',
                    weekday: 2,
                    start_time: '10:00:00',
                    end_time: '11:30:00'
                },
                {
                    class_name: availableClasses[2] || 'Lớp 10A3',
                    subject_name: availableSubjects[2] || 'Hóa học',
                    teacher_name: availableTeachers[2] || 'Lê Văn C',
                    weekday: 3,
                    start_time: '13:30:00',
                    end_time: '15:00:00'
                }
            ],
            instructions: {
                required_fields: ['class_name', 'subject_name', 'teacher_name', 'weekday', 'start_time', 'end_time'],
                field_descriptions: {
                    class_name: 'Tên lớp học (phải khớp chính xác với lớp đã có)',
                    subject_name: 'Tên môn học (phải khớp chính xác với môn học đã có)',
                    teacher_name: 'Họ tên giáo viên (phải khớp chính xác với giáo viên đã có)',
                    weekday: 'Thứ trong tuần (0=Chủ nhật, 1=Thứ hai, 2=Thứ ba, 3=Thứ tư, 4=Thứ năm, 5=Thứ sáu, 6=Thứ bảy)',
                    start_time: 'Giờ bắt đầu (định dạng HH:MM:SS, ví dụ: 08:00:00)',
                    end_time: 'Giờ kết thúc (định dạng HH:MM:SS, ví dụ: 09:30:00)'
                },
                notes: [
                    'Tất cả lớp học, môn học và giáo viên phải đã tồn tại trong hệ thống',
                    'Không được có xung đột thời gian cho cùng lớp trong cùng ngày',
                    'Giờ bắt đầu phải nhỏ hơn giờ kết thúc',
                    'Weekday phải là số từ 0 đến 6',
                    'Thời gian phải đúng định dạng HH:MM:SS (24 giờ)',
                    'Xóa các dòng ví dụ trước khi import',
                    'Tối đa 50 lịch học mỗi lần import',
                    'Chỉ hỗ trợ file Excel (.xlsx, .xls)'
                ],
                examples: {
                    weekdays: [
                        '0 = Chủ nhật',
                        '1 = Thứ hai',
                        '2 = Thứ ba',
                        '3 = Thứ tư',
                        '4 = Thứ năm',
                        '5 = Thứ sáu',
                        '6 = Thứ bảy'
                    ],
                    time_format: [
                        '08:00:00 (8 giờ sáng)',
                        '13:30:00 (1 giờ 30 chiều)',
                        '15:45:00 (3 giờ 45 chiều)'
                    ]
                }
            },
            available_data: {
                classes: availableClasses.length > 0 ? availableClasses : ['Lớp 10A1', 'Lớp 10A2', 'Lớp 11A1'],
                subjects: availableSubjects.length > 0 ? availableSubjects : ['Toán học', 'Vật lý', 'Hóa học'],
                teachers: availableTeachers.length > 0 ? availableTeachers : ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C']
            }
        };
    };

    const handleSubjectImport = (result) => {
        console.log('Subject import result:', result);
        const successCount = result.summary?.success || 0;
        showNotification(`Import hoàn tất! ${successCount} môn học được import thành công.`, 'success');
        fetchSubjects(); // Refresh subjects list
    };

    const handleImportFile = async (subjectsData) => {
        try {
            const result = await apiService.importSubjects(subjectsData);
            handleSubjectImport(result);
        } catch (error) {
            console.error('Subject import error:', error);
            showNotification('Có lỗi xảy ra khi import môn học.', 'error');
        }
    };


    const handleScheduleImport = (result) => {
        console.log('Schedule import result:', result);
        const successCount = result.summary?.success || 0;
        showNotification(`Import hoàn tất! ${successCount} lịch học được import thành công.`, 'success');
        fetchSchedules(); // Refresh schedules list
    };

    const handleImportSchduleFile = async (schedulesData) => {
        try {
            const result = await apiService.importSchedules(schedulesData);
            handleScheduleImport(result);
        } catch (error) {
            console.error('Schedule import error:', error);
            showNotification('Có lỗi khi import lịch học.', 'error');
        }
    };


    // Download Subject Template Excel
    const downloadSubjectTemplate = () => {
        try {
            const template = subjectTemplate || createSubjectTemplate();

            // Create main template sheet
            const ws = XLSX.utils.json_to_sheet(template.template);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Môn học');

            // Create instructions sheet
            const instructionsData = [
                ['HƯỚNG DẪN IMPORT MÔN HỌC'],
                [''],
                ['1. CÁC TRƯỜNG BẮT BUỘC:'],
                ...template.instructions.required_fields.map(field => [`   - ${field}`]),
                [''],
                ['2. MÔ TẢ CÁC TRƯỜNG:'],
                ...Object.entries(template.instructions.field_descriptions || {}).map(([field, desc]) => [`   ${field}: ${desc}`]),
                [''],
                ['3. GHI CHÚ QUAN TRỌNG:'],
                ...template.instructions.notes.map(note => [`   - ${note}`]),
                [''],
                ['4. VÍ DỤ DỮ LIỆU:'],
                ['   Xem sheet "Môn học" để tham khảo format dữ liệu'],
                [''],
                ['5. CÁCH SỬ DỤNG:'],
                ['   - Xóa các dòng ví dụ trong sheet "Môn học"'],
                ['   - Nhập dữ liệu thực tế của bạn'],
                ['   - Lưu file và import vào hệ thống'],
                [''],
                ['Chúc bạn import thành công! 🎉']
            ];

            const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
            XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Hướng dẫn');

            // Download file
            XLSX.writeFile(wb, 'Template_Mon_Hoc.xlsx');
            showNotification('Đã tải template môn học thành công!', 'success');
        } catch (error) {
            console.error('Error downloading subject template:', error);
            showNotification('Lỗi khi tải template môn học', 'error');
        }
    };

    // Download Schedule Template Excel
    const downloadScheduleTemplate = async () => {
        try {
            const template = scheduleTemplate || await createScheduleTemplate();

            // Create main template sheet
            const ws = XLSX.utils.json_to_sheet(template.template);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Lịch học');

            // Create instructions sheet
            const instructionsData = [
                ['HƯỚNG DẪN IMPORT LỊCH HỌC'],
                [''],
                ['1. CÁC TRƯỜNG BẮT BUỘC:'],
                ...template.instructions.required_fields.map(field => [`   - ${field}`]),
                [''],
                ['2. MÔ TẢ CÁC TRƯỜNG:'],
                ...Object.entries(template.instructions.field_descriptions || {}).map(([field, desc]) => [`   ${field}: ${desc}`]),
                [''],
                ['3. VÍ DỤ WEEKDAY:'],
                ...template.instructions.examples.weekdays.map(example => [`   ${example}`]),
                [''],
                ['4. VÍ DỤ THỜI GIAN:'],
                ...template.instructions.examples.time_format.map(example => [`   ${example}`]),
                [''],
                ['5. GHI CHÚ QUAN TRỌNG:'],
                ...template.instructions.notes.map(note => [`   - ${note}`]),
                [''],
                ['6. CÁCH SỬ DỤNG:'],
                ['   - Xóa các dòng ví dụ trong sheet "Lịch học"'],
                ['   - Nhập dữ liệu thực tế của bạn'],
                ['   - Đảm bảo tên lớp, môn học, giáo viên đã tồn tại'],
                ['   - Lưu file và import vào hệ thống'],
                [''],
                ['Chúc bạn import thành công! 🎉']
            ];

            const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
            XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Hướng dẫn');

            // Create available data sheet
            const availableDataSheet = [
                ['DỮ LIỆU CÓ SẴN TRONG HỆ THỐNG'],
                [''],
                ['DANH SÁCH LỚP HỌC:'],
                ...template.available_data.classes.map(cls => [`   - ${cls}`]),
                [''],
                ['DANH SÁCH MÔN HỌC:'],
                ...template.available_data.subjects.map(subject => [`   - ${subject}`]),
                [''],
                ['DANH SÁCH GIÁO VIÊN:'],
                ...template.available_data.teachers.map(teacher => [`   - ${teacher}`]),
                [''],
                ['LƯU Ý: Dữ liệu trong file import phải khớp chính xác với danh sách trên']
            ];

            const dataSheet = XLSX.utils.aoa_to_sheet(availableDataSheet);
            XLSX.utils.book_append_sheet(wb, dataSheet, 'Dữ liệu có sẵn');

            // Download file
            XLSX.writeFile(wb, 'Template_Lich_Hoc.xlsx');
            showNotification('Đã tải template lịch học thành công!', 'success');
        } catch (error) {
            console.error('Error downloading schedule template:', error);
            showNotification('Lỗi khi tải template lịch học', 'error');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchSubjects(),
                fetchSchedules(),
                fetchScheduleOptions()
            ]);

            // Refresh schedule template with real data after fetching options
            if (scheduleOptions.classes.length > 0 || scheduleOptions.subjects.length > 0 || scheduleOptions.teachers.length > 0) {
                try {
                    const updatedScheduleTemplate = await createScheduleTemplate();
                    setScheduleTemplate(updatedScheduleTemplate);
                } catch (error) {
                    console.log('Could not update schedule template with real data');
                }
            }
        } catch (error) {
            console.error('Fetch data error:', error);
            showNotification('Lỗi khi tải dữ liệu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await apiService.getSubjects();
            if (response.success) {
                setSubjects(response.data.subjects || []);
            }
        } catch (error) {
            console.error('Fetch subjects error:', error);
        }
    };

    const fetchSchedules = async () => {
        try {
            const response = await apiService.getSchedules();
            if (response.success) {
                setSchedules(response.data.schedules || []);
            }
        } catch (error) {
            console.error('Fetch schedules error:', error);
        }
    };

    const fetchScheduleOptions = async () => {
        try {
            const response = await apiService.getScheduleOptions();
            if (response.success) {
                setScheduleOptions(response.data);
            }
        } catch (error) {
            console.error('Fetch schedule options error:', error);
        }
    };

    // Apply filters
    useEffect(() => {
        // Filter subjects
        let filteredSubjs = subjects.filter(subject =>
            !searchQuery || subject.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredSubjects(filteredSubjs);

        // Filter schedules
        let filteredScheds = schedules.filter(schedule => {
            const matchesSearch = !searchQuery ||
                schedule.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                schedule.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                schedule.teacher_name.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesClass = !scheduleFilters.class_id ||
                schedule.class_name === scheduleFilters.class_id;

            const matchesSubject = !scheduleFilters.subject_id ||
                schedule.subject_name.toLowerCase() === scheduleFilters.subject_id.toLowerCase();

            const matchesTeacher = !scheduleFilters.teacher_id ||
                schedule.teacher_name.toLowerCase() === scheduleFilters.teacher_id.toLowerCase() ||
                schedule.teacher_id === parseInt(scheduleFilters.teacher_id);

            const matchesWeekday = !scheduleFilters.weekday ||
                schedule.weekday === parseInt(scheduleFilters.weekday);

            return matchesSearch && matchesClass && matchesSubject && matchesTeacher && matchesWeekday;
        });
        setFilteredSchedules(filteredScheds);
    }, [subjects, schedules, searchQuery, scheduleFilters]);

    // Calculate statistics
    const statistics = {
        totalSubjects: subjects.length,
        totalSchedules: schedules.length,
        totalTeachers: scheduleOptions.teachers.length,
        totalClasses: scheduleOptions.classes.length
    };

    const statsConfig = [
        { title: 'Tổng môn học', value: statistics.totalSubjects, icon: 'fas fa-book', color: '#3b82f6', change: '+2' },
        { title: 'Tổng lịch học', value: statistics.totalSchedules, icon: 'fas fa-calendar-alt', color: '#10b981', change: '+5' },
        { title: 'Giáo viên', value: statistics.totalTeachers, icon: 'fas fa-chalkboard-teacher', color: '#f59e0b', change: '+1' },
        { title: 'Lớp học', value: statistics.totalClasses, icon: 'fas fa-users', color: '#8b5cf6', change: '+3' }
    ];

    // Handle actions
    const handleSaveSubject = async (formData) => {
        setModalLoading(true);
        try {
            let response;
            if (currentItem) {
                response = await apiService.updateSubject(currentItem.id, formData.name);
            } else {
                response = await apiService.createSubject(formData.name);
            }

            if (response.success) {
                showNotification(
                    currentItem ? 'Cập nhật môn học thành công!' : 'Thêm môn học thành công!',
                    'success'
                );
                setShowSubjectModal(false);
                setCurrentItem(null);
                fetchSubjects();
                fetchScheduleOptions(); // Refresh options
            } else {
                showNotification(response.message || 'Có lỗi xảy ra khi lưu môn học', 'error');
            }
        } catch (error) {
            console.error('Save subject error:', error);
            showNotification('Có lỗi xảy ra khi lưu môn học: ' + error.message, 'error');
        } finally {
            setModalLoading(false);
        }
    };

    const handleSaveSchedule = async (formData) => {
        setModalLoading(true);
        try {
            let response;
            if (currentItem) {
                response = await apiService.updateSchedule(currentItem.id, formData);
            } else {
                response = await apiService.createSchedule(formData);
            }

            if (response.success) {
                showNotification(
                    currentItem ? 'Cập nhật lịch học thành công!' : 'Thêm lịch học thành công!',
                    'success'
                );
                setShowScheduleModal(false);
                setCurrentItem(null);
                fetchSchedules();
            } else {
                showNotification(response.message || 'Có lỗi xảy ra khi lưu lịch học', 'error');
            }
        } catch (error) {
            console.error('Save schedule error:', error);
            showNotification('Có lỗi xảy ra khi lưu lịch học: ' + error.message, 'error');
        } finally {
            setModalLoading(false);
        }
    };

    const handleEditSubject = (subject) => {
        setCurrentItem(subject);
        setShowSubjectModal(true);
    };

    const handleEditSchedule = (schedule) => {
        setCurrentItem(schedule);
        setShowScheduleModal(true);
    };

    const handleDeleteSubject = (subject) => {
        setDeleteTarget(subject);
        setDeleteType('subject');
        setShowDeleteModal(true);
    };

    const handleDeleteSchedule = (schedule) => {
        setDeleteTarget(schedule);
        setDeleteType('schedule');
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        setModalLoading(true);
        try {
            let response;
            if (deleteType === 'subject') {
                response = await apiService.deleteSubject(deleteTarget.id);
            } else {
                response = await apiService.deleteSchedule(deleteTarget.id);
            }

            if (response.success) {
                showNotification(
                    deleteType === 'subject' ? 'Xóa môn học thành công!' : 'Xóa lịch học thành công!',
                    'success'
                );
                setShowDeleteModal(false);
                setDeleteTarget(null);
                setDeleteType('');

                if (deleteType === 'subject') {
                    fetchSubjects();
                    fetchScheduleOptions();
                } else {
                    fetchSchedules();
                }
            } else {
                showNotification(response.message || 'Có lỗi xảy ra khi xóa', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showNotification('Có lỗi xảy ra khi xóa: ' + error.message, 'error');
        } finally {
            setModalLoading(false);
        }
    };

    const handleAddSubject = () => {
        setCurrentItem(null);
        setShowSubjectModal(true);
    };

    const handleAddSchedule = () => {
        setCurrentItem(null);
        setShowScheduleModal(true);
    };

    const resetFilters = () => {
        setSearchQuery('');
        setScheduleFilters({
            class_id: '',
            subject_id: '',
            teacher_id: '',
            weekday: ''
        });
    };

    const mainContentStyle = {
        ...styles.mainContent,
        ...(sidebarCollapsed ? styles.mainContentCollapsed : {})
    };

    if (!hasPermission) {
        return (
            <div style={styles.appContainer}>
                <Sidebar
                    isCollapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    activePage="subjects"
                />
                <main style={mainContentStyle}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                        background: '#f8fafc'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <i className="fas fa-lock" style={{ fontSize: '4rem', color: '#64748b', marginBottom: '1rem' }}></i>
                            <h2 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>Không có quyền truy cập</h2>
                            <p style={{ color: '#64748b' }}>Bạn không có quyền truy cập trang quản lý môn học và lịch học.</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div style={styles.appContainer}>
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

            {/* Sidebar */}
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                activePage="subjects"
            />

            {/* Main Content */}
            <main style={mainContentStyle}>
                {/* Header */}
                <header style={styles.header}>
                    <div style={styles.headerLeft}>
                        <h1 style={styles.pageTitle}>
                            <i className="fas fa-book-open" style={{ color: '#6366f1', marginRight: '1rem' }}></i>
                            Quản lý môn học & Lịch học
                        </h1>
                        <p style={styles.pageSubtitle}>Quản lý thông tin môn học và phân bổ lịch học cho các lớp</p>
                    </div>
                    <div style={styles.headerRight}>
                        <div style={styles.headerActions}>
                            <button
                                style={styles.actionBtn}
                                onClick={() => fetchData()}
                                title="Làm mới dữ liệu"
                            >
                                <i className="fas fa-sync-alt"></i>
                            </button>

                            <button
                                style={styles.actionBtn}
                                onClick={() => showNotification('Đang xuất dữ liệu...', 'info')}
                                title="Xuất Excel"
                            >
                                <i className="fas fa-file-export"></i>
                            </button>
                        </div>
                    </div>
                </header>

                <div style={styles.dashboardContent}>
                    <LoadingOverlay isLoading={loading} />

                    {/* Statistics */}
                    <section style={{ marginBottom: '2rem' }}>
                        <div style={styles.statsGrid}>
                            {statsConfig.map((stat, index) => (
                                <StatsCard key={index} {...stat} />
                            ))}
                        </div>
                    </section>

                    {/* Tab Navigation */}
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '2rem',
                        borderBottom: '1px solid #e2e8f0'
                    }}>
                        {[
                            { id: 'subjects', label: 'Môn học', icon: 'fas fa-book' },
                            { id: 'schedules', label: 'Lịch học', icon: 'fas fa-calendar-alt' },
                            //{ id: 'weekly', label: 'Lịch tuần', icon: 'fas fa-calendar-week' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    border: 'none',
                                    background: currentTab === tab.id ? '#6366f1' : 'transparent',
                                    color: currentTab === tab.id ? 'white' : '#64748b',
                                    borderRadius: '0.5rem 0.5rem 0 0',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => setCurrentTab(tab.id)}
                            >
                                <i className={tab.icon}></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Subjects Tab */}
                    {currentTab === 'subjects' && (
                        <>
                            {/* Filter Bar */}
                            <div style={classManagementStyles.filterBar}>
                                <div style={classManagementStyles.searchSection}>
                                    <div style={classManagementStyles.searchBox}>
                                        <i className="fas fa-search" style={classManagementStyles.searchIcon}></i>
                                        <input
                                            type="text"
                                            style={classManagementStyles.searchInput}
                                            placeholder="Tìm kiếm môn học..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        {searchQuery && (
                                            <button
                                                style={classManagementStyles.clearSearch}
                                                onClick={() => setSearchQuery('')}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div style={classManagementStyles.filterSection}>
                                    <button
                                        style={{ ...classManagementStyles.btn, ...classManagementStyles.btnSecondary, marginRight: '10px' }}
                                        onClick={() => setShowSubjectImportModal(true)}
                                    >
                                        <i className="fas fa-file-import"></i>
                                        Import Excel
                                    </button>
                                    <button
                                        style={{ ...classManagementStyles.btn, ...classManagementStyles.btnPrimary }}
                                        onClick={handleAddSubject}
                                    >
                                        <i className="fas fa-plus"></i>
                                        Thêm môn học
                                    </button>
                                </div>
                            </div>

                            {/* Subjects Grid */}
                            <section>
                                <div style={styles.sectionHeader}>
                                    <h2 style={styles.sectionTitle}>
                                        <i className="fas fa-book" style={styles.sectionIcon}></i>
                                        Danh sách môn học ({filteredSubjects.length})
                                    </h2>
                                </div>

                                {filteredSubjects.length === 0 && !loading ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '4rem 2rem',
                                        background: 'white',
                                        borderRadius: '1rem',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            background: '#f8fafc',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 1.5rem',
                                            fontSize: '2rem',
                                            color: '#94a3b8'
                                        }}>
                                            <i className="fas fa-book"></i>
                                        </div>
                                        <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>
                                            {searchQuery ? 'Không tìm thấy môn học nào' : 'Chưa có môn học nào'}
                                        </h3>
                                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                                            {searchQuery
                                                ? 'Thử điều chỉnh từ khóa tìm kiếm để xem kết quả khác'
                                                : 'Bắt đầu bằng cách tạo môn học đầu tiên của bạn'
                                            }
                                        </p>
                                        <button
                                            style={{ ...classManagementStyles.btn, ...classManagementStyles.btnPrimary }}
                                            onClick={handleAddSubject}
                                        >
                                            <i className="fas fa-plus"></i>
                                            Thêm môn học đầu tiên
                                        </button>
                                    </div>
                                ) : (
                                    <div style={classManagementStyles.classesGrid}>
                                        {filteredSubjects.map(subject => (
                                            <SubjectCard
                                                key={subject.id}
                                                subject={subject}
                                                onEdit={handleEditSubject}
                                                onDelete={handleDeleteSubject}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        </>
                    )}

                    {/* Schedules Tab */}
                    {currentTab === 'schedules' && (
                        <>
                            {/* Filter Bar */}
                            <div style={classManagementStyles.filterBar}>
                                <div style={classManagementStyles.searchSection}>
                                    <div style={classManagementStyles.searchBox}>
                                        <i className="fas fa-search" style={classManagementStyles.searchIcon}></i>
                                        <input
                                            type="text"
                                            style={classManagementStyles.searchInput}
                                            placeholder="Tìm kiếm lịch học..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        {searchQuery && (
                                            <button
                                                style={classManagementStyles.clearSearch}
                                                onClick={() => setSearchQuery('')}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div style={classManagementStyles.filterSection}>
                                    <button
                                        style={{ ...classManagementStyles.btn, ...classManagementStyles.btnSecondary, marginRight: '10px' }}
                                        onClick={() => setShowScheduleImportModal(true)}
                                    >
                                        <i className="fas fa-file-import"></i>
                                        Import Excel
                                    </button>
                                    <button
                                        style={{ ...classManagementStyles.btn, ...classManagementStyles.btnPrimary }}
                                        onClick={handleAddSchedule}
                                    >
                                        <i className="fas fa-plus"></i>
                                        Thêm lịch học
                                    </button>
                                </div>
                            </div>

                            {/* Schedule Filters */}
                            <div style={{
                                background: '#fff',
                                padding: '1.5rem',
                                borderRadius: '1rem',
                                border: '1px solid #e2e8f0',
                                marginBottom: '2rem'
                            }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '1rem',
                                    alignItems: 'end'
                                }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                            Lớp học
                                        </label>
                                        <select
                                            style={classManagementStyles.formInput}
                                            value={scheduleFilters.class_id}
                                            onChange={(e) => setScheduleFilters(prev => ({ ...prev, class_id: e.target.value }))}
                                        >
                                            <option value="">Tất cả lớp</option>
                                            {scheduleOptions.classes?.map(cls => (
                                                <option key={cls.id} value={cls.name}>{cls.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                            Môn học
                                        </label>
                                        <select
                                            style={classManagementStyles.formInput}
                                            value={scheduleFilters.subject_id}
                                            onChange={(e) => setScheduleFilters(prev => ({ ...prev, subject_id: e.target.value }))}
                                        >
                                            <option value="">Tất cả môn</option>
                                            {scheduleOptions.subjects?.map(subject => (
                                                <option key={subject.id} value={subject.name}>{subject.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                            Giáo viên
                                        </label>
                                        <select
                                            style={classManagementStyles.formInput}
                                            value={scheduleFilters.teacher_id}
                                            onChange={(e) => setScheduleFilters(prev => ({ ...prev, teacher_id: e.target.value }))}
                                        >
                                            <option value="">Tất cả giáo viên</option>
                                            {scheduleOptions.teachers?.map(teacher => (
                                                <option key={teacher.id} value={teacher.full_name}>{teacher.full_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                            Thứ
                                        </label>
                                        <select
                                            style={classManagementStyles.formInput}
                                            value={scheduleFilters.weekday}
                                            onChange={(e) => setScheduleFilters(prev => ({ ...prev, weekday: e.target.value }))}
                                        >
                                            <option value="">Tất cả</option>
                                            <option value="2">Thứ hai</option>
                                            <option value="3">Thứ ba</option>
                                            <option value="4">Thứ tư</option>
                                            <option value="5">Thứ năm</option>
                                            <option value="6">Thứ sáu</option>
                                            <option value="7">Thứ bảy</option>
                                            <option value="1">Chủ nhật</option>
                                        </select>
                                    </div>

                                    <div>
                                        <button
                                            style={{ ...classManagementStyles.btn, ...classManagementStyles.btnOutline }}
                                            onClick={resetFilters}
                                        >
                                            <i className="fas fa-undo"></i>
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Schedules Grid */}
                            <section>
                                <div style={styles.sectionHeader}>
                                    <h2 style={styles.sectionTitle}>
                                        <i className="fas fa-calendar-alt" style={styles.sectionIcon}></i>
                                        Danh sách lịch học ({filteredSchedules.length})
                                    </h2>
                                </div>

                                {filteredSchedules.length === 0 && !loading ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '4rem 2rem',
                                        background: 'white',
                                        borderRadius: '1rem',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            background: '#f8fafc',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 1.5rem',
                                            fontSize: '2rem',
                                            color: '#94a3b8'
                                        }}>
                                            <i className="fas fa-calendar-alt"></i>
                                        </div>
                                        <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>
                                            Không tìm thấy lịch học nào
                                        </h3>
                                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                                            Bắt đầu bằng cách tạo lịch học đầu tiên
                                        </p>
                                        <button
                                            style={{ ...classManagementStyles.btn, ...classManagementStyles.btnPrimary }}
                                            onClick={handleAddSchedule}
                                        >
                                            <i className="fas fa-plus"></i>
                                            Thêm lịch học đầu tiên
                                        </button>
                                    </div>
                                ) : (
                                    <div style={classManagementStyles.classesGrid}>
                                        {filteredSchedules.map(schedule => (
                                            <ScheduleCard
                                                key={schedule.id}
                                                schedule={schedule}
                                                onEdit={handleEditSchedule}
                                                onDelete={handleDeleteSchedule}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        </>
                    )}

                    {/* Weekly Schedule Tab
                    {currentTab === 'weekly' && (
                        <section>
                            <div style={styles.sectionHeader}>
                                <h2 style={styles.sectionTitle}>
                                    <i className="fas fa-calendar-week" style={styles.sectionIcon}></i>
                                    Lịch học trong tuần
                                </h2>
                            </div>
                            <WeeklyScheduleView schedules={schedules} />
                        </section>
                    )} */}
                </div>
            </main>

            {/* Subject Modal */}
            <Modal
                isOpen={showSubjectModal}
                onClose={() => !modalLoading && setShowSubjectModal(false)}
                title={currentItem ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
            >
                <SubjectForm
                    subject={currentItem}
                    onSave={handleSaveSubject}
                    onCancel={() => setShowSubjectModal(false)}
                    isLoading={modalLoading}
                />
            </Modal>

            {/* Schedule Modal */}
            <Modal
                isOpen={showScheduleModal}
                onClose={() => !modalLoading && setShowScheduleModal(false)}
                title={currentItem ? 'Chỉnh sửa lịch học' : 'Thêm lịch học mới'}
                size="large"
            >
                <ScheduleForm
                    schedule={currentItem}
                    onSave={handleSaveSchedule}
                    onCancel={() => setShowScheduleModal(false)}
                    isLoading={modalLoading}
                    options={scheduleOptions}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => !modalLoading && setShowDeleteModal(false)}
                title="Xác nhận xóa"
                size="small"
            >
                <div style={classManagementStyles.modalBody}>
                    <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem',
                            fontSize: '1.5rem'
                        }}>
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <p style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '1rem' }}>
                            Bạn có chắc chắn muốn xóa {deleteType === 'subject' ? 'môn học' : 'lịch học'}
                            <strong> "{deleteTarget?.name || deleteTarget?.subject_name}"</strong> không?
                        </p>
                        <small style={{ color: '#94a3b8' }}>
                            {deleteType === 'subject'
                                ? 'Tất cả lịch học liên quan sẽ bị xóa. Hành động này không thể hoàn tác!'
                                : 'Hành động này không thể hoàn tác!'
                            }
                        </small>
                    </div>
                </div>

                <div style={classManagementStyles.modalFooter}>
                    <button
                        style={{ ...classManagementStyles.btn, ...classManagementStyles.btnOutline }}
                        onClick={() => setShowDeleteModal(false)}
                        disabled={modalLoading}
                    >
                        Hủy
                    </button>
                    <button
                        style={{ ...classManagementStyles.btn, ...classManagementStyles.btnDanger }}
                        onClick={handleConfirmDelete}
                        disabled={modalLoading}
                    >
                        {modalLoading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Đang xóa...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-trash"></i>
                                Xóa {deleteType === 'subject' ? 'môn học' : 'lịch học'}
                            </>
                        )}
                    </button>
                </div>
            </Modal>

            {/* Subject Import Modal */}
            <ImportModal
                isOpen={showSubjectImportModal}
                onClose={() => setShowSubjectImportModal(false)}
                onImport={handleImportFile}
                isLoading={modalLoading}
                type="subjects"
                title="📚 Import Môn học từ Excel"
                templateData={subjectTemplate}
            />

            {/* Schedule Import Modal */}
            <ImportModal
                isOpen={showScheduleImportModal}
                onClose={() => setShowScheduleImportModal(false)}
                onImport={handleImportSchduleFile}
                isLoading={modalLoading}
                type="schedules"
                title="📅 Import Lịch học từ Excel"
                templateData={scheduleTemplate}
            />
        </div>
    );
};

export default SubjectScheduleManagement;