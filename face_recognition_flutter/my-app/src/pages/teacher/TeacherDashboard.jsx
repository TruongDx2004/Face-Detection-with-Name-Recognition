import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';


// CSS-in-JS styles similar to AdminDashboard
const styles = {
  // Base container styles
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

  // Header styles
  header: {
    backgroundColor: '#ffffff',
    padding: '20px 30px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a202c',
    margin: 0
  },
  headerTime: {
    fontSize: '16px',
    color: '#64748b',
    fontWeight: '500'
  },

  // Content area styles
  dashboardContent: {
    flex: 1,
    padding: '30px',
    overflow: 'auto'
  },

  // Stats grid styles
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden'
  },
  statCardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    color: '#ffffff'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500'
  },

  // Section styles
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

  // Timetable styles
  timetableContainer: {
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: '600px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px'
  },
  timetableTable: {
    width: '100%',
    minWidth: '800px',
    borderCollapse: 'collapse',
    backgroundColor: '#ffffff'
  },
  timetableHeaderCell: {
    padding: '16px 12px',
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
    borderRight: '1px solid #e2e8f0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  timetableTimeCell: {
    padding: '16px 12px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    borderRight: '2px solid #e2e8f0',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    minWidth: '100px',
    position: 'sticky',
    left: 0,
    zIndex: 5
  },
  timetableCell: {
    padding: '8px',
    borderBottom: '1px solid #e2e8f0',
    borderRight: '1px solid #e2e8f0',
    minHeight: '60px',
    verticalAlign: 'top',
    position: 'relative'
  },
  scheduleBlock: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    borderRadius: '8px',
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: '80px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  scheduleBlockHover: {
    backgroundColor: '#2563eb',
    transform: 'scale(1.02)'
  },
  scheduleTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '4px'
  },
  scheduleClass: {
    fontSize: '12px',
    opacity: 0.9,
    marginBottom: '4px'
  },
  scheduleTime: {
    fontSize: '11px',
    opacity: 0.8
  },

  // Button styles
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
    color: '#e05a5aff',
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
  buttonDanger: {
    backgroundColor: '#ef4444',
    color: '#ffffff'
  },

  // Modal styles
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
    maxWidth: '800px',
    maxHeight: '80vh',
    width: '90%',
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

  // Table styles
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

  // Form styles
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
  formInputFocus: {
    borderColor: '#3b82f6',
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },

  // Loading and error states
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
  success: {
    padding: '20px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    color: '#16a34a',
    fontSize: '14px'
  }
};

// Helper components
const LoadingSpinner = () => (
  <div style={styles.loading}>
    <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
    Đang tải...
  </div>
);

const ErrorMessage = ({ message, onRetry }) => (
  <div style={styles.error}>
    <i className="fas fa-exclamation-triangle" style={{ marginRight: '10px' }}></i>
    {message}
    {onRetry && (
      <button
        onClick={onRetry}
        style={{ ...styles.button, ...styles.buttonPrimary, marginLeft: '10px' }}
      >
        Thử lại
      </button>
    )}
  </div>
);

// Stats Card Component
const StatsCard = ({ title, value, icon, color, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        ...styles.statCard,
        ...(isHovered ? styles.statCardHover : {})
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div style={styles.statHeader}>
        <div style={{ ...styles.statIcon, background: color }}>
          <i className={icon}></i>
        </div>
      </div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{title}</div>
    </div>
  );
};

// Session Detail Modal Component
const SessionDetailModal = ({ session, onClose, onCreateSession, onManualAttendance, onExportExcel, showNotification }) => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manualStudentId, setManualStudentId] = useState('');
  const [availableStudents, setAvailableStudents] = useState([]);

  useEffect(() => {
    if (session) {
      loadSessionData();
    }
  }, [session]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load session attendance data
      const response = await ApiService.getSessionAttendance(session.id);
      if (response.success) {
        setAttendanceData(response.data);

        // Load available students for manual attendance
        const studentsResponse = await ApiService.getClassStudents(session.class_id);
        if (studentsResponse.success) {
          setAvailableStudents(studentsResponse.data || []);
        }
      } else {
        setError(response.error || 'Không thể tải dữ liệu phiên điểm danh');
      }
    } catch (err) {
      setError('Lỗi kết nối: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAttendance = async () => {
    if (!manualStudentId) {
      showNotification('Vui lòng chọn sinh viên', 'warning');
      return;
    }

    try {
      const response = await ApiService.markAttendanceManual(session.id, manualStudentId);
      if (response.success) {
        showNotification('Điểm danh thủ công thành công!', 'success');
        setManualStudentId('');
        loadSessionData(); // Reload data
      } else {
        showNotification('Lỗi: ' + response.error, 'error');
      }
    } catch (err) {
      showNotification('Lỗi: ' + err.message, 'error');
    }
  };

  const handleExportExcel = () => {
    if (!attendanceData) return;

    // Create CSV content
    const headers = ['STT', 'Mã SV', 'Họ tên', 'Trạng thái', 'Thời gian điểm danh', 'Độ tin cậy'];
    const rows = [
      headers,
      ...attendanceData.attendances.map((att, index) => [
        index + 1,
        att.student_code || '',
        att.student_name || '',
        att.status === 'present' ? 'Có mặt' : att.status === 'late' ? 'Trễ' : 'Vắng',
        att.attendance_time ? new Date(att.attendance_time).toLocaleString('vi-VN') : '',
        att.confidence_score ? Math.round(att.confidence_score) + '%' : ''
      ]),
      ...attendanceData.absent_students.map((student, index) => [
        attendanceData.attendances.length + index + 1,
        student.student_code || '',
        student.student_name || '',
        'Vắng',
        '',
        ''
      ])
    ];

    const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diem-danh-${session.subject}-${session.class_name}-${session.session_date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!session) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>
            {session.subject} - {session.class_name}
          </h3>
          <button style={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {loading && <LoadingSpinner />}

        {error && <ErrorMessage message={error} onRetry={loadSessionData} />}

        {attendanceData && (
          <div>
            {/* Session Info */}
            <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <strong>Ngày học:</strong> {new Date(session.session_date).toLocaleDateString('vi-VN')}
                </div>
                <div>
                  <strong>Thời gian:</strong> {session.start_time} - {session.end_time || 'Đang diễn ra'}
                </div>
                <div>
                  <strong>Trạng thái:</strong> {session.is_active ? 'Đang diễn ra' : 'Đã kết thúc'}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0369a1' }}>
                  {attendanceData.statistics.total_students}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Tổng SV</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                  {attendanceData.statistics.present}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Có mặt</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>
                  {attendanceData.statistics.late}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Trễ</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                  {attendanceData.statistics.absent}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Vắng</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {session.is_active === 1 && (
                <button
                  style={{ ...styles.button, ...styles.buttonSuccess }}
                  onClick={() => onCreateSession && onCreateSession(session)}
                >
                  <i className="fas fa-play"></i>
                  Bắt đầu điểm danh
                </button>
              )}

              <button
                style={{ ...styles.button, ...styles.buttonWarning }}
                onClick={handleExportExcel}
              >
                <i className="fas fa-file-excel"></i>
                Xuất Excel
              </button>

              {session.is_active === 1 && (
                <button
                  style={{ ...styles.button, ...styles.buttonSecondary }}
                  onClick={() => {
                    if (window.confirm('Bạn có chắc muốn kết thúc phiên điểm danh này?')) {
                      ApiService.endSession(session.id).then(() => {
                        showNotification('Đã kết thúc phiên điểm danh', 'success');
                        onClose();
                      }).catch(err => {
                        showNotification('Lỗi khi kết thúc phiên: ' + err.message, 'error');
                      });
                    }
                  }}
                >
                  <i className="fas fa-stop"></i>
                  Kết thúc phiên
                </button>
              )}
            </div>

            {/* Manual Attendance */}
            {session.is_active === 1 && availableStudents.length > 0 && (
              <div style={{ marginBottom: '20px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Điểm danh thủ công</h4>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
                  <div style={{ flex: 1 }}>
                    <select
                      value={manualStudentId}
                      onChange={(e) => setManualStudentId(e.target.value)}
                      style={styles.formInput}
                    >
                      <option value="">Chọn sinh viên...</option>
                      {availableStudents
                        .filter(student => !attendanceData.attendances.find(att => att.student_id === student.id))
                        .map(student => (
                          <option key={student.id} value={student.id}>
                            {student.student_code} - {student.full_name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <button
                    style={{ ...styles.button, ...styles.buttonPrimary }}
                    onClick={handleManualAttendance}
                    disabled={!manualStudentId}
                  >
                    <i className="fas fa-user-check"></i>
                    Điểm danh
                  </button>
                </div>
              </div>
            )}

            {/* Attendance List */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Danh sách điểm danh</h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table style={styles.table}>
                  <thead style={styles.tableHeader}>
                    <tr>
                      <th style={styles.tableHeaderCell}>STT</th>
                      <th style={styles.tableHeaderCell}>Mã SV</th>
                      <th style={styles.tableHeaderCell}>Họ tên</th>
                      <th style={styles.tableHeaderCell}>Trạng thái</th>
                      <th style={styles.tableHeaderCell}>Thời gian</th>
                      <th style={styles.tableHeaderCell}>Độ tin cậy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.attendances.map((attendance, index) => (
                      <tr key={attendance.id}>
                        <td style={styles.tableCell}>{index + 1}</td>
                        <td style={styles.tableCell}>{attendance.student_code}</td>
                        <td style={styles.tableCell}>{attendance.student_name}</td>
                        <td style={styles.tableCell}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: attendance.status === 'present' ? '#dcfce7' : '#fef3c7',
                            color: attendance.status === 'present' ? '#16a34a' : '#d97706'
                          }}>
                            {attendance.status === 'present' ? 'Có mặt' : 'Trễ'}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          {new Date(attendance.attendance_time).toLocaleTimeString('vi-VN')}
                        </td>
                        <td style={styles.tableCell}>
                          {attendance.confidence_score ? Math.round(attendance.confidence_score) + '%' : 'N/A'}
                        </td>
                      </tr>
                    ))}
                    {attendanceData.absent_students.map((student, index) => (
                      <tr key={`absent-${student.student_id}`}>
                        <td style={styles.tableCell}>{attendanceData.attendances.length + index + 1}</td>
                        <td style={styles.tableCell}>{student.student_code}</td>
                        <td style={styles.tableCell}>{student.student_name}</td>
                        <td style={styles.tableCell}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626'
                          }}>
                            Vắng
                          </span>
                        </td>
                        <td style={styles.tableCell}>-</td>
                        <td style={styles.tableCell}>-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Teacher Dashboard Component
const TeacherDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const navigate = useNavigate();

  const { notifications, showNotification, removeNotification } = useNotification();


  
  // Time slots for timetable
  const timeSlots = [
    '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
  ];

  // Days of week
  const daysOfWeek = [
    { key: 2, name: 'Thứ 2' },
    { key: 3, name: 'Thứ 3' },
    { key: 4, name: 'Thứ 4' },
    { key: 5, name: 'Thứ 5' },
    { key: 6, name: 'Thứ 6' },
    { key: 7, name: 'Thứ 7' },
    { key: 1, name: 'Chủ nhật' }
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load teacher's schedules
      const schedulesResponse = await ApiService.getSchedules({ teacher_id: 'current' });
      if (schedulesResponse.success) {
        setSchedules(schedulesResponse.data.schedules || []);
      }
      console.log('Schedules:', schedulesResponse);
      // Load teacher's sessions
      const sessionsResponse = await ApiService.getTeacherSessions();
      if (sessionsResponse.success) {
        setSessions(sessionsResponse.data.sessions || []);
      }
      console.log('Sessions:', sessionsResponse);

      // Calculate statistics
      const stats = {
        totalSchedules: sessionsResponse.data.sessions.length || 0,
        totalSessions: sessionsResponse.data.sessions.length || 0,
        activeSessions: sessionsResponse.data.sessions?.filter(s => s.is_active).length || 0,
        todaysSessions: sessionsResponse.data.sessions?.filter(s =>
          new Date(s.session_date).toDateString() === new Date().toDateString()
        ).length || 0
      };
      setStatistics(stats);

    } catch (err) {
      setError('Lỗi kết nốiii: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getSchedulesForSlot = (timeSlot, weekday) => {
    const [startTime] = timeSlot.split('-');
    const slotStart = timeToMinutes(startTime);

    return schedules.filter(schedule => {
      if (schedule.weekday !== weekday) return false;
      const scheduleStart = timeToMinutes(schedule.start_time);
      return scheduleStart === slotStart;
    });
  };

  const calculateRowSpan = (schedule) => {
    const startMinutes = timeToMinutes(schedule.start_time);
    const endMinutes = timeToMinutes(schedule.end_time);
    const duration = endMinutes - startMinutes;
    return Math.ceil(duration / 60);
  };

  const handleScheduleClick = async (schedule) => {
    try {
      // Create new session for this schedule
      const sessionData = {
        schedule_id: schedule.id,
        session_date: new Date().toISOString().split('T')[0],
        class_id: schedule.class_id,
        subject_id: schedule.subject_id
      };

      const response = await ApiService.createAttendanceSession(sessionData);
      if (response.success) {
        // Set selected session and show modal
        setSelectedSession({
          id: response.data.session_id,
          schedule_id: schedule.id,
          class_id: schedule.class_id,
          subject_id: schedule.subject_id,
          subject: schedule.subject_name,
          class_name: schedule.class_name,
          session_date: sessionData.session_date,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          is_active: true
        });
        setShowSessionModal(true);
        loadDashboardData(); // Refresh data
        showNotification('Tạo phiên điểm danh thành công!', 'success');
      } else {
        showNotification('Lỗi tạo phiên điểm danh: ' + response.error, 'error');
      }
    } catch (err) {
      showNotification('Lỗi: ' + err.message, 'error');
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const getCurrentTime = () => {
    return new Date().toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <ErrorMessage message={error} onRetry={loadDashboardData} />
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

        {/* Header */}
        <header style={styles.header}>
          <div>
            <button style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'rgba(230, 30, 30, 0.7)',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease-in-out',
              display: 'flex',
              alignItems: 'center',
            }} onClick={() => setShowConfirm(true)}
            >
              <i className="fas fa-sign-out-alt"></i>
              {<span>Đăng xuất</span>}
            </button>
          </div>
          <h1 style={styles.headerTitle}>
            <i className="fas fa-chalkboard-teacher" style={{ marginRight: '12px', color: '#3b82f6' }}></i>
            Bảng điều khiển Giáo viên
          </h1>
          <div style={styles.headerTime}>
            <i className="fas fa-clock" style={{ marginRight: '8px' }}></i>
            {getCurrentTime()}
          </div>

        </header>

        {/* Xác nhận đăng xuất */}
        {showConfirm && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#1f2937',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              textAlign: 'center',
              maxWidth: '300px',
              color: 'white'
            }}>
              <h3 style={{ margin: '0 0 1rem 0' }}>Xác nhận đăng xuất</h3>
              <p style={{ margin: '0 0 1.5rem 0', color: '#d1d5db' }}>
                Bạn có chắc muốn đăng xuất khỏi hệ thống?
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setShowConfirm(false);
                    handleLogout();
                  }}
                >
                  Đăng xuất
                </button>
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowConfirm(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={styles.dashboardContent}>
          {/* Statistics */}
          <div style={styles.statsGrid}>
            <StatsCard
              title="Tổng lịch dạy"
              value={statistics?.totalSchedules || 0}
              icon="fas fa-calendar"
              color="#3b82f6"
            />
            <StatsCard
              title="Tổng phiên điểm danh"
              value={statistics?.totalSessions || 0}
              icon="fas fa-clipboard-check"
              color="#10b981"
            />
            <StatsCard
              title="Phiên đang diễn ra"
              value={statistics?.activeSessions || 0}
              icon="fas fa-play-circle"
              color="#f59e0b"
            />
            <StatsCard
              title="Phiên hôm nay"
              value={statistics?.todaysSessions || 0}
              icon="fas fa-calendar-day"
              color="#ef4444"
            />
          </div>

          {/* Timetable */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                <i className="fas fa-table"></i>
                Thời khóa biểu
              </h2>
              <button
                style={{ ...styles.button, ...styles.buttonPrimary }}
                onClick={loadDashboardData}
              >
                <i className="fas fa-sync-alt"></i>
                Làm mới
              </button>
            </div>

            <div style={styles.timetableContainer}>
              <table style={styles.timetableTable}>
                <thead>
                  <tr>
                    <th style={styles.timetableHeaderCell}>Thời gian</th>
                    {daysOfWeek.map(day => (
                      <th key={day.key} style={styles.timetableHeaderCell}>
                        {day.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((timeSlot, slotIndex) => (
                    <tr key={timeSlot}>
                      <td style={styles.timetableTimeCell}>
                        {timeSlot}
                      </td>
                      {daysOfWeek.map(day => {
                        const slotSchedules = getSchedulesForSlot(timeSlot, day.key);
                        const schedule = slotSchedules[0];

                        if (!schedule) {
                          return <td key={day.key} style={styles.timetableCell}></td>;
                        }

                        // Check if this schedule starts at this time slot
                        const scheduleStartMinutes = timeToMinutes(schedule.start_time);
                        const slotStartMinutes = timeToMinutes(timeSlot.split('-')[0]);

                        if (scheduleStartMinutes !== slotStartMinutes) {
                          return <td key={day.key} style={styles.timetableCell}></td>;
                        }

                        const rowSpan = calculateRowSpan(schedule);


                        return (
                          <td
                            key={day.key}
                            style={styles.timetableCell}
                            rowSpan={rowSpan}
                          >
                            <div
                              style={{
                                ...styles.scheduleBlock,
                                ...(isHovered ? styles.scheduleBlockHover : {})
                              }}
                              onMouseEnter={() => setIsHovered(true)}
                              onMouseLeave={() => setIsHovered(false)}
                              onClick={() => handleScheduleClick(schedule)}
                            >
                              <div>
                                <div style={styles.scheduleTitle}>
                                  {schedule.subject_name}
                                </div>
                                <div style={styles.scheduleClass}>
                                  Lớp: {schedule.class_name}
                                </div>
                              </div>
                              <div style={styles.scheduleTime}>
                                {schedule.start_time} - {schedule.end_time}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Sessions */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                <i className="fas fa-history"></i>
                Phiên điểm danh gần đây
              </h2>
            </div>

            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <i className="fas fa-calendar-times" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                <p>Chưa có phiên điểm danh nào</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead style={styles.tableHeader}>
                    <tr>
                      <th style={styles.tableHeaderCell}>Môn học</th>
                      <th style={styles.tableHeaderCell}>Lớp</th>
                      <th style={styles.tableHeaderCell}>Ngày</th>
                      <th style={styles.tableHeaderCell}>Thời gian</th>
                      <th style={styles.tableHeaderCell}>Trạng thái</th>
                      <th style={styles.tableHeaderCell}>Số lượng điểm danh</th>
                      <th style={styles.tableHeaderCell}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0, 10).map((session) => (
                      <tr key={session.id}>
                        <td style={styles.tableCell}>{session.subject}</td>
                        <td style={styles.tableCell}>{session.class_name}</td>
                        <td style={styles.tableCell}>
                          {new Date(session.session_date).toLocaleDateString('vi-VN')}
                        </td>
                        <td style={styles.tableCell}>
                          {session.start_time}
                          {session.end_time && ` - ${session.end_time}`}
                        </td>
                        <td style={styles.tableCell}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: session.is_active ? '#dcfce7' : '#f1f5f9',
                            color: session.is_active ? '#16a34a' : '#64748b'
                          }}>
                            {session.is_active ? 'Đang diễn ra' : 'Đã kết thúc'}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          {session.total_attendances || 0}
                        </td>
                        <td style={styles.tableCell}>
                          <button
                            style={{ ...styles.button, ...styles.buttonPrimary, padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => {
                              setSelectedSession(session);
                              setShowSessionModal(true);
                            }}
                          >
                            <i className="fas fa-eye"></i>
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Session Detail Modal */}
        {showSessionModal && selectedSession && (
          <SessionDetailModal
            session={selectedSession}
            onClose={() => {
              setShowSessionModal(false);
              setSelectedSession(null);
            }}
            onCreateSession={(session) => {
              console.log('Creating session for:', session);
              // Handle session creation if needed
            }}
            onManualAttendance={(studentId) => {
              console.log('Manual attendance for student:', studentId);
              // Handle manual attendance
            }}
            onExportExcel={() => {
              console.log('Exporting Excel for session:', selectedSession);
              // Handle Excel export
            }}
            showNotification={showNotification}
          />
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;