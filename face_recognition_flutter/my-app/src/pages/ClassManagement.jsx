import React, { useState, useEffect } from 'react';
import Notification from '../components/Notification';
import Sidebar from '../components/Sidebar';
import LoadingOverlay from '../components/LoadingOverlay';
import useNotification from '../hooks/useNotification';
import useTime from '../hooks/useTime';
import styles from '../components/styles';
import classManagementStyles from '../styles/ClassManagementStyles';
import apiService from '../services/api-service';
import authService from '../services/auth-service';

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

// Class Card Component
const ClassCard = ({ classData, onManageStudents, onEditClass, onDeleteClass }) => {
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
          <div style={classManagementStyles.className}>{classData.name}</div>
          <div style={classManagementStyles.classCode}>
            ID: {classData.id} - {classData.created_at ? new Date(classData.created_at).getFullYear() : '2024'}
          </div>
        </div>
      </div>
      <div style={classManagementStyles.classCardBody}>
        <div style={classManagementStyles.classStats}>
          <div style={classManagementStyles.classStat}>
            <div style={classManagementStyles.classStatValue}>{classData.studentCount || 0}</div>
            <div style={classManagementStyles.classStatLabel}>Sinh viên</div>
          </div>
          <div style={classManagementStyles.classStat}>
            <div style={classManagementStyles.classStatValue}>{classData.studentsWithFace || 0}</div>
            <div style={classManagementStyles.classStatLabel}>Có khuôn mặt</div>
          </div>
        </div>
        <div style={classManagementStyles.classActions}>
          <button
            style={getActionBtnStyle('manage')}
            onClick={() => onManageStudents(classData.id)}
            onMouseEnter={() => setHoveredAction('manage')}
            onMouseLeave={() => setHoveredAction(null)}
          >
            <i className="fas fa-users"></i>
            Quản lý SV
          </button>
          <button
            style={getActionBtnStyle('edit')}
            onClick={() => onEditClass(classData)}
            onMouseEnter={() => setHoveredAction('edit')}
            onMouseLeave={() => setHoveredAction(null)}
          >
            <i className="fas fa-edit"></i>
            Sửa
          </button>
          <button
            style={getActionBtnStyle('delete', true)}
            onClick={() => onDeleteClass(classData)}
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

// Class Form Component
const ClassForm = ({ classData, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: classData?.name || ''
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
      newErrors.name = 'Tên lớp học không được để trống';
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
            Tên lớp học <span style={classManagementStyles.required}>*</span>
          </label>
          <input
            type="text"
            style={classManagementStyles.formInput}
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Ví dụ: CNTT K47"
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
              {classData ? 'Cập nhật' : 'Tạo lớp học'}
            </>
          )}
        </button>
      </div>
    </>
  );
};

// Student Management Component
const StudentManagement = ({ classData, onClose, onRefresh }) => {
  const [students, setStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { showNotification } = useNotification();

  useEffect(() => {
    if (classData?.id) {
      fetchClassStudents();
      fetchAvailableStudents();
    }
  }, [classData?.id]);

  const fetchClassStudents = async () => {
    setLoading(true);
    try {
      const response = await apiService.getClasses();
      if (response.success) {
        console.log('Fetch class students response:', response);

        const targetClass = response.data.classes.find(
          cls => cls.id === classData.id
        );

        setStudents(targetClass?.students || []);
      }

    } catch (error) {
      console.error('Fetch class students error:', error);
      showNotification('Lỗi khi tải danh sách sinh viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const response = await apiService.getAvailableStudents();
      if (response.success) {
        setAvailableStudents(response.data.students || []);
      }
    } catch (error) {
      console.error('Fetch available students error:', error);
    }
  };

  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) {
      showNotification('Vui lòng chọn ít nhất một sinh viên', 'warning');
      return;
    }

    setLoading(true);
    try {
      const promises = selectedStudents.map(studentId =>
        apiService.addStudentToClass(classData.id, { student_id: studentId })
      );

      await Promise.all(promises);

      showNotification(`Đã thêm ${selectedStudents.length} sinh viên vào lớp`, 'success');
      setSelectedStudents([]);
      setShowAddForm(false);
      fetchClassStudents();
      fetchAvailableStudents();
      onRefresh();
    } catch (error) {
      console.error('Add students error:', error);
      showNotification('Lỗi khi thêm sinh viên vào lớp', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sinh viên này khỏi lớp?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.removeStudentFromClass(classData.id, studentId);
      if (response.success) {
        showNotification('Đã xóa sinh viên khỏi lớp', 'success');
        fetchClassStudents();
        fetchAvailableStudents();
        onRefresh();
      }
    } catch (error) {
      console.error('Remove student error:', error);
      showNotification('Lỗi khi xóa sinh viên khỏi lớp', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredAvailableStudents = availableStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.student_code && student.student_code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={classManagementStyles.modalBody}>
      {/* Header Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        padding: '1rem',
        background: '#f8fafc',
        borderRadius: '0.5rem'
      }}>
        <div>
          <h4 style={{ margin: 0, color: '#1e293b' }}>Lớp: {classData?.name}</h4>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            {students.length} sinh viên
          </p>
        </div>
        <button
          style={{ ...classManagementStyles.btn, ...classManagementStyles.btnPrimary }}
          onClick={() => setShowAddForm(true)}
        >
          <i className="fas fa-plus"></i>
          Thêm sinh viên
        </button>
      </div>

      {/* Student List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#6366f1' }}></i>
        </div>
      ) : students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <i className="fas fa-users" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
          <h4 style={{ marginBottom: '0.5rem' }}>Chưa có sinh viên nào</h4>
          <p>Nhấn "Thêm sinh viên" để bắt đầu</p>
        </div>
      ) : (
        <div style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Mã SV</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Tên</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Email</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>Khuôn mặt</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id} style={{
                  borderBottom: index < students.length - 1 ? '1px solid #e2e8f0' : 'none'
                }}>
                  <td style={{ padding: '0.75rem' }}>{student.code || 'N/A'}</td>
                  <td style={{ padding: '0.75rem', fontWeight: '500' }}>{student.name}</td>
                  <td style={{ padding: '0.75rem', color: '#64748b' }}>{student.email}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {student.hasFace ? (
                      <span style={{ color: '#10b981' }}>
                        <i className="fas fa-check-circle"></i>
                      </span>
                    ) : (
                      <span style={{ color: '#f59e0b' }}>
                        <i className="fas fa-exclamation-circle"></i>
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <button
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                      onClick={() => handleRemoveStudent(student.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Students Modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '0.5rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0 }}>Thêm sinh viên vào lớp</h3>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
                onClick={() => setShowAddForm(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {/* Search */}
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Tìm kiếm sinh viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Available Students */}
              {filteredAvailableStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  <p>Không có sinh viên nào khả dụng</p>
                </div>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {filteredAvailableStudents.map(student => (
                    <label key={student.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      marginBottom: '0.5rem',
                      cursor: 'pointer',
                      background: selectedStudents.includes(student.id) ? '#f0f9ff' : '#fff'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents(prev => [...prev, student.id]);
                          } else {
                            setSelectedStudents(prev => prev.filter(id => id !== student.id));
                          }
                        }}
                        style={{ marginRight: '0.75rem' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500' }}>{student.name}</div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                          {student.student_code} - {student.email}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              padding: '1.5rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                style={{ ...classManagementStyles.btn, ...classManagementStyles.btnOutline }}
                onClick={() => setShowAddForm(false)}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                style={{ ...classManagementStyles.btn, ...classManagementStyles.btnPrimary }}
                onClick={handleAddStudents}
                disabled={loading || selectedStudents.length === 0}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus"></i>
                    Thêm ({selectedStudents.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Class Management Component
const ClassManagement = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [currentView, setCurrentView] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showClassModal, setShowClassModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [currentClass, setCurrentClass] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

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

      fetchClasses();
    };

    checkPermission();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await apiService.getClasses();
      console.log('Fetch classes response:', response);

      if (response.success) {
        setClasses(response.data.classes || response.data || []);
        showNotification('Tải danh sách lớp học thành công', 'success');
      } else {
        showNotification(response.message || 'Lấy danh sách lớp học thất bại.', 'error');
      }
    } catch (error) {
      showNotification('Lỗi khi kết nối đến server: ' + error.message, 'error');
      console.error('Fetch classes error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = classes.filter(cls => {
      const matchesSearch = !searchQuery ||
        cls.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    setFilteredClasses(filtered);
  }, [classes, searchQuery]);

  // Calculate statistics
  const statistics = {
    totalClasses: classes.length,
    totalStudents: classes.reduce((sum, cls) => sum + (cls.studentCount || 0), 0),
    avgStudentsPerClass: classes.length > 0 ?
      Math.round(classes.reduce((sum, cls) => sum + (cls.studentCount || 0), 0) / classes.length) : 0,
    studentsWithFace: classes.reduce(
      (sum, cls) => sum + parseInt(cls.studentsWithFace || 0, 10),
      0
    )

  };

  const statsConfig = [
    { title: 'Tổng lớp học', value: statistics.totalClasses, icon: 'fas fa-school', color: '#3b82f6', change: '+2' },
    { title: 'Tổng sinh viên', value: statistics.totalStudents, icon: 'fas fa-users', color: '#10b981', change: '+5.2%' },
    { title: 'Trung bình SV/lớp', value: statistics.avgStudentsPerClass, icon: 'fas fa-chart-line', color: '#f59e0b', change: '+1.2' },
    { title: 'SV có khuôn mặt', value: statistics.studentsWithFace, icon: 'fas fa-graduation-cap', color: '#8b5cf6', change: '+1' }
  ];

  // Handle actions
  const handleSaveClass = async (formData) => {
    setModalLoading(true);

    try {
      let response;
      if (currentClass) {
        // Update existing class
        response = await apiService.updateClass(currentClass.id, formData.name);
      } else {
        // Create new class
        response = await apiService.createClass(formData.name);
      }

      if (response.success) {
        showNotification(
          currentClass ? 'Cập nhật lớp học thành công!' : 'Thêm lớp học thành công!',
          'success'
        );
        setShowClassModal(false);
        setCurrentClass(null);
        fetchClasses();
      } else {
        showNotification(response.message || 'Có lỗi xảy ra khi lưu lớp học', 'error');
      }
    } catch (error) {
      console.error('Save class error:', error);
      showNotification('Có lỗi xảy ra khi lưu lớp học: ' + error.message, 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditClass = (classItem) => {
    setCurrentClass(classItem);
    setShowClassModal(true);
  };

  const handleDeleteClass = (classItem) => {
    setDeleteTarget(classItem);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setModalLoading(true);

    try {
      const response = await apiService.deleteClass(deleteTarget.id);

      if (response.success) {
        showNotification('Xóa lớp học thành công!', 'success');
        setShowDeleteModal(false);
        setDeleteTarget(null);
        fetchClasses();
      } else {
        showNotification(response.message || 'Có lỗi xảy ra khi xóa lớp học', 'error');
      }
    } catch (error) {
      console.error('Delete class error:', error);
      showNotification('Có lỗi xảy ra khi xóa lớp học: ' + error.message, 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleManageStudents = (classId) => {
    const classData = classes.find(c => c.id === classId);
    setCurrentClass(classData);
    setShowStudentModal(true);
  };

  const handleAddClass = () => {
    setCurrentClass(null);
    setShowClassModal(true);
  };

  const mainContentStyle = {
    ...styles.mainContent,
    ...(sidebarCollapsed ? styles.mainContentCollapsed : {})
  };

  const gridStyle = currentView === 'grid'
    ? classManagementStyles.classesGrid
    : { ...classManagementStyles.classesGrid, ...classManagementStyles.classesGridList };

  if (!hasPermission) {
    return (
      <div style={styles.appContainer}>
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activePage="classes"
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
              <p style={{ color: '#64748b' }}>Bạn không có quyền truy cập trang quản lý lớp học.</p>
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
        activePage="classes"
      />

      {/* Main Content */}
      <main style={mainContentStyle}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.pageTitle}>
              <i className="fas fa-school" style={{ color: '#6366f1', marginRight: '1rem' }}></i>
              Quản lý lớp học
            </h1>
            <p style={styles.pageSubtitle}>Quản lý thông tin lớp học và danh sách sinh viên</p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.headerActions}>
              <button
                style={styles.actionBtn}
                onClick={() => fetchClasses()}
                title="Làm mới dữ liệu"
              >
                <i className="fas fa-sync-alt"></i>
              </button>
              <button
                style={styles.actionBtn}
                onClick={() => showNotification('Tính năng nhập Excel đang phát triển', 'info')}
                title="Nhập từ Excel"
              >
                <i className="fas fa-file-import"></i>
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
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={handleAddClass}
            >
              <i className="fas fa-plus"></i>
              Thêm lớp học
            </button>
          </div>
        </header>

        <div style={styles.dashboardContent}>
          <LoadingOverlay isLoading={loading} />

          {/* Filter Bar */}
          <div style={classManagementStyles.filterBar}>
            <div style={classManagementStyles.searchSection}>
              <div style={classManagementStyles.searchBox}>
                <i className="fas fa-search" style={classManagementStyles.searchIcon}></i>
                <input
                  type="text"
                  style={classManagementStyles.searchInput}
                  placeholder="Tìm kiếm theo tên lớp..."
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
                style={{ ...classManagementStyles.btn, ...classManagementStyles.btnOutline }}
                onClick={() => setSearchQuery('')}
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

          {/* Class List */}
          <section>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                <i className="fas fa-list" style={styles.sectionIcon}></i>
                Danh sách lớp học ({filteredClasses.length})
              </h2>
              <div style={classManagementStyles.viewOptions}>
                <button
                  style={{
                    ...classManagementStyles.viewBtn,
                    ...(currentView === 'grid' ? classManagementStyles.viewBtnActive : {})
                  }}
                  onClick={() => setCurrentView('grid')}
                >
                  <i className="fas fa-th-large"></i>
                </button>
                <button
                  style={{
                    ...classManagementStyles.viewBtn,
                    ...(currentView === 'list' ? classManagementStyles.viewBtnActive : {})
                  }}
                  onClick={() => setCurrentView('list')}
                >
                  <i className="fas fa-list"></i>
                </button>
              </div>
            </div>

            {filteredClasses.length === 0 && !loading ? (
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
                  <i className="fas fa-school"></i>
                </div>
                <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>
                  {searchQuery
                    ? 'Không tìm thấy lớp học nào'
                    : 'Chưa có lớp học nào'
                  }
                </h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                  {searchQuery
                    ? 'Thử điều chỉnh từ khóa tìm kiếm để xem kết quả khác'
                    : 'Bắt đầu bằng cách tạo lớp học đầu tiên của bạn'
                  }
                </p>
                <button
                  style={{ ...classManagementStyles.btn, ...classManagementStyles.btnPrimary }}
                  onClick={handleAddClass}
                >
                  <i className="fas fa-plus"></i>
                  Thêm lớp học đầu tiên
                </button>
              </div>
            ) : (
              <div style={gridStyle}>
                {filteredClasses.map(classData => (
                  <ClassCard
                    key={classData.id}
                    classData={classData}
                    onManageStudents={handleManageStudents}
                    onEditClass={handleEditClass}
                    onDeleteClass={handleDeleteClass}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Class Modal */}
      <Modal
        isOpen={showClassModal}
        onClose={() => !modalLoading && setShowClassModal(false)}
        title={currentClass ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}
      >
        <ClassForm
          classData={currentClass}
          onSave={handleSaveClass}
          onCancel={() => setShowClassModal(false)}
          isLoading={modalLoading}
        />
      </Modal>

      {/* Student Management Modal */}
      <Modal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        title={`Quản lý sinh viên - ${currentClass?.name || ''}`}
        size="large"
      >
        <StudentManagement
          classData={currentClass}
          onClose={() => setShowStudentModal(false)}
          onRefresh={fetchClasses}
        />
        <div style={classManagementStyles.modalFooter}>
          <button
            style={{ ...classManagementStyles.btn, ...classManagementStyles.btnOutline }}
            onClick={() => setShowStudentModal(false)}
          >
            Đóng
          </button>
        </div>
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
              Bạn có chắc chắn muốn xóa lớp <strong>"{deleteTarget?.name}"</strong> không?
            </p>
            <small style={{ color: '#94a3b8' }}>
              Tất cả sinh viên trong lớp sẽ bị xóa khỏi lớp. Hành động này không thể hoàn tác!
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
                Xóa lớp học
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ClassManagement;