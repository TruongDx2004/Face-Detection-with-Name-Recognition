import React, { useState, useEffect } from 'react';
import Notification from '../components/Notification';
import Sidebar from '../components/Sidebar';
import LoadingOverlay from '../components/LoadingOverlay';
import useNotification from '../hooks/useNotification';
import useTime from '../hooks/useTime';
import styles from '../components/styles';
import apiService from '../services/api-service';
import authService from '../services/auth-service';

// Attendance Session Management Styles
const sessionManagementStyles = {
  filterBar: {
    background: 'white',
    padding: '1.5rem',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    marginBottom: '2rem',
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'flex-end',
    flexWrap: 'wrap'
  },
  searchSection: {
    display: 'flex',
    gap: '1rem',
    flex: 1,
    minWidth: '300px'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    minWidth: '150px'
  },
  filterLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151'
  },
  filterSelect: {
    padding: '0.625rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  filterInput: {
    padding: '0.625rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    background: 'white',
    transition: 'all 0.2s'
  },
  sessionsTable: {
    background: 'white',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    overflow: 'hidden'
  },
  tableHeader: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '1rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  tableTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    margin: 0
  },
  tableActions: {
    display: 'flex',
    gap: '0.5rem'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHead: {
    background: '#f8fafc'
  },
  th: {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontWeight: '600',
    color: '#374151',
    fontSize: '0.875rem',
    borderBottom: '1px solid #e2e8f0'
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '0.875rem'
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  statusActive: {
    background: '#dcfce7',
    color: '#166534'
  },
  statusInactive: {
    background: '#fee2e2',
    color: '#dc2626'
  },
  actionBtn: {
    padding: '0.375rem 0.75rem',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  viewBtn: {
    background: '#e0e7ff',
    color: '#3730a3'
  },
  viewBtnHover: {
    background: '#c7d2fe'
  },
  editBtn: {
    background: '#fef3c7',
    color: '#92400e'
  },
  editBtnHover: {
    background: '#fde68a'
  },
  stopBtn: {
    background: '#fee2e2',
    color: '#dc2626'
  },
  stopBtnHover: {
    background: '#fecaca'
  },
  deleteBtn: {
    background: '#fee2e2',
    color: '#dc2626'
  },
  deleteBtnHover: {
    background: '#fecaca'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000
  },
  modalContent: {
    background: 'white',
    borderRadius: '1rem',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    padding: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#64748b'
  },
  modalBody: {
    padding: '1.5rem',
    overflowY: 'auto',
    flex: 1
  },
  modalFooter: {
    padding: '1.5rem',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end'
  },
  btn: {
    padding: '0.625rem 1.25rem',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  },
  btnOutline: {
    background: 'white',
    color: '#6366f1',
    border: '1px solid #e2e8f0'
  },
  btnDanger: {
    background: '#dc2626',
    color: 'white'
  },
  attendanceDetails: {
    display: 'grid',
    gap: '1.5rem'
  },
  attendanceSection: {
    background: '#f8fafc',
    padding: '1.5rem',
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0'
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  attendanceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  attendanceCard: {
    background: 'white',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: '1px solid #e2e8f0'
  },
  cardLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginBottom: '0.25rem'
  },
  cardValue: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#64748b'
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    color: '#94a3b8'
  }
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

// Session Details Modal Component
const SessionDetailsModal = ({ session, isOpen, onClose }) => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && session?.id) {
      fetchSessionDetails();
    }
  }, [isOpen, session?.id]);

  const fetchSessionDetails = async () => {
    setLoading(true);
    try {
      const response = await apiService.getSessionAttendance(session.id);
      console.log("Session details response:", response);
      if (response.success) {
        setAttendanceData(response.data);
      }
    } catch (error) {
      console.error('Fetch session details error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={sessionManagementStyles.modal}>
      <div style={sessionManagementStyles.modalContent}>
        <div style={sessionManagementStyles.modalHeader}>
          <h3 style={sessionManagementStyles.modalTitle}>
            Chi tiết phiên điểm danh - {session?.subject} ({session?.class_name})
          </h3>
          <button
            style={sessionManagementStyles.modalClose}
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div style={sessionManagementStyles.modalBody}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#6366f1' }}></i>
              <p style={{ marginTop: '1rem', color: '#64748b' }}>Đang tải dữ liệu...</p>
            </div>
          ) : attendanceData ? (
            <div style={sessionManagementStyles.attendanceDetails}>
              {/* Session Info */}
              <div style={sessionManagementStyles.attendanceSection}>
                <h4 style={sessionManagementStyles.sectionTitle}>
                  <i className="fas fa-info-circle"></i>
                  Thông tin phiên học
                </h4>
                <div style={sessionManagementStyles.attendanceGrid}>
                  <div style={sessionManagementStyles.attendanceCard}>
                    <div style={sessionManagementStyles.cardLabel}>Ngày học</div>
                    <div style={sessionManagementStyles.cardValue}>
                      {new Date(attendanceData.session.session_date).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div style={sessionManagementStyles.attendanceCard}>
                    <div style={sessionManagementStyles.cardLabel}>Thời gian bắt đầu</div>
                    <div style={sessionManagementStyles.cardValue}>
                      {attendanceData.session.start_time}
                    </div>
                  </div>
                  <div style={sessionManagementStyles.attendanceCard}>
                    <div style={sessionManagementStyles.cardLabel}>Thời gian kết thúc</div>
                    <div style={sessionManagementStyles.cardValue}>
                      {attendanceData.session.end_time || 'Chưa kết thúc'}
                    </div>
                  </div>
                  <div style={sessionManagementStyles.attendanceCard}>
                    <div style={sessionManagementStyles.cardLabel}>Giảng viên</div>
                    <div style={sessionManagementStyles.cardValue}>
                      {attendanceData.session.teacher_name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div style={sessionManagementStyles.attendanceSection}>
                <h4 style={sessionManagementStyles.sectionTitle}>
                  <i className="fas fa-chart-pie"></i>
                  Thống kê điểm danh
                </h4>
                <div style={sessionManagementStyles.attendanceGrid}>
                  <div style={sessionManagementStyles.attendanceCard}>
                    <div style={sessionManagementStyles.cardLabel}>Tổng sinh viên</div>
                    <div style={sessionManagementStyles.cardValue}>
                      {attendanceData.statistics.total_students}
                    </div>
                  </div>
                  <div style={sessionManagementStyles.attendanceCard}>
                    <div style={sessionManagementStyles.cardLabel}>Có mặt đúng giờ</div>
                    <div style={{ ...sessionManagementStyles.cardValue, color: '#10b981' }}>
                      {attendanceData.statistics.present}
                    </div>
                  </div>
                  <div style={sessionManagementStyles.attendanceCard}>
                    <div style={sessionManagementStyles.cardLabel}>Có mặt muộn</div>
                    <div style={{ ...sessionManagementStyles.cardValue, color: '#f59e0b' }}>
                      {attendanceData.statistics.late}
                    </div>
                  </div>
                  <div style={sessionManagementStyles.attendanceCard}>
                    <div style={sessionManagementStyles.cardLabel}>Vắng mặt</div>
                    <div style={{ ...sessionManagementStyles.cardValue, color: '#ef4444' }}>
                      {attendanceData.statistics.absent}
                    </div>
                  </div>
                </div>
              </div>

              {/* Present Students */}
              {attendanceData.attendances.length > 0 && (
                <div style={sessionManagementStyles.attendanceSection}>
                  <h4 style={sessionManagementStyles.sectionTitle}>
                    <i className="fas fa-check-circle"></i>
                    Sinh viên đã điểm danh ({attendanceData.attendances.length})
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={sessionManagementStyles.table}>
                      <thead>
                        <tr>
                          <th style={sessionManagementStyles.th}>Mã SV</th>
                          <th style={sessionManagementStyles.th}>Tên sinh viên</th>
                          <th style={sessionManagementStyles.th}>Trạng thái</th>
                          <th style={sessionManagementStyles.th}>Thời gian điểm danh</th>
                          <th style={sessionManagementStyles.th}>Độ tin cậy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.attendances.map((attendance, index) => (
                          <tr key={attendance.id}>
                            <td style={sessionManagementStyles.td}>
                              {attendance.student_code || 'N/A'}
                            </td>
                            <td style={sessionManagementStyles.td}>
                              {attendance.student_name}
                            </td>
                            <td style={sessionManagementStyles.td}>
                              <span style={{
                                ...sessionManagementStyles.statusBadge,
                                ...(attendance.status === 'present' 
                                  ? { background: '#dcfce7', color: '#166534' }
                                  : { background: '#fef3c7', color: '#92400e' }
                                )
                              }}>
                                <i className={`fas fa-${attendance.status === 'present' ? 'check' : 'clock'}`}></i>
                                {attendance.status === 'present' ? 'Có mặt' : 'Muộn'}
                              </span>
                            </td>
                            <td style={sessionManagementStyles.td}>
                              {new Date(attendance.attendance_time).toLocaleString('vi-VN')}
                            </td>
                            <td style={sessionManagementStyles.td}>
                              {Math.round(attendance.confidence_score)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Absent Students */}
              {attendanceData.absent_students.length > 0 && (
                <div style={sessionManagementStyles.attendanceSection}>
                  <h4 style={sessionManagementStyles.sectionTitle}>
                    <i className="fas fa-times-circle"></i>
                    Sinh viên vắng mặt ({attendanceData.absent_students.length})
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={sessionManagementStyles.table}>
                      <thead>
                        <tr>
                          <th style={sessionManagementStyles.th}>Mã SV</th>
                          <th style={sessionManagementStyles.th}>Tên sinh viên</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.absent_students.map((student, index) => (
                          <tr key={student.student_id}>
                            <td style={sessionManagementStyles.td}>
                              {student.student_code || 'N/A'}
                            </td>
                            <td style={sessionManagementStyles.td}>
                              {student.student_name}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={sessionManagementStyles.emptyState}>
              <i className="fas fa-exclamation-triangle" style={sessionManagementStyles.emptyIcon}></i>
              <p>Không thể tải dữ liệu phiên điểm danh</p>
            </div>
          )}
        </div>

        <div style={sessionManagementStyles.modalFooter}>
          <button
            style={{ ...sessionManagementStyles.btn, ...sessionManagementStyles.btnOutline }}
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// Main AttendanceSessionManagement Component
const AttendanceSessionManagement = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [hasPermission, setHasPermission] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    teacher_id: '',
    class_id: '',
    date: '',
    is_active: ''
  });

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Options for filters
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);

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

      fetchInitialData();
    };

    checkPermission();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSessions(),
        fetchFilterOptions()
      ]);
    } catch (error) {
      console.error('Fetch initial data error:', error);
      showNotification('Lỗi khi tải dữ liệu ban đầu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await apiService.getSessions(filters);
      console.log("Fetched sessions:", response);
      if (response.success) {
        setSessions(response.data.sessions || []);
        showNotification('Tải danh sách phiên điểm danh thành công', 'success');
      }
    } catch (error) {
      console.error('Fetch sessions error:', error);
      showNotification('Lỗi khi tải danh sách phiên điểm danh: ' + error.message, 'error');
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Fetch teachers and classes for filter options
      const [usersResponse, classesResponse] = await Promise.all([
        apiService.getAllUsers({ role: 'teacher', limit: 1000 }),
        apiService.getClasses()
      ]);

      if (usersResponse.success) {
        setTeachers(usersResponse.data.users || []);
      }

      if (classesResponse.success) {
        setClasses(classesResponse.data.classes || []);
      }
    } catch (error) {
      console.error('Fetch filter options error:', error);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = sessions.filter(session => {
      const matchesTeacher = !filters.teacher_id || 
        session.teacher_id === parseInt(filters.teacher_id);
      const matchesClass = !filters.class_id || 
        session.class_id === parseInt(filters.class_id);
      const matchesDate = !filters.date || 
        session.session_date === filters.date;
      const matchesActive = filters.is_active === '' || 
        session.is_active === (filters.is_active === 'true');

      return matchesTeacher && matchesClass && matchesDate && matchesActive;
    });

    setFilteredSessions(filtered);
  }, [sessions, filters]);

  // Calculate statistics
  const statistics = {
    totalSessions: sessions.length,
    activeSessions: sessions.filter(s => s.is_active).length,
    totalAttendances: sessions.reduce((sum, s) => sum + (s.total_attendances || 0), 0),
    totalStudents: sessions.reduce((sum, s) => sum + (s.total_students || 0), 0)
  };

  const statsConfig = [
    { 
      title: 'Tổng phiên học', 
      value: statistics.totalSessions, 
      icon: 'fas fa-calendar-check', 
      color: '#3b82f6', 
      change: '+5%' 
    },
    { 
      title: 'Phiên đang hoạt động', 
      value: statistics.activeSessions, 
      icon: 'fas fa-play-circle', 
      color: '#10b981', 
      change: '+2' 
    },
    { 
      title: 'Lượt điểm danh', 
      value: statistics.totalAttendances, 
      icon: 'fas fa-check-circle', 
      color: '#f59e0b', 
      change: '+12%' 
    },
    { 
      title: 'Tổng sinh viên', 
      value: statistics.totalStudents, 
      icon: 'fas fa-users', 
      color: '#8b5cf6', 
      change: '+3%' 
    }
  ];

  // Handle actions
  const handleViewDetails = (session) => {
    setSelectedSession(session);
    setShowDetailsModal(true);
  };

  const handleStopSession = async (sessionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn kết thúc phiên điểm danh này?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await apiService.stopSession(sessionId);
      if (response.success) {
        showNotification('Đã kết thúc phiên điểm danh thành công', 'success');
        fetchSessions();
      }
    } catch (error) {
      console.error('Stop session error:', error);
      showNotification('Lỗi khi kết thúc phiên điểm danh: ' + error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiên điểm danh này? Hành động này không thể hoàn tác!')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await apiService.deleteSession(sessionId);
      if (response.success) {
        showNotification('Đã xóa phiên điểm danh thành công', 'success');
        fetchSessions();
      }
    } catch (error) {
      console.error('Delete session error:', error);
      showNotification('Lỗi khi xóa phiên điểm danh: ' + error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      teacher_id: '',
      class_id: '',
      date: '',
      is_active: ''
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
          activePage="attendance-sessions"
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
              <p style={{ color: '#64748b' }}>Bạn không có quyền truy cập trang quản lý phiên điểm danh.</p>
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
        activePage="attendance-sessions"
      />

      {/* Main Content */}
      <main style={mainContentStyle}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.pageTitle}>
              <i className="fas fa-calendar-check" style={{ color: '#6366f1', marginRight: '1rem' }}></i>
              Quản lý phiên điểm danh
            </h1>
            <p style={styles.pageSubtitle}>Theo dõi và quản lý các phiên điểm danh</p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.headerActions}>
              <button
                style={styles.actionBtn}
                onClick={() => fetchSessions()}
                title="Làm mới dữ liệu"
              >
                <i className="fas fa-sync-alt"></i>
              </button>
              <button
                style={styles.actionBtn}
                onClick={() => showNotification('Tính năng xuất báo cáo đang phát triển', 'info')}
                title="Xuất báo cáo"
              >
                <i className="fas fa-file-export"></i>
              </button>
            </div>
          </div>
        </header>

        <div style={styles.dashboardContent}>
          <LoadingOverlay isLoading={loading} />

          {/* Filter Bar */}
          <div style={sessionManagementStyles.filterBar}>
            <div style={sessionManagementStyles.filterGroup}>
              <label style={sessionManagementStyles.filterLabel}>Giảng viên</label>
              <select
                style={sessionManagementStyles.filterSelect}
                value={filters.teacher_id}
                onChange={(e) => handleFilterChange('teacher_id', e.target.value)}
              >
                <option value="">Tất cả giảng viên</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div style={sessionManagementStyles.filterGroup}>
              <label style={sessionManagementStyles.filterLabel}>Lớp học</label>
              <select
                style={sessionManagementStyles.filterSelect}
                value={filters.class_id}
                onChange={(e) => handleFilterChange('class_id', e.target.value)}
              >
                <option value="">Tất cả lớp</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={sessionManagementStyles.filterGroup}>
              <label style={sessionManagementStyles.filterLabel}>Ngày</label>
              <input
                type="date"
                style={sessionManagementStyles.filterInput}
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
              />
            </div>

            <div style={sessionManagementStyles.filterGroup}>
              <label style={sessionManagementStyles.filterLabel}>Trạng thái</label>
              <select
                style={sessionManagementStyles.filterSelect}
                value={filters.is_active}
                onChange={(e) => handleFilterChange('is_active', e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="true">Đang hoạt động</option>
                <option value="false">Đã kết thúc</option>
              </select>
            </div>

            <div style={sessionManagementStyles.filterGroup}>
              <button
                style={{ ...sessionManagementStyles.btn, ...sessionManagementStyles.btnOutline }}
                onClick={handleResetFilters}
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

          {/* Sessions Table */}
          <section>
            <div style={sessionManagementStyles.sessionsTable}>
              <div style={sessionManagementStyles.tableHeader}>
                <h2 style={sessionManagementStyles.tableTitle}>
                  <i className="fas fa-list"></i>
                  Danh sách phiên điểm danh ({filteredSessions.length})
                </h2>
                <div style={sessionManagementStyles.tableActions}>
                  <button
                    style={{ ...sessionManagementStyles.btn, ...sessionManagementStyles.btnOutline }}
                    onClick={() => fetchSessions()}
                    disabled={loading}
                  >
                    <i className="fas fa-sync-alt"></i>
                    Làm mới
                  </button>
                </div>
              </div>

              {filteredSessions.length === 0 && !loading ? (
                <div style={sessionManagementStyles.emptyState}>
                  <i className="fas fa-calendar-times" style={sessionManagementStyles.emptyIcon}></i>
                  <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>
                    Không tìm thấy phiên điểm danh nào
                  </h3>
                  <p style={{ marginBottom: '1.5rem' }}>
                    Thử điều chỉnh bộ lọc để xem kết quả khác
                  </p>
                  <button
                    style={{ ...sessionManagementStyles.btn, ...sessionManagementStyles.btnPrimary }}
                    onClick={handleResetFilters}
                  >
                    <i className="fas fa-undo"></i>
                    Xóa bộ lọc
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={sessionManagementStyles.table}>
                    <thead style={sessionManagementStyles.tableHead}>
                      <tr>
                        <th style={sessionManagementStyles.th}>ID</th>
                        <th style={sessionManagementStyles.th}>Môn học</th>
                        <th style={sessionManagementStyles.th}>Lớp</th>
                        <th style={sessionManagementStyles.th}>Giảng viên</th>
                        <th style={sessionManagementStyles.th}>Ngày</th>
                        <th style={sessionManagementStyles.th}>Thời gian</th>
                        <th style={sessionManagementStyles.th}>Trạng thái</th>
                        <th style={sessionManagementStyles.th}>Điểm danh</th>
                        <th style={sessionManagementStyles.th}>Tỷ lệ</th>
                        <th style={sessionManagementStyles.th}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((session) => {
                        const attendanceRate = session.total_students > 0 
                          ? ((session.present_count + session.late_count) / session.total_students * 100).toFixed(1)
                          : 0;

                        return (
                          <tr key={session.id}>
                            <td style={sessionManagementStyles.td}>
                              #{session.id}
                            </td>
                            <td style={sessionManagementStyles.td}>
                              <div style={{ fontWeight: '500' }}>{session.subject}</div>
                            </td>
                            <td style={sessionManagementStyles.td}>
                              {session.class_name}
                            </td>
                            <td style={sessionManagementStyles.td}>
                              {session.teacher_name}
                            </td>
                            <td style={sessionManagementStyles.td}>
                              {new Date(session.session_date).toLocaleDateString('vi-VN')}
                            </td>
                            <td style={sessionManagementStyles.td}>
                              <div>{session.start_time}</div>
                              {session.end_time && (
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  - {session.end_time}
                                </div>
                              )}
                            </td>
                            <td style={sessionManagementStyles.td}>
                              <span style={{
                                ...sessionManagementStyles.statusBadge,
                                ...(session.is_active 
                                  ? sessionManagementStyles.statusActive 
                                  : sessionManagementStyles.statusInactive
                                )
                              }}>
                                <i className={`fas fa-${session.is_active ? 'play' : 'stop'}`}></i>
                                {session.is_active ? 'Hoạt động' : 'Đã kết thúc'}
                              </span>
                            </td>
                            <td style={sessionManagementStyles.td}>
                              <div style={{ fontSize: '0.875rem' }}>
                                <div style={{ color: '#10b981' }}>
                                  Có mặt: {session.present_count || 0}
                                </div>
                                <div style={{ color: '#f59e0b' }}>
                                  Muộn: {session.late_count || 0}
                                </div>
                                <div style={{ color: '#ef4444' }}>
                                  Vắng: {session.absent_count || 0}
                                </div>
                              </div>
                            </td>
                            <td style={sessionManagementStyles.td}>
                              <div style={{ 
                                fontWeight: '600',
                                color: attendanceRate >= 80 ? '#10b981' : 
                                       attendanceRate >= 60 ? '#f59e0b' : '#ef4444'
                              }}>
                                {attendanceRate}%
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {session.present_count + session.late_count}/{session.total_students}
                              </div>
                            </td>
                            <td style={sessionManagementStyles.td}>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                  style={{
                                    ...sessionManagementStyles.actionBtn,
                                    ...sessionManagementStyles.viewBtn
                                  }}
                                  onClick={() => handleViewDetails(session)}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = sessionManagementStyles.viewBtnHover.background;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = sessionManagementStyles.viewBtn.background;
                                  }}
                                  title="Xem chi tiết"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>

                                {session.is_active && (
                                  <button
                                    style={{
                                      ...sessionManagementStyles.actionBtn,
                                      ...sessionManagementStyles.stopBtn
                                    }}
                                    onClick={() => handleStopSession(session.id)}
                                    onMouseEnter={(e) => {
                                      e.target.style.background = sessionManagementStyles.stopBtnHover.background;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.background = sessionManagementStyles.stopBtn.background;
                                    }}
                                    disabled={actionLoading}
                                    title="Kết thúc phiên"
                                  >
                                    <i className="fas fa-stop"></i>
                                  </button>
                                )}

                                <button
                                  style={{
                                    ...sessionManagementStyles.actionBtn,
                                    ...sessionManagementStyles.deleteBtn
                                  }}
                                  onClick={() => handleDeleteSession(session.id)}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = sessionManagementStyles.deleteBtnHover.background;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = sessionManagementStyles.deleteBtn.background;
                                  }}
                                  disabled={actionLoading}
                                  title="Xóa phiên"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Session Details Modal */}
      <SessionDetailsModal
        session={selectedSession}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </div>
  );
};

export default AttendanceSessionManagement;