import React, { useState, useEffect } from 'react';
import Notification from '../components/Notification';
import ImportModal from '../components/ImportModal';
import Sidebar from '../components/Sidebar';
import LoadingOverlay from '../components/LoadingOverlay';
import useNotification from '../hooks/useNotification';
import useTime from '../hooks/useTime';
import styles from '../components/styles';
import courseManagementStyles from '../styles/CourseManagementStyles';
import apiService from '../services/api-service';
import authService from '../services/auth-service';

// Schedule Card Component
const ScheduleCard = ({ scheduleData, onEditSchedule, onDeleteSchedule }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredAction, setHoveredAction] = useState(null);

  const cardStyle = {
    ...courseManagementStyles.courseCard,
    ...(isHovered ? courseManagementStyles.courseCardHover : {})
  };

  const getActionBtnStyle = (action, isDanger = false) => {
    const baseStyle = courseManagementStyles.courseActionBtn;
    if (hoveredAction === action) {
      return {
        ...baseStyle,
        ...(isDanger ? courseManagementStyles.courseActionBtnDanger : courseManagementStyles.courseActionBtnHover)
      };
    }
    return baseStyle;
  };

  const formatTime = (time) => {
    return time ? time.substring(0, 5) : '';
  };

  const getWeekdayName = (weekday) => {
    const days = ['', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    return days[weekday] || '';
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={courseManagementStyles.courseCardHeader}>
        <div style={courseManagementStyles.courseIcon}>
          <i className="fas fa-calendar-alt"></i>
        </div>
        <div style={courseManagementStyles.courseInfo}>
          <div style={courseManagementStyles.courseName}>
            {scheduleData.course_section_name}
          </div>
          <div style={courseManagementStyles.courseCode}>
            Mã: {scheduleData.course_section_code}
          </div>
          <div style={courseManagementStyles.courseDetails}>
            GV: {scheduleData.teacher_name || 'Chưa phân công'}
          </div>
          <div style={courseManagementStyles.courseDetails}>
            Lớp: {scheduleData.class_name || 'N/A'}
          </div>
        </div>
      </div>

      <div style={courseManagementStyles.courseCardBody}>
        <div style={courseManagementStyles.courseBadges}>
          <span style={{
            ...courseManagementStyles.courseBadge,
            ...courseManagementStyles.semesterBadge,
            background: '#3b82f6',
            color: 'white'
          }}>
            {getWeekdayName(scheduleData.weekday)}
          </span>
          <span style={{
            ...courseManagementStyles.courseBadge,
            ...courseManagementStyles.yearBadge,
            background: '#10b981',
            color: 'white'
          }}>
            {formatTime(scheduleData.start_time)} - {formatTime(scheduleData.end_time)}
          </span>
          {scheduleData.room && (
            <span style={{
              ...courseManagementStyles.courseBadge,
              ...courseManagementStyles.studentsBadge,
              background: '#f59e0b',
              color: 'white'
            }}>
              📍 {scheduleData.room}
            </span>
          )}
        </div>

        {/* Additional info for auto-attendance */}
        {(scheduleData.start_date || scheduleData.total_sessions) && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            backgroundColor: '#f8fafc', 
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              fontWeight: '600', 
              color: '#6366f1', 
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fas fa-calendar-check"></i>
              Tự động tạo phiên điểm danh
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {scheduleData.start_date && (
                <div style={{ marginBottom: '0.25rem' }}>
                  📅 Bắt đầu: {new Date(scheduleData.start_date).toLocaleDateString('vi-VN')}
                </div>
              )}
              {scheduleData.total_sessions && (
                <div>
                  📊 Tổng: {scheduleData.total_sessions} buổi học
                </div>
              )}
            </div>
          </div>
        )}

        <div style={courseManagementStyles.courseActions}>
          <button
            style={getActionBtnStyle('edit')}
            onClick={() => onEditSchedule(scheduleData)}
            onMouseEnter={() => setHoveredAction('edit')}
            onMouseLeave={() => setHoveredAction(null)}
          >
            <i className="fas fa-edit"></i>
            Sửa
          </button>
          <button
            style={getActionBtnStyle('delete', true)}
            onClick={() => onDeleteSchedule(scheduleData)}
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

// Weekly Schedule Component
const WeeklyScheduleView = ({ schedules }) => {
  const weekdays = [
    { key: 1, name: 'Thứ Hai' },
    { key: 2, name: 'Thứ Ba' },
    { key: 3, name: 'Thứ Tư' },
    { key: 4, name: 'Thứ Năm' },
    { key: 5, name: 'Thứ Sáu' },
    { key: 6, name: 'Thứ Bảy' },
    { key: 7, name: 'Chủ Nhật' }
  ];

  const groupSchedulesByWeekday = () => {
    const grouped = {};
    weekdays.forEach(day => {
      grouped[day.key] = schedules.filter(s => s.weekday === day.key)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return grouped;
  };

  const groupedSchedules = groupSchedulesByWeekday();

  const formatTime = (time) => time ? time.substring(0, 5) : '';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginTop: '2rem'
    }}>
      {weekdays.map(day => (
        <div key={day.key} style={{
          background: 'white',
          borderRadius: '1rem',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          <div style={{
            background: '#f8fafc',
            padding: '1rem',
            borderBottom: '1px solid #e2e8f0',
            fontWeight: '600',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <i className="fas fa-calendar-day" style={{ color: '#6366f1' }}></i>
            {day.name}
            <span style={{
              marginLeft: 'auto',
              background: '#e2e8f0',
              color: '#64748b',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.75rem'
            }}>
              {groupedSchedules[day.key].length} tiết
            </span>
          </div>

          <div style={{ padding: '1rem' }}>
            {groupedSchedules[day.key].length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#94a3b8'
              }}>
                <i className="fas fa-moon" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></i>
                <p>Không có lịch học</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {groupedSchedules[day.key].map(schedule => (
                  <div key={schedule.id} style={{
                    padding: '0.75rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    borderLeft: '4px solid #6366f1'
                  }}>
                    <div style={{
                      fontWeight: '600',
                      color: '#1e293b',
                      fontSize: '0.9rem',
                      marginBottom: '0.25rem'
                    }}>
                      {schedule.course_section_name}
                    </div>
                    <div style={{
                      color: '#64748b',
                      fontSize: '0.8rem',
                      marginBottom: '0.25rem'
                    }}>
                      {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      {schedule.room && (
                        <span style={{
                          background: '#dbeafe',
                          color: '#1d4ed8',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem'
                        }}>
                          <i className="fas fa-door-open"></i> {schedule.room}
                        </span>
                      )}
                      <span style={{
                        background: '#dcfce7',
                        color: '#166534',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem'
                      }}>
                        <i className="fas fa-users"></i> {schedule.class_name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, size = 'normal', children }) => {
  if (!isOpen) return null;

  const modalStyle = {
    ...courseManagementStyles.modal,
    ...(size === 'large' ? courseManagementStyles.modalLarge : {}),
    ...(size === 'small' ? { maxWidth: '400px' } : {})
  };

  return (
    <div style={courseManagementStyles.modalOverlay} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={courseManagementStyles.modalHeader}>
          <h3 style={courseManagementStyles.modalTitle}>{title}</h3>
          <button
            style={courseManagementStyles.modalClose}
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

// Schedule Form Component
const ScheduleForm = ({ scheduleData, onSave, onCancel, isLoading, courseSections, weekdays }) => {
  const [formData, setFormData] = useState({
    course_section_id: scheduleData?.course_section_id || '',
    weekday: scheduleData?.weekday || 1,
    start_time: scheduleData?.start_time?.substring(0, 8) || '08:00:00',
    end_time: scheduleData?.end_time?.substring(0, 8) || '09:30:00',
    room: scheduleData?.room || '',
    start_date: scheduleData?.start_date || '',
    total_sessions: scheduleData?.total_sessions || 15
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

    if (!formData.course_section_id) {
      newErrors.course_section_id = 'Vui lòng chọn lớp học phần';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Giờ bắt đầu không được để trống';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'Giờ kết thúc không được để trống';
    }

    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      newErrors.end_time = 'Giờ kết thúc phải sau giờ bắt đầu';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Ngày bắt đầu học kỳ không được để trống';
    } else {
      const startDate = new Date(formData.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        newErrors.start_date = 'Ngày bắt đầu phải từ hôm nay trở về sau';
      }
    }

    if (!formData.total_sessions || formData.total_sessions < 1 || formData.total_sessions > 30) {
      newErrors.total_sessions = 'Số buổi học phải từ 1 đến 30';
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
      <div style={courseManagementStyles.modalBody}>
        <div style={courseManagementStyles.formRow}>
          <div style={courseManagementStyles.formGroup}>
            <label style={courseManagementStyles.formLabel}>
              Lớp học phần <span style={courseManagementStyles.required}>*</span>
            </label>
            <select
              style={courseManagementStyles.formInput}
              value={formData.course_section_id}
              onChange={(e) => handleInputChange('course_section_id', e.target.value)}
            >
              <option value="">Chọn lớp học phần</option>
              {courseSections.map(cs => (
                <option key={cs.id} value={cs.id}>
                  {cs.name} - {cs.class_name}
                </option>
              ))}
            </select>
            {errors.course_section_id && <div style={courseManagementStyles.formError}>{errors.course_section_id}</div>}
          </div>

          <div style={courseManagementStyles.formGroup}>
            <label style={courseManagementStyles.formLabel}>
              Thứ trong tuần <span style={courseManagementStyles.required}>*</span>
            </label>
            <select
              style={courseManagementStyles.formInput}
              value={formData.weekday}
              onChange={(e) => handleInputChange('weekday', parseInt(e.target.value))}
            >
              {weekdays.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={courseManagementStyles.formRow}>
          <div style={courseManagementStyles.formGroup}>
            <label style={courseManagementStyles.formLabel}>
              Giờ bắt đầu <span style={courseManagementStyles.required}>*</span>
            </label>
            <input
              type="time"
              step="1"
              style={courseManagementStyles.formInput}
              value={formData.start_time}
              onChange={(e) => handleInputChange('start_time', e.target.value)}
            />

            {errors.start_time && <div style={courseManagementStyles.formError}>{errors.start_time}</div>}
          </div>

          <div style={courseManagementStyles.formGroup}>
            <label style={courseManagementStyles.formLabel}>
              Giờ kết thúc <span style={courseManagementStyles.required}>*</span>
            </label>
            <input
              type="time"
              step="1"
              style={courseManagementStyles.formInput}
              value={formData.end_time}
              onChange={(e) => handleInputChange('end_time', e.target.value)}
            />

            {errors.end_time && <div style={courseManagementStyles.formError}>{errors.end_time}</div>}
          </div>
        </div>

        <div style={courseManagementStyles.formRow}>
          <div style={courseManagementStyles.formGroup}>
            <label style={courseManagementStyles.formLabel}>
              Ngày bắt đầu học kỳ <span style={courseManagementStyles.required}>*</span>
            </label>
            <input
              type="date"
              style={courseManagementStyles.formInput}
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.start_date && <div style={courseManagementStyles.formError}>{errors.start_date}</div>}
          </div>

          <div style={courseManagementStyles.formGroup}>
            <label style={courseManagementStyles.formLabel}>
              Số buổi học <span style={courseManagementStyles.required}>*</span>
            </label>
            <input
              type="number"
              style={courseManagementStyles.formInput}
              value={formData.total_sessions}
              onChange={(e) => handleInputChange('total_sessions', parseInt(e.target.value) || '')}
              min="1"
              max="30"
              placeholder="Nhập số buổi học (1-30)"
            />
            {errors.total_sessions && <div style={courseManagementStyles.formError}>{errors.total_sessions}</div>}
          </div>
        </div>

        <div style={courseManagementStyles.formGroup}>
          <label style={courseManagementStyles.formLabel}>Phòng học</label>
          <input
            type="text"
            style={courseManagementStyles.formInput}
            value={formData.room}
            onChange={(e) => handleInputChange('room', e.target.value)}
            placeholder="Nhập phòng học (tùy chọn)"
          />
        </div>
      </div>

      <div style={courseManagementStyles.modalFooter}>
        <button
          style={{ ...courseManagementStyles.btn, ...courseManagementStyles.btnOutline }}
          onClick={onCancel}
          disabled={isLoading}
        >
          Hủy
        </button>
        <button
          style={{ ...courseManagementStyles.btn, ...courseManagementStyles.btnPrimary }}
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
              {scheduleData ? 'Cập nhật' : 'Tạo lịch học'}
            </>
          )}
        </button>
      </div>
    </>
  );
};

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

// Main Schedule Management Component
const ScheduleManagement = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [courseSections, setCourseSections] = useState([]);
  const [currentView, setCurrentView] = useState('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [courseSectionFilter, setCourseSectionFilter] = useState('');
  const [weekdayFilter, setWeekdayFilter] = useState('');

  // Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [scheduleTemplate, setScheduleTemplate] = useState(null);
  const [scheduleOptions, setScheduleOptions] = useState({ courseSections: [], weekdays: [] });

  const currentTime = useTime();
  const { notifications, showNotification, removeNotification } = useNotification();

  useEffect(() => {
    const checkPermission = () => {
      const allowedRoles = ['admin', 'teacher'];
      const userHasPermission = authService.hasPermission(allowedRoles);
      setHasPermission(userHasPermission);

      if (!userHasPermission) {
        showNotification("Bạn không có quyền truy cập trang này.", 'error');
        setLoading(false);
        return;
      }

      fetchSchedules();
      fetchScheduleOptions();
      fetchScheduleTemplate();
    };

    checkPermission();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await apiService.getSchedules();
      if (response.success) {
        setSchedules(response.data.schedules || response.data || []);
        showNotification('Tải danh sách lịch học thành công', 'success');
      } else {
        showNotification(response.message || 'Lỗi khi tải dữ liệu', 'error');
      }
    } catch (error) {
      showNotification('Lỗi kết nối: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleOptions = async () => {
    try {
      const response = await apiService.getScheduleOptions();
      if (response.success) {
        setScheduleOptions(response.data);
        setCourseSections(response.data.courseSections || []);
      }
    } catch (error) {
      console.error('Error loading schedule options:', error);
    }
  };

  const fetchScheduleTemplate = async () => {
    try {
      const template = {
        template: [
          {
            course_section_code: 'MATH101_CNTT47',
            weekday: 1,
            start_time: '08:00:00',
            end_time: '09:30:00',
            room: 'A101',
            start_date: '2024-01-15',
            total_sessions: 15
          }
        ],
        instructions: {
          required_fields: ['course_section_code', 'weekday', 'start_time', 'end_time', 'start_date', 'total_sessions'],
          optional_fields: ['room'],
          field_descriptions: {
            course_section_code: 'Mã lớp học phần (bắt buộc, phải tồn tại)',
            weekday: 'Thứ trong tuần: 1=Thứ Hai, 2=Thứ Ba, ..., 7=Chủ Nhật (bắt buộc)',
            start_time: 'Giờ bắt đầu, định dạng: HH:MM:SS (bắt buộc)',
            end_time: 'Giờ kết thúc, định dạng: HH:MM:SS (bắt buộc)',
            start_date: 'Ngày bắt đầu học kỳ, định dạng: YYYY-MM-DD (bắt buộc)',
            total_sessions: 'Tổng số buổi học (1-30, bắt buộc)',
            room: 'Phòng học (tùy chọn)'
          },
          notes: [
            'Mã lớp học phần phải tồn tại trong hệ thống',
            'Giờ bắt đầu phải trước giờ kết thúc',
            'Ngày bắt đầu phải từ hôm nay trở về sau',
            'Số buổi học phải từ 1 đến 30',
            'Hệ thống sẽ tự động tạo phiên điểm danh theo lịch học',
            'Không được xung đột thời gian trong cùng lớp hoặc cùng giáo viên',
            'Xóa các dòng ví dụ trước khi import',
            'Tối đa 50 lịch học mỗi lần import'
          ]
        }
      };
      setScheduleTemplate(template);
    } catch (error) {
      console.error('Error fetching schedule template:', error);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = schedules.filter(schedule => {
      const matchesSearch = !searchQuery ||
        schedule.course_section_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.course_section_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.room?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCourseSection = !courseSectionFilter ||
        schedule.course_section_id == courseSectionFilter;

      const matchesWeekday = !weekdayFilter ||
        schedule.weekday == weekdayFilter;

      return matchesSearch && matchesCourseSection && matchesWeekday;
    });
    setFilteredSchedules(filtered);
  }, [schedules, searchQuery, courseSectionFilter, weekdayFilter]);

  // Calculate statistics
  const statistics = {
    totalSchedules: schedules.length,
    activeSchedules: schedules.filter(s => s.is_active !== false).length,
    totalCourses: [...new Set(schedules.map(s => s.course_section_id).filter(Boolean))].length,
    totalClassrooms: [...new Set(schedules.map(s => s.room).filter(Boolean))].length
  };

  const statsConfig = [
    { title: 'Tổng lịch học', value: statistics.totalSchedules, icon: 'fas fa-calendar-alt', color: '#3b82f6', change: '+2' },
    { title: 'Đang hoạt động', value: statistics.activeSchedules, icon: 'fas fa-play-circle', color: '#10b981', change: '+5.2%' },
    { title: 'Lớp học phần', value: statistics.totalCourses, icon: 'fas fa-graduation-cap', color: '#f59e0b', change: '+1' },
    { title: 'Phòng học', value: statistics.totalClassrooms, icon: 'fas fa-door-open', color: '#8b5cf6', change: '+3' }
  ];

  // Handle actions
  const handleSaveSchedule = async (formData) => {
    setModalLoading(true);
    try {
      let response;
      if (currentSchedule) {
        response = await apiService.updateSchedule(currentSchedule.id, formData);
      } else {
        response = await apiService.createSchedule(formData);
      }

      if (response.success) {
        showNotification(
          currentSchedule ? 'Cập nhật lịch học thành công!' : 'Thêm lịch học thành công!',
          'success'
        );
        setShowScheduleModal(false);
        setCurrentSchedule(null);
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

  const handleEditSchedule = (scheduleItem) => {
    setCurrentSchedule(scheduleItem);
    setShowScheduleModal(true);
  };

  const handleDeleteSchedule = (scheduleItem) => {
    setDeleteTarget(scheduleItem);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setModalLoading(true);
    try {
      const response = await apiService.deleteSchedule(deleteTarget.id);
      if (response.success) {
        showNotification('Xóa lịch học thành công!', 'success');
        setShowDeleteModal(false);
        setDeleteTarget(null);
        fetchSchedules();
      } else {
        showNotification(response.message || 'Có lỗi xảy ra khi xóa lịch học', 'error');
      }
    } catch (error) {
      console.error('Delete schedule error:', error);
      showNotification('Có lỗi xảy ra khi xóa lịch học: ' + error.message, 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddSchedule = () => {
    setCurrentSchedule(null);
    setShowScheduleModal(true);
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
          activePage="schedules"
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
              <p style={{ color: '#64748b' }}>Bạn không có quyền truy cập trang quản lý lịch học.</p>
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
        activePage="schedules"
      />

      {/* Main Content */}
      <main style={mainContentStyle}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.pageTitle}>
              <i className="fas fa-calendar-alt" style={{ color: '#6366f1', marginRight: '1rem' }}></i>
              Quản lý lịch học
            </h1>
            <p style={styles.pageSubtitle}>Quản lý thời khóa biểu và lịch học các lớp học phần</p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.headerActions}>
              <button
                style={styles.actionBtn}
                onClick={() => fetchSchedules()}
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
            <button
              style={{ ...styles.btn, ...styles.btnSecondary, marginRight: '10px' }}
              onClick={() => setShowImportModal(true)}
            >
              <i className="fas fa-file-import"></i>
              Import Excel
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={handleAddSchedule}
            >
              <i className="fas fa-plus"></i>
              Thêm lịch học
            </button>
          </div>
        </header>

        <div style={styles.dashboardContent}>
          <LoadingOverlay isLoading={loading} />

          {/* Filter Bar */}
          <div style={courseManagementStyles.filterBar}>
            <div style={courseManagementStyles.searchSection}>
              <div style={courseManagementStyles.searchBox}>
                <i className="fas fa-search" style={courseManagementStyles.searchIcon}></i>
                <input
                  type="text"
                  style={courseManagementStyles.searchInput}
                  placeholder="Tìm kiếm theo tên lớp học phần, phòng học..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    style={courseManagementStyles.clearSearch}
                    onClick={() => setSearchQuery('')}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>

              <select
                value={courseSectionFilter}
                onChange={(e) => setCourseSectionFilter(e.target.value)}
                style={courseManagementStyles.filterSelect}
              >
                <option value="">Tất cả lớp học phần</option>
                {courseSections.map(cs => (
                  <option key={cs.id} value={cs.id}>{cs.name}</option>
                ))}
              </select>

              <select
                value={weekdayFilter}
                onChange={(e) => setWeekdayFilter(e.target.value)}
                style={courseManagementStyles.filterSelect}
              >
                <option value="">Tất cả ngày trong tuần</option>
                {scheduleOptions.weekdays.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>

            <div style={courseManagementStyles.filterSection}>
              <button
                style={{ ...courseManagementStyles.btn, ...courseManagementStyles.btnOutline }}
                onClick={() => {
                  setSearchQuery('');
                  setCourseSectionFilter('');
                  setWeekdayFilter('');
                }}
              >
                <i className="fas fa-undo"></i>
                Reset
              </button>
            </div>
          </div>

          {/* Statistics */}
          <section style={{ marginBottom: '3rem' }}>
            <div style={styles.statsGrid}>
              {statsConfig.map((stat, index) => (
                <StatsCard key={index} {...stat} />
              ))}
            </div>
          </section>

          {/* View Toggle */}
          <section>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                <i className="fas fa-calendar-week" style={styles.sectionIcon}></i>
                Lịch học ({filteredSchedules.length})
              </h2>
              <div style={courseManagementStyles.viewOptions}>
                <button
                  style={{
                    ...courseManagementStyles.viewBtn,
                    ...(currentView === 'cards' ? courseManagementStyles.viewBtnActive : {})
                  }}
                  onClick={() => setCurrentView('cards')}
                  title="Xem dạng thẻ"
                >
                  <i className="fas fa-th-large"></i>
                </button>
                <button
                  style={{
                    ...courseManagementStyles.viewBtn,
                    ...(currentView === 'weekly' ? courseManagementStyles.viewBtnActive : {})
                  }}
                  onClick={() => setCurrentView('weekly')}
                  title="Xem theo tuần"
                >
                  <i className="fas fa-calendar-week"></i>
                </button>
              </div>
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
                  {searchQuery || courseSectionFilter || weekdayFilter
                    ? 'Không tìm thấy lịch học nào'
                    : 'Chưa có lịch học nào'
                  }
                </h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                  {searchQuery || courseSectionFilter || weekdayFilter
                    ? 'Thử điều chỉnh từ khóa tìm kiếm để xem kết quả khác'
                    : 'Bắt đầu bằng cách tạo lịch học đầu tiên của bạn'
                  }
                </p>
                <button
                  style={{ ...courseManagementStyles.btn, ...courseManagementStyles.btnPrimary }}
                  onClick={handleAddSchedule}
                >
                  <i className="fas fa-plus"></i>
                  Thêm lịch học đầu tiên
                </button>
              </div>
            ) : (
              <>
                {currentView === 'cards' ? (
                  <div style={courseManagementStyles.coursesGrid}>
                    {filteredSchedules.map(schedule => (
                      <ScheduleCard
                        key={schedule.id}
                        scheduleData={schedule}
                        onEditSchedule={handleEditSchedule}
                        onDeleteSchedule={handleDeleteSchedule}
                      />
                    ))}
                  </div>
                ) : (
                  <WeeklyScheduleView schedules={filteredSchedules} />
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {/* Schedule Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => !modalLoading && setShowScheduleModal(false)}
        title={currentSchedule ? 'Chỉnh sửa lịch học' : 'Thêm lịch học mới'}
      >
        <ScheduleForm
          scheduleData={currentSchedule}
          onSave={handleSaveSchedule}
          onCancel={() => setShowScheduleModal(false)}
          isLoading={modalLoading}
          courseSections={scheduleOptions.courseSections || []}
          weekdays={scheduleOptions.weekdays || []}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !modalLoading && setShowDeleteModal(false)}
        title="Xác nhận xóa"
        size="small"
      >
        <div style={courseManagementStyles.modalBody}>
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
              Bạn có chắc chắn muốn xóa lịch học của <strong>"{deleteTarget?.course_section_name}"</strong> không?
            </p>
            <small style={{ color: '#94a3b8' }}>
              Hành động này không thể hoàn tác!
            </small>
          </div>
        </div>

        <div style={courseManagementStyles.modalFooter}>
          <button
            style={{ ...courseManagementStyles.btn, ...courseManagementStyles.btnOutline }}
            onClick={() => setShowDeleteModal(false)}
            disabled={modalLoading}
          >
            Hủy
          </button>
          <button
            style={{ ...courseManagementStyles.btn, ...courseManagementStyles.btnDanger }}
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
                Xóa lịch học
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={(data) => {
          console.log('Import schedules:', data);
          showNotification('Import thành công!', 'success');
          setShowImportModal(false);
          fetchSchedules();
        }}
        isLoading={modalLoading}
        type="schedules"
        title="📅 Import Lịch học từ Excel"
        templateData={scheduleTemplate}
      />
    </div>
  );
};

export default ScheduleManagement;