import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import { SessionDetailModal } from './TeacherDashboard';

// --- STYLES OBJECT ---
const styles = {
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    transition: 'all 0.3s ease'
  },
  sessionItemClickable: {
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  sessionItemClickableHover: {
    backgroundColor: '#f1f5f9',
    transform: 'translateX(4px)'
  },
  dashboardContent: {
    flex: 1,
    padding: '30px',
    overflow: 'auto'
  },
  header: {
    backgroundColor: '#ffffff',
    padding: '15px 30px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a202c',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  backButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
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
  classInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  infoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0'
  },
  infoLabel: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
    marginBottom: '8px'
  },
  infoValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a202c'
  },
  tabContainer: {
    borderBottom: '2px solid #e2e8f0',
    marginBottom: '24px'
  },
  tabList: {
    display: 'flex',
    gap: '0'
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#64748b',
    fontWeight: '500',
    cursor: 'pointer',
    borderStyle: 'solid',
    borderWidth: '0 0 2px 0',
    borderColor: 'transparent',
    transition: 'all 0.2s ease'
  },
  tabActive: {
    color: '#3b82f6',
    borderColor: 'transparent transparent #3b82f6 transparent'
  },
  scheduleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
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
  scheduleTeacher: {
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
  scheduleStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '16px'
  },
  statItem: {
    textAlign: 'center',
    padding: '8px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px'
  },
  statNumber: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a202c'
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b'
  },
  sessionsList: {
    marginTop: '16px'
  },
  sessionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    marginBottom: '8px',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease'
  },
  sessionItemHover: {
    backgroundColor: '#f8fafc',
    borderColor: '#3b82f6'
  },
  sessionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  sessionDate: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a202c'
  },
  sessionStatus: {
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: '500'
  },
  sessionAttendance: {
    fontSize: '12px',
    color: '#64748b'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '16px'
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0'
  },
  tableHeaderCell: {
    padding: '12px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },
  tableCell: {
    padding: '12px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '14px',
    color: '#374151'
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
    padding: '40px',
    color: '#64748b'
  },
  emptyStateIcon: {
    fontSize: '48px',
    color: '#cbd5e1',
    marginBottom: '16px'
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
  }
};

// --- HELPER COMPONENTS ---
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

const ScheduleCard = ({ schedule, sessions, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const scheduleSessions = sessions.filter(session =>
    session.schedule_id === schedule.id
  );

  const activeSessions = scheduleSessions.filter(session => session.is_active);
  const completedSessions = scheduleSessions.filter(session => !session.is_active);

  const daysOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  return (
    <div
      style={{
        ...styles.scheduleCard,
        ...(isHovered ? styles.scheduleCardHover : {})
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(schedule)}
    >
      <div style={styles.scheduleHeader}>
        <div>
          <div style={styles.scheduleSubject}>{schedule.subject_name}</div>
          <div style={styles.scheduleTeacher}>GV: {schedule.teacher_name}</div>
        </div>
        <div style={styles.scheduleTime}>
          {daysOfWeek[schedule.weekday - 1]}
        </div>
      </div>

      <div style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
        <div><i className="fas fa-clock" style={{ marginRight: '8px', color: '#64748b' }}></i>
          {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}</div>
      </div>

      <div style={styles.scheduleStats}>
        <div style={styles.statItem}>
          <div style={styles.statNumber}>{scheduleSessions.length}</div>
          <div style={styles.statLabel}>Tổng phiên</div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statNumber}>{activeSessions.length}</div>
          <div style={styles.statLabel}>Đang diễn ra</div>
        </div>
      </div>

      {scheduleSessions.length > 0 && (
        <div style={styles.sessionsList}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
            Phiên gần đây:
          </div>
          {scheduleSessions.slice(0, 3).map(session => (
            <div
              key={session.id}
              style={{
                ...styles.sessionItem,
                cursor: 'pointer' // Thêm cursor pointer
              }}
              onClick={(e) => {
                e.stopPropagation();
                onClick(session); // Use the passed prop
              }}
            >
              <div style={styles.sessionInfo}>
                <div style={styles.sessionDate}>
                  {new Date(session.session_date).toLocaleDateString('vi-VN')}
                </div>
                <div style={styles.sessionAttendance}>
                  {session.total_attendances || 0} điểm danh
                </div>
              </div>
              <div style={{
                ...styles.sessionStatus,
                backgroundColor: session.is_active ? '#dcfce7' : '#f3f4f6',
                color: session.is_active ? '#16a34a' : '#6b7280'
              }}>
                {session.is_active ? 'Đang diễn ra' : 'Đã kết thúc'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};



const StudentsList = ({ students }) => {
  if (!students || students.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyStateIcon}>
          <i className="fas fa-user-graduate"></i>
        </div>
        <div>Chưa có sinh viên nào trong lớp</div>
      </div>
    );
  }

  return (
    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
      <table style={styles.table}>
        <thead style={styles.tableHeader}>
          <tr>
            <th style={styles.tableHeaderCell}>STT</th>
            <th style={styles.tableHeaderCell}>Mã SV</th>
            <th style={styles.tableHeaderCell}>Họ tên</th>
            {/* <th style={styles.tableHeaderCell}>Email</th> */}
            {/* <th style={styles.tableHeaderCell}>Trạng thái AI</th> */}
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={student.id}>
              <td style={styles.tableCell}>{index + 1}</td>
              <td style={styles.tableCell}>{student.student_code || 'N/A'}</td>
              <td style={styles.tableCell}>{student.full_name}</td>
              {/* <td style={styles.tableCell}>{student.email}</td> */}
              {/* <td style={styles.tableCell}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: student.face_trained ? '#dcfce7' : '#fef3c7',
                  color: student.face_trained ? '#16a34a' : '#d97706'
                }}>
                  {student.face_trained ? 'Đã huấn luyện' : 'Chưa huấn luyện'}
                </span>
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SessionsHistory = ({ sessions, schedules }) => {
  const [filterSchedule, setFilterSchedule] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      if (filterSchedule !== 'all' && session.schedule_id !== parseInt(filterSchedule)) {
        return false;
      }
      if (filterStatus === 'active' && !session.is_active) return false;
      if (filterStatus === 'completed' && session.is_active) return false;
      return true;
    });
  }, [sessions, filterSchedule, filterStatus]);

  if (!sessions || sessions.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyStateIcon}>
          <i className="fas fa-clipboard-check"></i>
        </div>
        <div>Chưa có phiên điểm danh nào</div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.filterContainer}>
        <select
          value={filterSchedule}
          onChange={(e) => setFilterSchedule(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">Tất cả môn học</option>
          {schedules.map(schedule => (
            <option key={schedule.id} value={schedule.id}>
              {schedule.subject_name} - {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][schedule.weekday - 1]}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang diễn ra</option>
          <option value="completed">Đã kết thúc</option>
        </select>
      </div>

      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.tableHeaderCell}>Ngày</th>
              <th style={styles.tableHeaderCell}>Môn học</th>
              <th style={styles.tableHeaderCell}>Giáo viên</th>
              <th style={styles.tableHeaderCell}>Thời gian</th>
              <th style={styles.tableHeaderCell}>Trạng thái</th>
              <th style={styles.tableHeaderCell}>Điểm danh</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map(session => (
              <tr key={session.id}>
                <td style={styles.tableCell}>
                  {new Date(session.session_date).toLocaleDateString('vi-VN')}
                </td>
                <td style={styles.tableCell}>{session.subject}</td>
                <td style={styles.tableCell}>{session.teacher_name}</td>
                <td style={styles.tableCell}>
                  {session.start_time.substring(0, 5)}
                  {session.end_time && ` - ${session.end_time.substring(0, 5)}`}
                </td>
                <td style={styles.tableCell}>
                  <span style={{
                    ...styles.sessionStatus,
                    backgroundColor: session.is_active ? '#dcfce7' : '#f3f4f6',
                    color: session.is_active ? '#16a34a' : '#6b7280'
                  }}>
                    {session.is_active ? 'Đang diễn ra' : 'Đã kết thúc'}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  {session.total_attendances || 0} / {session.total_students || 0}
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    ({session.total_students > 0 ?
                      Math.round((session.total_attendances || 0) / session.total_students * 100) : 0}%)
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const ClassDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { notifications, showNotification, removeNotification } = useNotification();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSchedule, setExpandedSchedule] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load class basic info and students
      const [classResponse, studentsResponse] = await Promise.all([
        ApiService.getClasses(),
        ApiService.getClassStudents(classId)
      ]);

      if (classResponse.success) {
        const classList = Array.isArray(classResponse.data) ? classResponse.data : (classResponse.data.classes || []);
        const foundClass = classList.find(cls => cls.id === parseInt(classId));
        if (foundClass) {
          setClassData(foundClass);
        } else {
          setError('Không tìm thấy lớp học');
          return;
        }
      }

      console.log('Students response:', studentsResponse);
      if (studentsResponse.success) {
        setStudents(studentsResponse.data.students || []);
      }

      // Load schedules for this class
      const schedulesResponse = await ApiService.getSchedules({
        class_id: classId,
        limit: 100
      });

      if (schedulesResponse.success) {
        // Chỉ lấy các lịch học thuộc class hiện tại
        const allSchedules = schedulesResponse.data.schedules || [];
        setSchedules(allSchedules.filter(sch => sch.class_id === parseInt(classId)));
      }

      // Load sessions for this class
      const sessionsResponse = await ApiService.getSessions({
        class_id: classId
      });

      if (sessionsResponse.success) {
        setSessions(sessionsResponse.data.sessions || []);
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

  const handleSessionClick = (session) => {
    // Tạo object session với đầy đủ thông tin cho modal
    const sessionWithDetails = {
      ...session,
      subject: schedules.find(s => s.id === session.schedule_id)?.subject_name || 'N/A',
      class_name: classData.name,
      class_id: classData.id
    };

    setSelectedSession(sessionWithDetails);
    setShowSessionModal(true);
  };

  const handleScheduleClick = (schedule) => {
    setExpandedSchedule(expandedSchedule === schedule.id ? null : schedule.id);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const getScheduleSessionStats = (scheduleId) => {
    const scheduleSessions = sessions.filter(
      s => s.schedule_id === scheduleId && s.class_id === classData.id
    );
    console.log('Schedule sessions:', scheduleSessions);
    return {
      total: scheduleSessions.length,
      active: scheduleSessions.filter(s => s.is_active).length,
      completed: scheduleSessions.filter(s => !s.is_active).length,
      totalAttendance: scheduleSessions.reduce((sum, s) => sum + (s.total_attendances || 0), 0),
      averageAttendance: scheduleSessions.length > 0 ?
        Math.round(scheduleSessions.reduce((sum, s) => sum + (s.total_attendances || 0), 0) / scheduleSessions.length) : 0
    };
  };

  if (loading) {
    return (
      <div style={styles.appContainer}>
        <div style={styles.mainContent}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.appContainer}>
        <div style={styles.mainContent}>
          <ErrorMessage message={error} onRetry={loadClassData} />
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div style={styles.appContainer}>
        <div style={styles.mainContent}>
          <div style={styles.error}>Không tìm thấy thông tin lớp học</div>
        </div>
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

      <div style={styles.mainContent}>
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>
            <i className="fas fa-users" style={{ color: '#3b82f6' }}></i>
            Chi tiết lớp: {classData.name}
          </h1>
          <div style={styles.headerActions}>
            <button
              style={styles.backButton}
              onClick={handleBackClick}
            >
              <i className="fas fa-arrow-left"></i>
              Quay lại
            </button>
          </div>
        </header>

        <div style={styles.dashboardContent}>
          {/* Class Overview */}
          <div style={styles.classInfo}>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>Tên lớp</div>
              <div style={styles.infoValue}>{classData.name}</div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>Số sinh viên</div>
              <div style={styles.infoValue}>{students.length}</div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>Số môn học</div>
              <div style={styles.infoValue}>{schedules.length}</div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoLabel}>Tổng phiên điểm danh</div>
              <div style={styles.infoValue}>{sessions.length}</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={styles.tabContainer}>
            <div style={styles.tabList}>
              {[
                { key: 'overview', label: 'Tổng quan', icon: 'fas fa-chart-bar' },
                { key: 'students', label: 'Danh sách sinh viên', icon: 'fas fa-user-graduate' },
                { key: 'schedules', label: 'Lịch học', icon: 'fas fa-calendar' },
                { key: 'sessions', label: 'Lịch sử điểm danh', icon: 'fas fa-clipboard-check' }
              ].map(tab => (
                <button
                  key={tab.key}
                  style={{
                    ...styles.tab,
                    ...(activeTab === tab.key ? styles.tabActive : {})
                  }}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <i className={tab.icon} style={{ marginRight: '8px' }}></i>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  <i className="fas fa-chart-bar"></i>
                  Tổng quan lớp học
                </h2>
              </div>

              <div style={styles.scheduleGrid}>
                {schedules.map(schedule => {
                  const stats = getScheduleSessionStats(schedule.id);
                  return (
                    <div key={schedule.id} style={styles.scheduleCard}>
                      <div style={styles.scheduleHeader}>
                        <div>
                          <div style={styles.scheduleSubject}>{schedule.subject_name}</div>
                          <div style={styles.scheduleTeacher}>GV: {schedule.teacher_name}</div>
                        </div>
                        <div style={styles.scheduleTime}>
                          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][schedule.weekday - 1]}
                        </div>
                      </div>

                      <div style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
                        <div><i className="fas fa-clock" style={{ marginRight: '8px', color: '#64748b' }}></i>
                          {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}</div>
                      </div>

                      <div style={styles.scheduleStats}>
                        <div style={styles.statItem}>
                          <div style={styles.statNumber}>{stats.total}</div>
                          <div style={styles.statLabel}>Tổng phiên</div>
                        </div>
                        <div style={styles.statItem}>
                          <div style={styles.statNumber}>{stats.active}</div>
                          <div style={styles.statLabel}>Đang diễn ra</div>
                        </div>
                        <div style={styles.statItem}>
                          <div style={styles.statNumber}>{stats.completed}</div>
                          <div style={styles.statLabel}>Đã hoàn thành</div>
                        </div>
                        <div style={styles.statItem}>
                          <div style={styles.statNumber}>{stats.averageAttendance}</div>
                          <div style={styles.statLabel}>TB điểm danh</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  <i className="fas fa-user-graduate"></i>
                  Danh sách sinh viên ({students.length})
                </h2>
                <button
                  style={{ ...styles.button, ...styles.buttonSecondary }}
                  onClick={loadClassData}
                >
                  <i className="fas fa-sync-alt"></i>
                  Làm mới
                </button>
              </div>
              <StudentsList students={students} />
            </div>
          )}

          {activeTab === 'schedules' && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  <i className="fas fa-calendar"></i>
                  Lịch học ({schedules.length})
                </h2>
              </div>

              {schedules.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyStateIcon}>
                    <i className="fas fa-calendar"></i>
                  </div>
                  <div>Chưa có lịch học nào được tạo</div>
                </div>
              ) : (
                <div style={styles.scheduleGrid}>
                  {schedules.map(schedule => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      sessions={sessions}
                      onClick={handleSessionClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  <i className="fas fa-clipboard-check"></i>
                  Lịch sử điểm danh ({sessions.length})
                </h2>
                <button
                  style={{ ...styles.button, ...styles.buttonSecondary }}
                  onClick={loadClassData}
                >
                  <i className="fas fa-sync-alt"></i>
                  Làm mới
                </button>
              </div>
              <SessionsHistory sessions={sessions} schedules={schedules} />
            </div>
          )}

          {/* Thêm modal này trước thẻ đóng </div> cuối cùng */}
          {showSessionModal && selectedSession && (
            <SessionDetailModal
              session={selectedSession}
              onClose={() => setShowSessionModal(false)}
              showNotification={showNotification}
              onSessionEnd={loadClassData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassDetail;