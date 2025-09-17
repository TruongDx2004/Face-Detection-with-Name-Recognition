import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import { AppLayout, Header } from '../../components/layout/AppLayout';

// Styles
const styles = {
    scheduleGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
    },
    scheduleCard: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s ease'
    },
    scheduleCardHover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
    },
    scheduleHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
    },
    scheduleSubject: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1a202c',
        marginBottom: '4px'
    },
    scheduleClass: {
        fontSize: '14px',
        color: '#64748b'
    },
    scheduleTime: {
        fontSize: '12px',
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        padding: '4px 8px',
        borderRadius: '6px',
        fontWeight: '500'
    },
    scheduleDetails: {
        marginTop: '16px'
    },
    scheduleDetailItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        fontSize: '14px',
        color: '#374151'
    },
    scheduleActions: {
        display: 'flex',
        gap: '8px',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid #e2e8f0'
    },
    button: {
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
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
    buttonWarning: {
        backgroundColor: '#f59e0b',
        color: '#ffffff'
    },
    section: {
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e2e8f0'
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#1a202c',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    filterContainer: {
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap'
    },
    filterSelect: {
        padding: '8px 12px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        fontSize: '14px',
        backgroundColor: '#ffffff'
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 20px',
        color: '#64748b'
    },
    emptyStateIcon: {
        fontSize: '48px',
        color: '#cbd5e1',
        marginBottom: '16px'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    modal: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
    },
    modalTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#1a202c'
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: '#64748b'
    },
    formGroup: {
        marginBottom: '16px'
    },
    formLabel: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '8px'
    },
    formInput: {
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        fontSize: '14px',
        transition: 'border-color 0.2s ease'
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        fontSize: '16px',
        color: '#64748b'
    },
    error: {
        padding: '20px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        color: '#dc2626',
        fontSize: '14px'
    }
};

// Helper Components
const LoadingSpinner = () => (
    <div style={styles.loading}>
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Đang tải dữ liệu...
    </div>
);

const ErrorMessage = ({ message, onRetry }) => (
    <div style={styles.error}>
        <i className="fas fa-exclamation-triangle" style={{ marginRight: '10px' }}></i>
        {message}
        {onRetry && (
            <button
                onClick={onRetry}
                style={{ ...styles.button, ...styles.buttonPrimary, marginLeft: '20px', padding: '8px 16px' }}
            >
                Thử lại
            </button>
        )}
    </div>
);

const ScheduleCard = ({ schedule, onStartSession, onViewDetails }) => {
    const [isHovered, setIsHovered] = useState(false);

    const daysOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    return (
        <div
            style={{
                ...styles.scheduleCard,
                ...(isHovered ? styles.scheduleCardHover : {})
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={styles.scheduleHeader}>
                <div>
                    <div style={styles.scheduleSubject}>{schedule.subject_name}</div>
                    <div style={styles.scheduleClass}>Lớp: {schedule.class_name}</div>
                </div>
                <div style={styles.scheduleTime}>
                    {daysOfWeek[schedule.weekday]}
                </div>
            </div>

            <div style={styles.scheduleDetails}>
                <div style={styles.scheduleDetailItem}>
                    <i className="fas fa-clock" style={{ color: '#64748b', width: '16px' }}></i>
                    {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                </div>

                {schedule.room && (
                    <div style={styles.scheduleDetailItem}>
                        <i className="fas fa-map-marker-alt" style={{ color: '#64748b', width: '16px' }}></i>
                        Phòng: {schedule.room}
                    </div>
                )}

                <div style={styles.scheduleDetailItem}>
                    <i className="fas fa-graduation-cap" style={{ color: '#64748b', width: '16px' }}></i>
                    Mã lớp: {schedule.course_section_code}
                </div>

                <div style={styles.scheduleDetailItem}>
                    <i className="fas fa-calendar-alt" style={{ color: '#64748b', width: '16px' }}></i>
                    {schedule.semester} - {schedule.academic_year}
                </div>

                {/* Auto-attendance info */}
                {(schedule.start_date || schedule.total_sessions) && (
                    <div style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        backgroundColor: '#f0f9ff',
                        borderRadius: '6px',
                        border: '1px solid #bae6fd'
                    }}>
                        <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#0369a1',
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <i className="fas fa-magic"></i>
                            Tự động tạo phiên điểm danh
                        </div>
                        {schedule.start_date && (
                            <div style={{ fontSize: '11px', color: '#0284c7', marginBottom: '2px' }}>
                                📅 Từ: {new Date(schedule.start_date).toLocaleDateString('vi-VN')}
                            </div>
                        )}
                        {schedule.total_sessions && (
                            <div style={{ fontSize: '11px', color: '#0284c7' }}>
                                📊 {schedule.total_sessions} buổi học
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div style={styles.scheduleActions}>
                <button
                    style={{ ...styles.button, ...styles.buttonSuccess, flex: 1 }}
                    onClick={() => onStartSession(schedule)}
                >
                    <i className="fas fa-play"></i>
                    Bắt đầu điểm danh
                </button>
                <button
                    style={{ ...styles.button, ...styles.buttonSecondary }}
                    onClick={() => onViewDetails(schedule)}
                >
                    <i className="fas fa-eye"></i>
                </button>
            </div>
        </div>
    );
};

const CreateScheduleModal = ({ isOpen, onClose, onSubmit, courseOptions }) => {
    const [formData, setFormData] = useState({
        course_section_id: '',
        weekday: '',
        start_time: '',
        end_time: '',
        room: '',
        start_date: '',
        total_sessions: 15
    });

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onSubmit({
                ...formData,
                course_section_id: parseInt(formData.course_section_id),
                weekday: parseInt(formData.weekday),
                start_time: formData.start_time + ':00',
                end_time: formData.end_time + ':00',
                total_sessions: parseInt(formData.total_sessions)
            });

            setFormData({
                course_section_id: '',
                weekday: '',
                start_time: '',
                end_time: '',
                room: '',
                start_date: '',
                total_sessions: 15
            });

            onClose();
        } catch (error) {
            console.error('Error creating schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const weekdays = [
        { value: 1, label: 'Thứ Hai' },
        { value: 2, label: 'Thứ Ba' },
        { value: 3, label: 'Thứ Tư' },
        { value: 4, label: 'Thứ Năm' },
        { value: 5, label: 'Thứ Sáu' },
        { value: 6, label: 'Thứ Bảy' },
        { value: 7, label: 'Chủ Nhật' }
    ];

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                    <h3 style={styles.modalTitle}>Tạo lịch dạy mới</h3>
                    <button style={styles.closeButton} onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Lớp học phần *</label>
                        <select
                            style={styles.formInput}
                            value={formData.course_section_id}
                            onChange={(e) => setFormData({ ...formData, course_section_id: e.target.value })}
                            required
                        >
                            <option value="">Chọn lớp học phần</option>
                            {courseOptions.map(course => (
                                <option key={course.id} value={course.id}>
                                    {course.name} - {course.class_name} ({course.subject_name})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Thứ trong tuần *</label>
                        <select
                            style={styles.formInput}
                            value={formData.weekday}
                            onChange={(e) => setFormData({ ...formData, weekday: e.target.value })}
                            required
                        >
                            <option value="">Chọn thứ</option>
                            {weekdays.map(day => (
                                <option key={day.value} value={day.value}>{day.label}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Giờ bắt đầu *</label>
                            <input
                                type="time"
                                style={styles.formInput}
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                required
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Giờ kết thúc *</label>
                            <input
                                type="time"
                                style={styles.formInput}
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Ngày bắt đầu học kỳ *</label>
                            <input
                                type="date"
                                style={styles.formInput}
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Số buổi học *</label>
                            <input
                                type="number"
                                style={styles.formInput}
                                value={formData.total_sessions}
                                onChange={(e) => setFormData({ ...formData, total_sessions: parseInt(e.target.value) || 15 })}
                                min="1"
                                max="30"
                                placeholder="1-30 buổi"
                                required
                            />
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Phòng học</label>
                        <input
                            type="text"
                            style={styles.formInput}
                            value={formData.room}
                            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                            placeholder="Ví dụ: A101, B205"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button
                            type="button"
                            style={{ ...styles.button, ...styles.buttonSecondary }}
                            onClick={onClose}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            style={{ ...styles.button, ...styles.buttonPrimary }}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Đang tạo...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-plus"></i>
                                    Tạo lịch dạy
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Main Component
const TeacherSchedules = () => {
    const navigate = useNavigate();
    const { notifications, showNotification, removeNotification } = useNotification();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [courseOptions, setCourseOptions] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filterWeekday, setFilterWeekday] = useState('all');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        loadSchedules();
        loadCourseOptions();
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);

        return () => clearInterval(timer);
    }, []);

    const loadSchedules = async () => {
        try {
            setLoading(true);
            setError(null);

            const profileRes = await ApiService.getProfile();
            if (profileRes.success) setCurrentUser(profileRes.data);
            
            const response = await ApiService.getSchedules({
                teacher_id: 'current',
                limit: 100
            });

            if (response.success) {
                setSchedules(response.data.schedules || []);
            } else {
                setError(response.message || 'Không thể tải danh sách lịch dạy');
            }
        } catch (err) {
            setError('Lỗi kết nối: ' + err.message);
            if (String(err.message).includes('401') || String(err.message).includes('Unauthorized')) {
                authService.logout();
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadCourseOptions = async () => {
        try {
            const response = await ApiService.getScheduleOptions();
            if (response.success) {
                setCourseOptions(response.data.courseSections || []);
            }
        } catch (err) {
            console.error('Error loading course options:', err);
        }
    };

    const handleCreateSchedule = async (scheduleData) => {
        try {
            const response = await ApiService.createSchedule(scheduleData);

            if (response.success) {
                showNotification('Tạo lịch dạy thành công!', 'success');
                await loadSchedules();
            } else {
                showNotification(`Lỗi: ${response.message}`, 'error');
            }
        } catch (err) {
            showNotification(`Lỗi tạo lịch dạy: ${err.message}`, 'error');
        }
    };

    const handleStartSession = async (schedule) => {
        try {
            const response = await ApiService.createAttendanceSession({
                course_section_id: schedule.course_section_id,
                session_date: new Date().toISOString().split('T')[0],
                session_name: `${schedule.subject_name} - ${new Date().toLocaleDateString('vi-VN')}`
            });

            if (response.success) {
                showNotification('Tạo phiên điểm danh thành công!', 'success');
                navigate('/teacher/attendance');
            } else {
                showNotification(`Lỗi: ${response.message}`, 'error');
            }
        } catch (err) {
            showNotification(`Lỗi tạo phiên điểm danh: ${err.message}`, 'error');
        }
    };

    const handleViewDetails = (schedule) => {
        navigate(`/teacher/classes/${schedule.class_id}`);
    };

    const handleLogout = () => {
        if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
            authService.logout();
            navigate('/');
        }
    };

    const filteredSchedules = useMemo(() => {
        if (filterWeekday === 'all') return schedules;
        return schedules.filter(schedule => schedule.weekday === parseInt(filterWeekday));
    }, [schedules, filterWeekday]);

    const breadcrumb = [
        { label: 'Bảng điều khiển', path: '/teacher' },
        { label: 'Lịch dạy' }
    ];

    if (loading) {
        return (
            <AppLayout
                user={currentUser}
                onLogout={handleLogout}
                currentTime={currentTime}
                title="Lịch dạy"
            >
                <LoadingSpinner />
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout
                user={currentUser}
                onLogout={handleLogout}
                currentTime={currentTime}
                title="Lịch dạy"
            >
                <ErrorMessage message={error} onRetry={loadSchedules} />
            </AppLayout>
        );
    }

    return (
        <AppLayout
            user={currentUser}
            onLogout={handleLogout}
            currentTime={currentTime}
            title="Lịch dạy"
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
                title="Quản lý lịch dạy"
                titleIcon="fas fa-calendar"
                showBack={true}
                onBack={() => navigate('/teacher')}
                breadcrumb={breadcrumb}
                actions={[
                    {
                        label: 'Tạo lịch mới',
                        icon: 'fas fa-plus',
                        onClick: () => setShowCreateModal(true)
                    },
                    {
                        label: 'Làm mới',
                        icon: 'fas fa-sync-alt',
                        onClick: loadSchedules
                    }
                ]}
            />

            {/* Main Content */}
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>
                        <i className="fas fa-calendar-week"></i>
                        Danh sách lịch dạy ({filteredSchedules.length})
                    </h2>
                </div>

                {/* Filters */}
                <div style={styles.filterContainer}>
                    <select
                        value={filterWeekday}
                        onChange={(e) => setFilterWeekday(e.target.value)}
                        style={styles.filterSelect}
                    >
                        <option value="all">Tất cả các ngày</option>
                        <option value="1">Thứ Hai</option>
                        <option value="2">Thứ Ba</option>
                        <option value="3">Thứ Tư</option>
                        <option value="4">Thứ Năm</option>
                        <option value="5">Thứ Sáu</option>
                        <option value="6">Thứ Bảy</option>
                        <option value="7">Chủ Nhật</option>
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#64748b' }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                        Hiển thị {filteredSchedules.length} lịch dạy
                    </div>
                </div>

                {/* Schedule Cards */}
                {filteredSchedules.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyStateIcon}>
                            <i className="fas fa-calendar-times"></i>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                            Chưa có lịch dạy nào
                        </div>
                        <div style={{ fontSize: '14px', marginBottom: '20px' }}>
                            Tạo lịch dạy mới để bắt đầu quản lý giờ học của bạn
                        </div>
                        <button
                            style={{ ...styles.button, ...styles.buttonPrimary }}
                            onClick={() => setShowCreateModal(true)}
                        >
                            <i className="fas fa-plus"></i>
                            Tạo lịch dạy đầu tiên
                        </button>
                    </div>
                ) : (
                    <div style={styles.scheduleGrid}>
                        {filteredSchedules.map(schedule => (
                            <ScheduleCard
                                key={schedule.id}
                                schedule={schedule}
                                onStartSession={handleStartSession}
                                onViewDetails={handleViewDetails}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create Schedule Modal */}
            <CreateScheduleModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateSchedule}
                courseOptions={courseOptions}
            />
        </AppLayout>
    );
};

export default TeacherSchedules;