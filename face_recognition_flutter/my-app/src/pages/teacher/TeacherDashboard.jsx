import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';

// --- STYLES OBJECT ---
const styles = {
  appContainer: { display: 'flex', minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
  mainContent: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'all 0.3s ease' },
  dashboardContent: { flex: 1, padding: '30px', overflow: 'auto' },
  header: { backgroundColor: '#ffffff', padding: '15px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)' },
  headerTitle: { fontSize: '24px', fontWeight: '700', color: '#1a202c', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '20px' },
  headerTime: { fontSize: '14px', color: '#64748b', fontWeight: '500' },
  userMenu: { position: 'relative' },
  userMenuButton: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
  userAvatar: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  userName: { fontWeight: '600', color: '#374151' },
  userMenuDropdown: { position: 'absolute', top: '50px', right: 0, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 100, width: '200px', overflow: 'hidden' },
  userMenuItem: { padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' },
  userMenuItemHover: { backgroundColor: '#f8fafc' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '30px' },
  statCard: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' },
  statCardHover: { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)' },
  statHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  statIcon: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#ffffff' },
  statValue: { fontSize: '32px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' },
  statLabel: { fontSize: '14px', color: '#64748b', fontWeight: '500' },
  section: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', border: '1px solid #e2e8f0' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '20px', fontWeight: '600', color: '#1a202c', display: 'flex', alignItems: 'center', gap: '10px' },
  timetableContainer: { overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' },
  timetableTable: { width: '100%', minWidth: '800px', borderCollapse: 'collapse', backgroundColor: '#ffffff' },
  timetableHeaderCell: { padding: '16px 12px', backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', borderRight: '1px solid #e2e8f0', fontSize: '14px', fontWeight: '600', color: '#374151', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10 },
  timetableTimeCell: { padding: '16px 12px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', borderRight: '2px solid #e2e8f0', fontSize: '13px', fontWeight: '600', color: '#374151', textAlign: 'center', minWidth: '100px', position: 'sticky', left: 0, zIndex: 5 },
  timetableCell: { padding: '8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', minHeight: '60px', verticalAlign: 'top', position: 'relative' },
  currentDayHeader: { backgroundColor: '#e0f2fe', color: '#0284c7' },
  scheduleBlock: { backgroundColor: '#3b82f6', color: '#ffffff', borderRadius: '8px', padding: '12px', cursor: 'pointer', transition: 'all 0.2s ease', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  scheduleBlockHover: { backgroundColor: '#2563eb', transform: 'scale(1.02)' },
  scheduleTitle: { fontSize: '14px', fontWeight: '600', marginBottom: '4px' },
  scheduleClass: { fontSize: '12px', opacity: 0.9, marginBottom: '4px' },
  scheduleTime: { fontSize: '11px', opacity: 0.8 },
  schedulePopover: { position: 'fixed', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 5px 25px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', zIndex: 20, width: '220px', overflow: 'hidden', padding: '8px 0' },
  popoverItem: { padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' },
  popoverItemHover: { backgroundColor: '#f8fafc' },
  button: { padding: '10px 20px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: '8px' },
  buttonPrimary: { backgroundColor: '#3b82f6', color: '#ffffff' },
  buttonSecondary: { backgroundColor: '#f1f5f9', color: '#374151', border: '1px solid #e2e8f0' },
  buttonSuccess: { backgroundColor: '#10b981', color: '#ffffff' },
  buttonWarning: { backgroundColor: '#f59e0b', color: '#ffffff' },
  buttonDanger: { backgroundColor: '#ef4444', color: '#ffffff' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', maxWidth: '800px', maxHeight: '80vh', width: '90%', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' },
  modalTitle: { fontSize: '20px', fontWeight: '600', color: '#1a202c' },
  closeButton: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '16px' },
  tableHeader: { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  tableHeaderCell: { padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' },
  tableCell: { padding: '12px', borderBottom: '1px solid #e2e8f0', fontSize: '14px', color: '#374151' },
  formGroup: { marginBottom: '16px' },
  formLabel: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' },
  formInput: { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', transition: 'border-color 0.2s ease' },
  formInputFocus: { borderColor: '#3b82f6', outline: 'none', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', fontSize: '16px', color: '#64748b' },
  error: { padding: '20px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px' },
};

// --- HELPER & CHILD COMPONENTS ---

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

const UserMenu = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  const LogoutItem = ({ onLogout }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
      <div
        style={{ ...styles.userMenuItem, ...(isHovered ? styles.userMenuItemHover : {}) }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onLogout}
      >
        <i className="fas fa-sign-out-alt" style={{ color: '#ef4444' }}></i>
        <span>Đăng xuất</span>
      </div>
    );
  };

  return (
    <div style={styles.userMenu} ref={menuRef}>
      <button style={styles.userMenuButton} onClick={() => setIsOpen(!isOpen)}>
        <div style={styles.userAvatar}>{getInitials(user?.full_name)}</div>
        <span style={styles.userName}>{user?.full_name || 'Teacher'}</span>
        <i className={`fas fa-chevron-down`} style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}></i>
      </button>
      {isOpen && (
        <div style={styles.userMenuDropdown}>
          <LogoutItem onLogout={onLogout} />
        </div>
      )}
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

  console.log("Rendering ScheduleActionPopover for schedule:", schedule, "session:", session); // DEBUG
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
      {/* <PopoverItem icon="fas fa-eye" text="Xem phiên điểm danh" onClick={() => onViewSession(session)} color="#3b82f6" /> */}
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
        const studentsResponse = await ApiService.getClassStudents(session.class_id);
        console.log("Loaded students for session:", studentsResponse.data); // DEBUG
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
      showNotification(`Lỗi hệ thống: ${err.message}`, 'error');
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
      ...attendanceData.attendances.map((att, index) => [
        index + 1, att.student_code || '', att.student_name || '',
        att.status === 'present' ? 'Có mặt' : att.status === 'late' ? 'Trễ' : 'Vắng',
        att.attendance_time ? new Date(att.attendance_time).toLocaleString('vi-VN') : '',
        att.confidence_score ? Math.round(att.confidence_score) + '%' : ''
      ]),
      ...attendanceData.absent_students.map((student, index) => [
        attendanceData.attendances.length + index + 1, student.student_code || '', student.student_name || '', 'Vắng', '', ''
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
              {session.is_active === 1 && <button style={{ ...styles.button, ...styles.buttonDanger }} onClick={handleEndSession}><i className="fas fa-stop"></i>Kết thúc phiên</button>}
              <button style={{ ...styles.button, ...styles.buttonWarning }} onClick={handleExportExcel}><i className="fas fa-file-excel"></i>Xuất Excel</button>
            </div>
            {session.is_active === 1 && (
              <div style={{ marginBottom: '20px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Điểm danh thủ công</h4>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
                  <div style={{ flex: 1 }}>
                    <select value={manualStudentId} onChange={(e) => setManualStudentId(e.target.value)} style={styles.formInput}>
                      <option value="">Chọn sinh viên...</option>
                      {(Array.isArray(availableStudents) ? availableStudents : [])
                        .filter(student => !attendanceData.attendances.find(att => att.student_id === student.id))
                        .map(student => <option key={student.id} value={student.id}>{student.student_code} - {student.full_name}</option>)}
                    </select>
                  </div>
                  <button style={{ ...styles.button, ...styles.buttonPrimary }} onClick={handleManualAttendance} disabled={!manualStudentId}><i className="fas fa-user-check"></i>Điểm danh</button>
                </div>
              </div>
            )}
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Danh sách điểm danh</h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table style={styles.table}>
                  <thead style={styles.tableHeader}>
                    <tr>
                      <th style={styles.tableHeaderCell}>STT</th><th style={styles.tableHeaderCell}>Mã SV</th><th style={styles.tableHeaderCell}>Họ tên</th>
                      <th style={styles.tableHeaderCell}>Trạng thái</th><th style={styles.tableHeaderCell}>Thời gian</th><th style={styles.tableHeaderCell}>Độ tin cậy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.attendances.map((att, index) => (
                      <tr key={att.id}>
                        <td style={styles.tableCell}>{index + 1}</td><td style={styles.tableCell}>{att.student_code}</td><td style={styles.tableCell}>{att.student_name}</td>
                        <td style={styles.tableCell}><span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', backgroundColor: att.status === 'present' ? '#dcfce7' : '#fef3c7', color: att.status === 'present' ? '#16a34a' : '#d97706' }}>{att.status === 'present' ? 'Có mặt' : 'Trễ'}</span></td>
                        <td style={styles.tableCell}>{new Date(att.attendance_time).toLocaleTimeString('vi-VN')}</td>
                        <td style={styles.tableCell}>{att.confidence_score ? Math.round(att.confidence_score) + '%' : 'N/A'}</td>
                      </tr>
                    ))}
                    {attendanceData.absent_students.map((student, index) => (
                      <tr key={`absent-${student.student_id}`}>
                        <td style={styles.tableCell}>{attendanceData.attendances.length + index + 1}</td><td style={styles.tableCell}>{student.student_code}</td><td style={styles.tableCell}>{student.student_name}</td>
                        <td style={styles.tableCell}><span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', backgroundColor: '#fef2f2', color: '#dc2626' }}>Vắng</span></td>
                        <td style={styles.tableCell}>-</td><td style={styles.tableCell}>-</td>
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

export { LoadingSpinner, ErrorMessage, StatsCard, UserMenu, ScheduleBlock, ScheduleActionPopover, SessionDetailModal };

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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
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
      if (profileRes.success) setCurrentUser(profileRes.data.user);
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
    console.log("Processing schedules for timetable:", schedules); // DEBUG
    const processed = {};
    if (!Array.isArray(schedules)) return processed;

    schedules.forEach(schedule => {
      const day = parseInt(schedule.weekday, 10);
      if (isNaN(day)) return;

      if (!processed[day]) processed[day] = [];
      processed[day].push(schedule);
    });
    console.log("Processed timetable data:", processed); // DEBUG
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
        schedule_id: schedule.id,
        session_date: new Date().toISOString().split('T')[0]
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
      showNotification(`Lỗi hệ thống: ${err.message}`, 'error');
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

  const timeSlots = ['07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00', '15:00-16:00', '16:00-17:00'];
  const daysOfWeek = [{ key: 2, name: 'Thứ 2' }, { key: 3, name: 'Thứ 3' }, { key: 4, name: 'Thứ 4' }, { key: 5, name: 'Thứ 5' }, { key: 6, name: 'Thứ 6' }, { key: 7, name: 'Thứ 7' }, { key: 1, name: 'Chủ nhật' }];
  const todayKey = new Date().getDay() === 0 ? 1 : new Date().getDay() + 1;

  const timeToMinutes = (time) => {
    if (typeof time !== 'string' || !time.includes(':')) return 0;
    const parts = time.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours * 60 + minutes;
  };

  if (loading) return <div style={styles.appContainer}><div style={styles.mainContent}><LoadingSpinner /></div></div>;
  if (error) return <div style={styles.appContainer}><div style={styles.mainContent}><ErrorMessage message={error} onRetry={loadDashboardData} /></div></div>;

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
          <h1 style={styles.headerTitle}><i className="fas fa-chalkboard-teacher" style={{ color: '#3b82f6' }}></i>Bảng điều khiển</h1>
          <div style={styles.headerActions}>
            <div style={styles.headerTime}><i className="fas fa-clock" style={{ marginRight: '8px' }}></i>{currentTime.toLocaleString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            <UserMenu user={currentUser} onLogout={handleLogout} />
          </div>
        </header>
        <div style={styles.dashboardContent}>
          <div style={styles.statsGrid}>
            <StatsCard title="Tổng lịch dạy" value={statistics?.totalSchedules || 0} icon="fas fa-calendar" color="#3b82f6" />
            <StatsCard title="Tổng phiên điểm danh" value={statistics?.totalSessions || 0} icon="fas fa-clipboard-check" color="#10b981" />
            <StatsCard title="Phiên đang diễn ra" value={statistics?.activeSessions || 0} icon="fas fa-play-circle" color="#f59e0b" />
            <StatsCard title="Phiên hôm nay" value={statistics?.todaysSessions || 0} icon="fas fa-calendar-day" color="#ef4444" />
          </div>
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}><i className="fas fa-table"></i>Thời khóa biểu</h2>
              <button style={{ ...styles.button, ...styles.buttonSecondary }} onClick={loadDashboardData}><i className="fas fa-sync-alt"></i>Làm mới</button>
            </div>
            <div style={styles.timetableContainer}>
              <table style={styles.timetableTable}>
                <thead>
                  <tr>
                    <th style={styles.timetableHeaderCell}>Thời gian</th>
                    {daysOfWeek.map(day => <th key={day.key} style={{ ...styles.timetableHeaderCell, ...(day.key === todayKey ? styles.currentDayHeader : {}) }}>{day.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(timeSlot => (
                    <tr key={timeSlot}>
                      <td style={styles.timetableTimeCell}>{timeSlot}</td>
                      {daysOfWeek.map(day => {
                        const schedulesForDay = timetableData[day.key] || [];
                        const slotStartMinutes = timeToMinutes(timeSlot.split('-')[0]);
                        const schedule = schedulesForDay.find(s => timeToMinutes(s.start_time) === slotStartMinutes);
                        if (schedule) {
                          const duration = timeToMinutes(schedule.end_time) - timeToMinutes(schedule.start_time);
                          const rowSpan = Math.ceil(duration / 60);
                          return <td key={`${day.key}-${timeSlot}`} style={styles.timetableCell} rowSpan={rowSpan}><ScheduleBlock schedule={schedule} onClick={handleScheduleClick} /></td>;
                        }
                        const isOccupied = schedulesForDay.some(s => {
                          const start = timeToMinutes(s.start_time); const end = timeToMinutes(s.end_time);
                          return start < slotStartMinutes && end > slotStartMinutes;
                        });
                        return isOccupied ? null : <td key={`${day.key}-${timeSlot}`} style={styles.timetableCell}></td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {popover.visible && <ScheduleActionPopover position={popover.position} schedule={popover.schedule} session={popover.session} onClose={() => setPopover({ visible: false })} onStartSession={handleStartSession} onViewSession={handleViewSession} onViewClass={handleViewClass} />}
        {showSessionModal && selectedSession && <SessionDetailModal session={selectedSession} onClose={() => setShowSessionModal(false)} showNotification={showNotification} onSessionEnd={loadDashboardData} />}
      </div>
    </div>
  );
};

export default TeacherDashboard;
