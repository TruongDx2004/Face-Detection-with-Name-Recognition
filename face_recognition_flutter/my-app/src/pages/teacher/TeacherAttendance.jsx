import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout, Header } from '../../components/layout/AppLayout';
import Notification from '../../components/Notification';
import ConfirmModal from '../../components/ConfirmModal';
import useNotification from '../../hooks/useNotification';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';

// Styles
const styles = {
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
  button: {
    padding: '10px 20px',
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
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    color: '#cbd5e1'
  },
  classGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  classCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    border: '2px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  },
  classCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff'
  },
  classCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
  },
  classCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  className: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a202c',
    margin: '0 0 4px 0',
    display: 'flex',
    alignItems: 'center'
  },
  classCode: {
    fontSize: '12px',
    backgroundColor: '#e2e8f0',
    color: '#475569',
    padding: '4px 8px',
    borderRadius: '6px',
    fontWeight: '500'
  },
  classIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    color: '#3b82f6'
  },
  classInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#64748b'
  },
  sessionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '16px'
  },
  sessionCard: {
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'white'
  },
  sessionCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4'
  },
  sessionCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
  },
  sessionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  sessionTitle: {
    flex: 1
  },
  sessionActions: {
    display: 'flex',
    gap: '8px'
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  sessionStatus: {
    fontSize: '12px',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: '6px',
    backgroundColor: '#f1f5f9'
  },
  sessionInfo: {
    display: 'flex',
    gap: '16px',
    marginBottom: '8px'
  },
  sessionTime: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: '#64748b'
  },
  sessionDescription: {
    fontSize: '14px',
    color: '#64748b',
    margin: '8px 0 0 0',
    lineHeight: '1.4'
  },
  attendanceStats: {
    display: 'flex',
    gap: '24px',
    marginBottom: '20px',
    justifyContent: 'center'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b'
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500'
  },
  attendanceTable: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '60px 120px 1fr 120px 100px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  },
  tableHeaderCell: {
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    borderRight: '1px solid #e2e8f0'
  },
  tableBody: {
    maxHeight: '400px',
    overflowY: 'auto'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '60px 120px 1fr 120px 100px',
    borderBottom: '1px solid #f1f5f9'
  },
  tableCell: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#374151',
    borderRight: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500'
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
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#64748b',
    padding: '4px'
  },
  modalForm: {
    padding: '24px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    transition: 'border-color 0.2s ease'
  },
  formInputDisabled: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#f9fafb',
    color: '#6b7280'
  },
  formTextarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical',
    minHeight: '80px',
    transition: 'border-color 0.2s ease'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #e2e8f0'
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  submitButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
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

// Course Section Card Component
const CourseSectionCard = ({ courseSection, onSelect, isSelected }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        ...styles.classCard,
        ...(isSelected ? styles.classCardSelected : {}),
        ...(isHovered ? styles.classCardHover : {})
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(courseSection)}
    >
      <div style={styles.classCardHeader}>
        <div>
          <h4 style={styles.className}>
            <i className="fas fa-graduation-cap" style={{ marginRight: '8px', color: '#3b82f6' }}></i>
            {courseSection.class_name || courseSection.name}
          </h4>
          <div style={styles.classCode}>{courseSection.class_code || courseSection.code}</div>
        </div>
        <div style={styles.classIcon}>
          <i className="fas fa-users"></i>
        </div>
      </div>
      
      <div style={styles.classInfo}>
        <div style={styles.infoItem}>
          <i className="fas fa-book"></i>
          <span>{courseSection.subject_name || courseSection.subject}</span>
        </div>
        <div style={styles.infoItem}>
          <i className="fas fa-users"></i>
          <span>{courseSection.student_count || 0} sinh viên</span>
        </div>
        <div style={styles.infoItem}>
          <i className="fas fa-calendar"></i>
          <span>Học kỳ {courseSection.semester || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

// Attendance Session Card Component
const AttendanceSessionCard = ({ session, onSelect, onStart, onEnd, onDelete, isSelected }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getSessionStatus = () => {
    const now = new Date();
    const startTime = new Date(session.start_time || session.session_date);
    const endTime = new Date(session.end_time || session.session_date);
    
    if (session.status === 'completed' || session.is_completed) return { text: 'Đã hoàn thành', color: '#10b981' };
    if (session.status === 'active' || session.is_active) return { text: 'Đang diễn ra', color: '#3b82f6' };
    if (now < startTime) return { text: 'Chưa bắt đầu', color: '#6b7280' };
    if (now > endTime) return { text: 'Đã kết thúc', color: '#ef4444' };
    return { text: 'Sẵn sàng', color: '#f59e0b' };
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('vi-VN'),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const status = getSessionStatus();
  const dateTime = formatDateTime(session.session_date || session.start_time);

  return (
    <div
      style={{
        ...styles.sessionCard,
        ...(isSelected ? styles.sessionCardSelected : {}),
        ...(isHovered ? styles.sessionCardHover : {})
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(session)}
    >
      <div style={styles.sessionHeader}>
        <div style={styles.sessionTitle}>
          <h4>{session.title || `Buổi ${session.session_name || 'N/A'}`}</h4>
          <span style={{...styles.sessionStatus, color: status.color}}>
            {status.text}
          </span>
        </div>
        <div style={styles.sessionActions}>
          {(session.status === 'pending' || !session.is_active) && (
            <button
              style={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                onStart(session.id);
              }}
              title="Bắt đầu"
            >
              <i className="fas fa-play"></i>
            </button>
          )}
          {(session.status === 'active' || session.is_active === 1) && (
            <button
              style={{...styles.actionButton, backgroundColor: '#ef4444'}}
              onClick={(e) => {
                e.stopPropagation();
                onEnd(session.id);
              }}
              title="Kết thúc"
            >
              <i className="fas fa-stop"></i>
            </button>
          )}
          <button
            style={{...styles.actionButton, backgroundColor: '#dc3545'}}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }}
            title="Xóa"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      <div style={styles.sessionInfo}>
        <div style={styles.sessionTime}>
          <i className="fas fa-calendar"></i>
          <span>{dateTime.date}</span>
        </div>
        <div style={styles.sessionTime}>
          <i className="fas fa-clock"></i>
          <span>{dateTime.time}</span>
        </div>
      </div>
      
      {session.description && (
        <p style={styles.sessionDescription}>{session.description}</p>
      )}
    </div>
  );
};

// Attendance Records Table Component
const AttendanceRecordsTable = ({ students, attendanceRecords }) => {
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('vi-VN'),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getAttendanceStats = () => {
    if (!attendanceRecords.length || !students.length) {
      return { present: 0, absent: 0, total: students.length, percentage: 0 };
    }
    
    const present = attendanceRecords.filter(record => record.status === 'present').length;
    const total = students.length;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { present, absent, total, percentage };
  };

  const stats = getAttendanceStats();

  return (
    <div>
      {/* Statistics */}
      <div style={styles.attendanceStats}>
        <div style={styles.statItem}>
          <span style={styles.statNumber}>{stats.present}</span>
          <span style={styles.statLabel}>Có mặt</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statNumber}>{stats.absent}</span>
          <span style={styles.statLabel}>Vắng mặt</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statNumber}>{stats.percentage}%</span>
          <span style={styles.statLabel}>Tỷ lệ</span>
        </div>
      </div>

      {/* Table */}
      {students.length === 0 ? (
        <div style={styles.emptyState}>
          <i className="fas fa-users" style={styles.emptyIcon}></i>
          <p>Không có sinh viên nào trong lớp</p>
        </div>
      ) : (
        <div style={styles.attendanceTable}>
          <div style={styles.tableHeader}>
            <div style={styles.tableHeaderCell}>STT</div>
            <div style={styles.tableHeaderCell}>Mã SV</div>
            <div style={styles.tableHeaderCell}>Họ và tên</div>
            <div style={styles.tableHeaderCell}>Trạng thái</div>
            <div style={styles.tableHeaderCell}>Thời gian</div>
          </div>
          <div style={styles.tableBody}>
            {students.map((student, index) => {
              const attendanceRecord = attendanceRecords.find(
                record => record.student_id === student.id || record.user_id === student.id
              );
              const isPresent = attendanceRecord?.status === 'present';
              
              return (
                <div key={student.id} style={styles.tableRow}>
                  <div style={styles.tableCell}>{index + 1}</div>
                  <div style={styles.tableCell}>{student.student_code || student.username}</div>
                  <div style={styles.tableCell}>{student.full_name || student.name}</div>
                  <div style={styles.tableCell}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: isPresent ? '#10b981' : '#ef4444',
                      color: 'white'
                    }}>
                      {isPresent ? 'Có mặt' : 'Vắng mặt'}
                    </span>
                  </div>
                  <div style={styles.tableCell}>
                    {attendanceRecord?.created_at ? 
                      formatDateTime(attendanceRecord.created_at).time : 
                      '-'
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Create Session Modal Component
const CreateSessionModal = ({ show, onClose, onSubmit, classInfo }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    session_date: '',
    start_time: '',
    end_time: '',
    session_number: 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.session_date || !formData.start_time) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    if (formData.end_time && formData.start_time >= formData.end_time) {
      alert('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }
    
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!show) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        {/* <div style={styles.modalHeader}>
          <h3>Tạo phiên điểm danh mới</h3>
          <button style={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div> */}
        
        <form onSubmit={handleSubmit} style={styles.modalForm}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Lớp học:</label>
            <input
              type="text"
              value={`${classInfo?.class_name || classInfo?.name} (${classInfo?.class_code || classInfo?.code})`}
              disabled
              style={styles.formInputDisabled}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Tiêu đề phiên: *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="VD: Buổi 1 - Giới thiệu môn học"
              style={styles.formInput}
              required
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Số buổi:</label>
              <input
                type="number"
                value={formData.session_number}
                onChange={(e) => handleChange('session_number', parseInt(e.target.value))}
                min="1"
                style={styles.formInput}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Ngày học: *</label>
              <input
                type="date"
                value={formData.session_date}
                onChange={(e) => handleChange('session_date', e.target.value)}
                style={styles.formInput}
                required
              />
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Thời gian bắt đầu: *</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
                style={styles.formInput}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Thời gian kết thúc:</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
                style={styles.formInput}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Mô tả (tùy chọn):</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Mô tả nội dung buổi học..."
              style={styles.formTextarea}
              rows="3"
            />
          </div>

          <div style={styles.modalActions}>
            <button type="button" style={styles.cancelButton} onClick={onClose}>
              Hủy
            </button>
            <button type="submit" style={styles.submitButton}>
              <i className="fas fa-plus"></i>
              Tạo phiên
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main TeacherAttendance Component
const TeacherAttendance = () => {
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseSections, setCourseSections] = useState([]);
  const [selectedCourseSection, setSelectedCourseSection] = useState(null);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState(null);
  
  const { notifications, showNotification, removeNotification } = useNotification();

  // Update current time
  useEffect(() => { 
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load initial data
  useEffect(() => {
    loadCourseSections();
  }, []);

  // Load course sections for teacher
  const loadCourseSections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current teacher's profile
      const profileResponse = await ApiService.getProfile();
      if (!profileResponse.success) {
        setError('Không thể lấy thông tin giáo viên');
        return;
      }
      setUser(profileResponse.data);
      const teacherId = profileResponse.data.id;
      
      // Get course sections for the current teacher
      const response = await ApiService.getCourseSectionsByTeacher(teacherId);
      console.log(response);
      if (response.success) {
        setCourseSections(response.data.courseSections || []);
      } else {
        showNotification('Không thể tải danh sách lớp', 'error');
      }
    } catch (err) {
      console.error('Error loading course sections:', err);
      setError('Lỗi kết nối: ' + err.message);
      if (String(err.message).includes('401') || String(err.message).includes('Unauthorized')) {
        authService.logout();
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load attendance sessions for selected course section
  const loadAttendanceSessions = async (courseSectionId) => {
    try {
      setLoading(true);
      const response = await ApiService.getCourseSectionAttendanceSessions(courseSectionId);
      console.log(response);
      if (response.success) {
        setAttendanceSessions(response.data || []);
      } else {
        showNotification('Không thể tải danh sách phiên điểm danh', 'error');
      }
    } catch (error) {
      console.error('Error loading attendance sessions:', error);
      showNotification('Lỗi khi tải phiên điểm danh', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load students in course section
  const loadStudents = async (courseSectionId) => {
    try {
      const response = await ApiService.getCourseSectionStudents(courseSectionId);
      if (response.success) {
        setStudents(response.data || []);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  // Load attendance records for session
  const loadAttendanceRecords = async (sessionId) => {
    try {
      setLoading(true);
      const response = await ApiService.getSessionAttendanceRecords(sessionId);
      console.log('Attendance Records Response:', response);
      if (response.success) {
        setAttendanceRecords(response.data.attendanceRecords || []);
      } else {
        showNotification('Không thể tải dữ liệu điểm danh', 'error');
      }
    } catch (error) {
      console.error('Error loading attendance records:', error);
      showNotification('Lỗi khi tải dữ liệu điểm danh', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle course section selection
  const handleCourseSectionSelect = (courseSection) => {
    setSelectedCourseSection(courseSection);
    setSelectedSession(null);
    setAttendanceRecords([]);
    loadAttendanceSessions(courseSection.id);
    loadStudents(courseSection.id);
  };

  // Handle session selection
  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    loadAttendanceRecords(session.id);
  };

  // Create new attendance session
  const createAttendanceSession = async (sessionData) => {
    try {
      setLoading(true);
      const response = await ApiService.createAttendanceSession({
        ...sessionData,
        course_section_id: selectedCourseSection.id,
        teacher_id: user.id
      });
      
      if (response.success) {
        showNotification('Tạo phiên điểm danh thành công', 'success');
        loadAttendanceSessions(selectedCourseSection.id);
        setShowCreateModal(false);
      } else {
        showNotification(response.message || 'Không thể tạo phiên điểm danh', 'error');
      }
    } catch (error) {
      console.error('Error creating attendance session:', error);
      showNotification('Lỗi khi tạo phiên điểm danh', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Start attendance session
  const startAttendanceSession = async (sessionId) => {
    try {
      setLoading(true);
      // Note: API doesn't have explicit start session, sessions are created as active
      showNotification('Phiên điểm danh đã được kích hoạt', 'success');
      loadAttendanceSessions(selectedCourseSection.id);
    } catch (error) {
      console.error('Error starting attendance session:', error);
      showNotification('Lỗi khi bắt đầu phiên điểm danh', 'error');
    } finally {
      setLoading(false);
    }
  };

  // End attendance session
  const endAttendanceSession = async (sessionId) => {
    try {
      setLoading(true);
      const response = await ApiService.endSession(sessionId);
      
      if (response.success) {
        showNotification('Kết thúc phiên điểm danh thành công', 'success');
        loadAttendanceSessions(selectedCourseSection.id);
      } else {
        showNotification(response.message || 'Không thể kết thúc phiên điểm danh', 'error');
      }
    } catch (error) {
      console.error('Error ending attendance session:', error);
      showNotification('Lỗi khi kết thúc phiên điểm danh', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete attendance session
  const deleteAttendanceSession = async (sessionId) => {
    try {
      setLoading(true);
      const response = await ApiService.deleteSession(sessionId);
      
      if (response.success) {
        showNotification('Xóa phiên điểm danh thành công', 'success');
        loadAttendanceSessions(selectedCourseSection.id);
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null);
          setAttendanceRecords([]);
        }
      } else {
        showNotification(response.message || 'Không thể xóa phiên điểm danh', 'error');
      }
    } catch (error) {
      console.error('Error deleting attendance session:', error);
      showNotification('Lỗi khi xóa phiên điểm danh', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      authService.logout();
      navigate('/');
    }
  };

  const breadcrumb = [
    { label: 'Bảng điều khiển', path: '/teacher-dashboard' },
    { label: 'Quản lý điểm danh' }
  ];

  if (loading) {
    return (
      <AppLayout
        user={user}
        onLogout={handleLogout}
        currentTime={currentTime}
        title="Quản lý điểm danh"
      >
        <LoadingSpinner />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout
        user={user}
        onLogout={handleLogout}
        currentTime={currentTime}
        title="Quản lý điểm danh"
        
      >
        <ErrorMessage message={error} onRetry={loadCourseSections} />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      user={user}
      onLogout={handleLogout}
      currentTime={currentTime}
      title="Quản lý điểm danh"
      
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
        title="Quản lý điểm danh"
        titleIcon="fas fa-user-check"
        showBack={true}
        onBack={() => navigate('/teacher-dashboard')}
        breadcrumb={breadcrumb}
        actions={[
          {
            label: 'Làm mới',
            icon: 'fas fa-sync-alt',
            onClick: loadCourseSections
          }
        ]}
      />

      {/* Course Sections Panel */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            <i className="fas fa-users"></i>
            Chọn lớp học ({courseSections.length})
          </h2>
        </div>

        {courseSections.length === 0 ? (
          <div style={styles.emptyState}>
            <i className="fas fa-users" style={styles.emptyIcon}></i>
            <p>Không có lớp học nào</p>
          </div>
        ) : (
          <div style={styles.classGrid}>
            {courseSections.map(courseSection => (
              <CourseSectionCard
                key={courseSection.id}
                courseSection={courseSection}
                onSelect={handleCourseSectionSelect}
                isSelected={selectedCourseSection?.id === courseSection.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Attendance Sessions Panel */}
      {selectedCourseSection && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <i className="fas fa-calendar-check"></i>
              Phiên điểm danh - {selectedCourseSection.class_name || selectedCourseSection.name} ({attendanceSessions.length})
            </h2>
            {/* <button
              style={{ ...styles.button, ...styles.buttonPrimary }}
              onClick={() => setShowCreateModal(true)}
            >
              <i className="fas fa-plus"></i>
              Tạo phiên mới
            </button> */}
          </div>

          {attendanceSessions.length === 0 ? (
            <div style={styles.emptyState}>
              <i className="fas fa-calendar-check" style={styles.emptyIcon}></i>
              <p>Chưa có phiên điểm danh nào</p>
              <button
                style={{ ...styles.button, ...styles.buttonPrimary }}
                onClick={() => setShowCreateModal(true)}
              >
                <i className="fas fa-plus"></i>
                Tạo phiên đầu tiên
              </button>
            </div>
          ) : (
            <div style={styles.sessionGrid}>
              {attendanceSessions.map(session => (
                <AttendanceSessionCard
                  key={session.id}
                  session={session}
                  onSelect={handleSessionSelect}
                  onStart={startAttendanceSession}
                  onEnd={(sessionId) => {
                    setConfirmAction({
                      message: 'Bạn có chắc muốn kết thúc phiên điểm danh này?',
                      onConfirm: () => endAttendanceSession(sessionId)
                    });
                    setShowConfirmModal(true);
                  }}
                  onDelete={(sessionId) => {
                    setConfirmAction({
                      message: 'Bạn có chắc muốn xóa phiên điểm danh này?',
                      onConfirm: () => deleteAttendanceSession(sessionId)
                    });
                    setShowConfirmModal(true);
                  }}
                  isSelected={selectedSession?.id === session.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attendance Details Panel */}
      {selectedSession && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <i className="fas fa-list-check"></i>
              Chi tiết điểm danh - {selectedSession.title || `Buổi ${selectedSession.session_name}`}
            </h2>
          </div>
          
          <AttendanceRecordsTable
            students={students}
            attendanceRecords={attendanceRecords}
          />
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <CreateSessionModal
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={createAttendanceSession}
          classInfo={selectedCourseSection}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        show={showConfirmModal}
        message={confirmAction?.message || ''}
        onConfirm={() => {
          if (confirmAction?.onConfirm) {
            confirmAction.onConfirm();
          }
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
        onCancel={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
      />
    </AppLayout>
  );
};

export default TeacherAttendance;