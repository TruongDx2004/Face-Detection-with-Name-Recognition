import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import Sidebar from '../../components/layout/Sidebar';
import NavBar from '../../components/layout/NavBar';

// --- STYLES OBJECT (updated for layout) ---
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
  dashboardContent: { 
    flex: 1, 
    padding: '30px', 
    overflow: 'auto' 
  },
  statsGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
    gap: '12px', 
    marginBottom: '30px' 
  },
  statCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    padding: '24px', 
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
    border: '1px solid #e2e8f0', 
    transition: 'all 0.3s ease', 
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
  timetableContainer: { 
    overflowX: 'auto', 
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
  currentDayHeader: { 
    backgroundColor: '#e0f2fe', 
    color: '#0284c7' 
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
  schedulePopover: { 
    position: 'fixed', 
    backgroundColor: 'white', 
    borderRadius: '8px', 
    boxShadow: '0 5px 25px rgba(0,0,0,0.15)', 
    border: '1px solid #e2e8f0', 
    zIndex: 20, 
    width: '220px', 
    overflow: 'hidden', 
    padding: '8px 0' 
  },
  popoverItem: { 
    padding: '10px 16px', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px', 
    fontSize: '14px' 
  },
  popoverItemHover: { 
    backgroundColor: '#f8fafc' 
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
};

// --- HELPER & CHILD COMPONENTS (keep existing ones) ---

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

const StatsCard = ({ title, value, icon, color }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      style={{ ...styles.statCard, ...(isHovered ? styles.statCardHover : {}) }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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

const ScheduleBlock = ({ schedule, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      style={{ ...styles.scheduleBlock, ...(isHovered ? styles.scheduleBlockHover : {}) }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => onClick(e, schedule)}
    >
      <div>
        <div style={styles.scheduleTitle}>{schedule.subject_name}</div>
        <div style={styles.scheduleClass}>Lớp: {schedule.class_name}</div>
      </div>
      <div style={styles.scheduleTime}>{schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}</div>
    </div>
  );
};

const ScheduleActionPopover = ({ position, schedule, session, onClose, onStartSession, onViewSession, onViewClass }) => {
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const PopoverItem = ({ icon, text, onClick, color = '#374151' }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
      <div
        style={{ ...styles.popoverItem, ...(isHovered ? styles.popoverItemHover : {}), color }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        <i className={icon} style={{ width: '20px', textAlign: 'center' }}></i>
        <span>{text}</span>
      </div>
    );
  };

  return (
    <div ref={popoverRef} style={{ ...styles.schedulePopover, top: position.y, left: position.x }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: '600' }}>{schedule.subject_name}</div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>Lớp: {schedule.class_name}</div>
      </div>
      <PopoverItem icon="fas fa-play-circle" text="Bắt đầu phiên điểm danh" onClick={() => onStartSession(schedule)} color="#10b981" />
      <PopoverItem icon="fas fa-users" text="Xem danh sách lớp" onClick={() => onViewClass(schedule.class_id)} />
    </div>
  );
};

const SessionDetailModal = ({ session, onClose, showNotification, onSessionEnd }) => {
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
      const response = await ApiService.getSessionAttendance(session.id);
      if (response.success) {
        setAttendanceData(response.data);
        console.log("ddd" + session);
        const studentsResponse = await ApiService.getClassStudents(session.class_id);
        if (studentsResponse.success) {
          setAvailableStudents(studentsResponse.data.students || []);
        }
      } else {
        setError(response.message || 'Không thể tải dữ liệu phiên điểm danh');
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
        loadSessionData();
      } else {
        showNotification(`Lỗi: ${response.message || 'Không thể điểm danh'}`, 'error');
      }
    } catch (err) {
      showNotification(`${err.message}`, 'error');
    }
  };

  const handleEndSession = () => {
    if (window.confirm('Bạn có chắc muốn kết thúc phiên điểm danh này?')) {
      ApiService.endSession(session.id).then(() => {
        showNotification('Đã kết thúc phiên điểm danh', 'success');
        if (onSessionEnd) onSessionEnd();
        onClose();
      }).catch(err => {
        showNotification(`Lỗi kết thúc phiên: ${err.message}`, 'error');
      });
    }
  };

  const handleExportExcel = () => {
    if (!attendanceData) return;
    const headers = ['STT', 'Mã SV', 'Họ tên', 'Trạng thái', 'Thời gian điểm danh', 'Độ tin cậy'];
    const rows = [
      headers,
      ...attendanceData.students.map((student, index) => [
        index + 1, 
        student.student_code || '', 
        student.full_name || '',
        student.status === 'present' ? 'Có mặt' : student.status === 'late' ? 'Trễ' : 'Vắng',
        student.attendance?.attendance_time ? new Date(student.attendance.attendance_time).toLocaleString('vi-VN') : '',
        student.attendance?.confidence_score ? Math.round(student.attendance.confidence_score) + '%' : ''
      ])
    ];
    const csvContent = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
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
          <h3 style={styles.modalTitle}>{session.subject} - {session.class_name}</h3>
          <button style={styles.closeButton} onClick={onClose}><i className="fas fa-times"></i></button>
        </div>
        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} onRetry={loadSessionData} />}
        {attendanceData && (
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {session.is_active && <button style={{ ...styles.button, ...styles.buttonDanger }} onClick={handleEndSession}><i className="fas fa-stop"></i>Kết thúc phiên</button>}
              <button style={{ ...styles.button, ...styles.buttonWarning }} onClick={handleExportExcel}><i className="fas fa-file-excel"></i>Xuất Excel</button>
            </div>
            {session.is_active && (
              <div style={{ marginBottom: '20px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Điểm danh thủ công</h4>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
                  <div style={{ flex: 1 }}>
                    <select value={manualStudentId} onChange={(e) => setManualStudentId(e.target.value)} style={styles.formInput}>
                      <option value="">Chọn sinh viên...</option>
                      {(Array.isArray(availableStudents) ? availableStudents : [])
                        .filter(student => !attendanceData.students.find(att => att.id === student.id && att.status === 'present'))
                        .map(student => <option key={student.id} value={student.id}>{student.student_code} - {student.full_name}</option>)}
                    </select>
                  </div>
                  <button style={{ ...styles.button, ...styles.buttonPrimary }} onClick={handleManualAttendance} disabled={!manualStudentId}><i className="fas fa-user-check"></i>Điểm danh</button>
                </div>
              </div>
            )}
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Danh sách điểm danh ({attendanceData.summary?.present || 0}/{attendanceData.summary?.total || 0})</h4>
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
                    {attendanceData.students?.map((student, index) => (
                      <tr key={student.id}>
                        <td style={styles.tableCell}>{index + 1}</td>
                        <td style={styles.tableCell}>{student.student_code}</td>
                        <td style={styles.tableCell}>{student.full_name}</td>
                        <td style={styles.tableCell}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '12px', 
                            fontWeight: '500', 
                            backgroundColor: student.status === 'present' ? '#dcfce7' : '#fef2f2', 
                            color: student.status === 'present' ? '#16a34a' : '#dc2626' 
                          }}>
                            {student.status === 'present' ? 'Có mặt' : 'Vắng'}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          {student.attendance?.attendance_time ? new Date(student.attendance.attendance_time).toLocaleTimeString('vi-VN') : '-'}
                        </td>
                        <td style={styles.tableCell}>
                          {student.attendance?.confidence_score ? Math.round(student.attendance.confidence_score) + '%' : '-'}
                        </td>
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

// --- MAIN TEACHER DASHBOARD COMPONENT ---

const TeacherDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [popover, setPopover] = useState({ visible: false, schedule: null, session: null, position: { x: 0, y: 0 } });

  const navigate = useNavigate();
  const { notifications, showNotification, removeNotification } = useNotification();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [schedulesRes, sessionsRes, profileRes] = await Promise.all([
        ApiService.getSchedules({ teacher_id: 'current' }),
        ApiService.getTeacherSessions(),
        ApiService.getProfile()
      ]);
      const loadedSchedules = schedulesRes.success ? schedulesRes.data.schedules || [] : [];
      const loadedSessions = sessionsRes.success ? sessionsRes.data.sessions || [] : [];
      if (profileRes.success) setCurrentUser(profileRes.data);
      setSchedules(loadedSchedules);
      setSessions(loadedSessions);
      setStatistics({
        totalSchedules: loadedSchedules.length,
        totalSessions: loadedSessions.length,
        activeSessions: loadedSessions.filter(s => s.is_active).length,
        todaysSessions: loadedSessions.filter(s => new Date(s.session_date).toDateString() === new Date().toDateString()).length
      });
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

  const timetableData = useMemo(() => {
    const processed = {};
    if (!Array.isArray(schedules)) return processed;

    schedules.forEach(schedule => {
      const day = parseInt(schedule.weekday, 10);
      if (isNaN(day)) return;

      if (!processed[day]) processed[day] = [];
      processed[day].push(schedule);
    });
    return processed;
  }, [schedules]);

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      authService.logout();
      navigate('/');
    }
  };

  const handleScheduleClick = (event, schedule) => {
    event.stopPropagation();
    const todayString = new Date().toISOString().split('T')[0];
    const existingSession = sessions.find(s =>
      s.schedule_id === schedule.id 
      && new Date(s.created_at).toISOString().split('T')[0] === todayString
    );

    const rect = event.currentTarget.getBoundingClientRect();
    setPopover({
      visible: true,
      schedule: schedule,
      session: existingSession,
      position: { x: rect.left, y: rect.bottom + 5 }
    });
  };

  const handleStartSession = async (schedule) => {
    setPopover({ visible: false });
    try {
      const response = await ApiService.createAttendanceSession({
        course_section_id: schedule.course_section_id,
        session_date: new Date().toISOString().split('T')[0],
        session_name: `${schedule.subject_name} - ${new Date().toLocaleDateString('vi-VN')}`
      });
      if (response.success) {
        showNotification('Tạo phiên điểm danh thành công!', 'success');
        await loadDashboardData();
        const newSession = response.data;
        setSelectedSession({
          ...newSession,
          subject: schedule.subject_name,
          class_name: schedule.class_name,
          is_active: true,
          id: newSession.session_id
        });
        setShowSessionModal(true);
      } else {
        showNotification(`Lỗi: ${response.message || 'Không thể tạo phiên điểm danh'}`, 'error');
      }
    } catch (err) {
      showNotification(`${err.message}`, 'error');
    }
  };

  const handleViewSession = (session) => {
    setPopover({ visible: false });
    setSelectedSession(session);
    setShowSessionModal(true);
  };

  const handleViewClass = (classId) => {
    setPopover({ visible: false });
    navigate(`/teacher/classes/${classId}`);
    showNotification(`Chuyển đến chi tiết lớp học`, 'info');
  };

  if (loading) {
    return (
      <div style={styles.appContainer}>
        <Sidebar />
        <div style={styles.mainContent}>
          <NavBar user={currentUser} onLogout={handleLogout} />
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.appContainer}>
        <Sidebar />
        <div style={styles.mainContent}>
          <NavBar user={currentUser} onLogout={handleLogout} />
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

      <Sidebar />
      <div style={styles.mainContent}>
        <NavBar user={currentUser} onLogout={handleLogout} />
        
        <div style={styles.dashboardContent}>
          {/* Statistics Cards */}
          <div style={styles.statsGrid}>
            <StatsCard
              title="Tổng lịch học"
              value={statistics?.totalSchedules || 0}
              icon="fas fa-calendar-alt"
              color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            />
            <StatsCard
              title="Tổng phiên điểm danh"
              value={statistics?.totalSessions || 0}
              icon="fas fa-clipboard-check"
              color="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            />
            <StatsCard
              title="Phiên đang diễn ra"
              value={statistics?.activeSessions || 0}
              icon="fas fa-play-circle"
              color="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            />
            <StatsCard
              title="Phiên hôm nay"
              value={statistics?.todaysSessions || 0}
              icon="fas fa-calendar-day"
              color="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            />
          </div>

          {/* Weekly Timetable */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                <i className="fas fa-calendar-week"></i>
                Thời khóa biểu tuần
              </h2>
              <button
                style={{ ...styles.button, ...styles.buttonSecondary }}
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
                    <th style={styles.timetableHeaderCell}>Giờ</th>
                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].map((day, index) => {
                      const today = new Date().getDay();
                      const dayIndex = index + 1;
                      return (
                        <th
                          key={day}
                          style={{
                            ...styles.timetableHeaderCell,
                            ...(today === dayIndex ? styles.currentDayHeader : {})
                          }}
                        >
                          {day}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 12 }, (_, hour) => {
                    const timeSlot = `${(hour + 7).toString().padStart(2, '0')}:00`;
                    return (
                      <tr key={hour}>
                        <td style={styles.timetableTimeCell}>{timeSlot}</td>
                        {[1, 2, 3, 4, 5, 6, 7].map(day => {
                          const daySchedules = timetableData[day] || [];
                          const scheduleInSlot = daySchedules.find(schedule => {
                            const startHour = parseInt(schedule.start_time.split(':')[0]);
                            const endHour = parseInt(schedule.end_time.split(':')[0]);
                            return hour + 7 >= startHour && hour + 7 < endHour;
                          });

                          return (
                            <td key={day} style={styles.timetableCell}>
                              {scheduleInSlot && (
                                <ScheduleBlock
                                  schedule={scheduleInSlot}
                                  onClick={handleScheduleClick}
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Popover */}
          {popover.visible && (
            <ScheduleActionPopover
              position={popover.position}
              schedule={popover.schedule}
              session={popover.session}
              onClose={() => setPopover({ visible: false })}
              onStartSession={handleStartSession}
              onViewSession={handleViewSession}
              onViewClass={handleViewClass}
            />
          )}

          {/* Session Modal */}
          {showSessionModal && selectedSession && (
            <SessionDetailModal
              session={selectedSession}
              onClose={() => setShowSessionModal(false)}
              showNotification={showNotification}
              onSessionEnd={loadDashboardData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export { LoadingSpinner, ErrorMessage, StatsCard, ScheduleBlock, ScheduleActionPopover, SessionDetailModal };
export default TeacherDashboard;
