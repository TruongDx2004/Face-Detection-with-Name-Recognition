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

// Course Card Component
const CourseCard = ({ courseData, onEditCourse, onDeleteCourse }) => {
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

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={courseManagementStyles.courseCardHeader}>
        <div style={courseManagementStyles.courseIcon}>
          <i className="fas fa-graduation-cap"></i>
        </div>
        <div style={courseManagementStyles.courseInfo}>
          <div style={courseManagementStyles.courseName}>{courseData.name}</div>
          <div style={courseManagementStyles.courseCode}>
            Mã: {courseData.code} - {courseData.semester}
          </div>
          <div style={courseManagementStyles.courseDetails}>
            GV: {courseData.teacher_name || 'Chưa phân công'}
          </div>
          <div style={courseManagementStyles.courseDetails}>
            Lớp: {courseData.class_name || 'N/A'}
          </div>
        </div>
      </div>

      <div style={courseManagementStyles.courseCardBody}>
        <div style={courseManagementStyles.courseBadges}>
          <span style={{ ...courseManagementStyles.courseBadge, ...courseManagementStyles.semesterBadge }}>
            {courseData.semester}
          </span>
          <span style={{ ...courseManagementStyles.courseBadge, ...courseManagementStyles.yearBadge }}>
            {courseData.academic_year}
          </span>
          <span style={{ ...courseManagementStyles.courseBadge, ...courseManagementStyles.studentsBadge }}>
            {courseData.max_students} SV
          </span>
        </div>

        <div style={courseManagementStyles.courseActions}>
          <button
            style={getActionBtnStyle('edit')}
            onClick={() => onEditCourse(courseData)}
            onMouseEnter={() => setHoveredAction('edit')}
            onMouseLeave={() => setHoveredAction(null)}
          >
            <i className="fas fa-edit"></i>
            Sửa
          </button>
          <button
            style={getActionBtnStyle('delete', true)}
            onClick={() => onDeleteCourse(courseData)}
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

// Course Form Component
const CourseForm = ({ courseData, onSave, onCancel, isLoading, classes, subjects, teachers }) => {
  const [formData, setFormData] = useState({
    name: courseData?.name || '',
    code: courseData?.code || '',
    class_id: courseData?.class_id || '',
    subject_id: courseData?.subject_id || '',
    teacher_id: courseData?.teacher_id || '',
    semester: courseData?.semester || 'HK1',
    academic_year: courseData?.academic_year || '2024-2025',
    max_students: courseData?.max_students || 50,
    description: courseData?.description || ''
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
      newErrors.name = 'Tên lớp học phần không được để trống';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'Mã lớp học phần không được để trống';
    }
    if (!formData.class_id) {
      newErrors.class_id = 'Vui lòng chọn lớp';
    }
    if (!formData.subject_id) {
      newErrors.subject_id = 'Vui lòng chọn môn học';
    }
    if (!formData.teacher_id) {
      newErrors.teacher_id = 'Vui lòng chọn giảng viên';
    }
    if (!formData.academic_year.trim()) {
      newErrors.academic_year = 'Năm học không được để trống';
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
              Lớp <span style={courseManagementStyles.required}>*</span>
            </label>
            <select
              style={courseManagementStyles.formInput}
              value={formData.class_id}
              onChange={(e) => handleInputChange('class_id', e.target.value)}
            >
              <option value="">Chọn lớp</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            {errors.class_id && <div style={courseManagementStyles.formError}>{errors.class_id}</div>}
          </div>

          <div style={courseManagementStyles.formGroup}>
            <label style={courseManagementStyles.formLabel}>
              Môn học <span style={courseManagementStyles.required}>*</span>
            </label>
            <select
              style={courseManagementStyles.formInput}
              value={formData.subject_id}
              onChange={(e) => handleInputChange('subject_id', e.target.value)}
            >
              <option value="">Chọn môn học</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
            {errors.subject_id && <div style={courseManagementStyles.formError}>{errors.subject_id}</div>}
          </div>
        </div>

        <div style={courseManagementStyles.formRow}>
          <div style={courseManagementStyles.formGroup}>
            <label style={courseManagementStyles.formLabel}>
              Giảng viên <span style={courseManagementStyles.required}>*</span>
            </label>
            <select
              style={courseManagementStyles.formInput}
              value={formData.teacher_id}
              onChange={(e) => handleInputChange('teacher_id', e.target.value)}
            >
              <option value="">Chọn giảng viên</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>
              ))}
            </select>
            {errors.teacher_id && <div style={courseManagementStyles.formError}>{errors.teacher_id}</div>}
          </div>

          <div style={courseManagementStyles.formGroup}>
            <label style={courseManagementStyles.formLabel}>
              Học kỳ <span style={courseManagementStyles.required}>*</span>
            </label>
            <select
              style={courseManagementStyles.formInput}
              value={formData.semester}
              onChange={(e) => handleInputChange('semester', e.target.value)}
            >
              <option value="HK1">Học kỳ 1</option>
              <option value="HK2">Học kỳ 2</option>
              <option value="HK3">Học kỳ 3</option>
              <option value="Summer">Học kỳ hè</option>
            </select>
          </div>
        </div>

        <div style={courseManagementStyles.formRow}>
          <div style={courseManagementStyles.formGroup}>
            <label style={courseManagementStyles.formLabel}>
              Năm học <span style={courseManagementStyles.required}>*</span>
            </label>
            <input
              type="text"
              style={courseManagementStyles.formInput}
              value={formData.academic_year}
              onChange={(e) => handleInputChange('academic_year', e.target.value)}
              placeholder="2024-2025"
            />
            {errors.academic_year && <div style={courseManagementStyles.formError}>{errors.academic_year}</div>}
          </div>

          <div style={courseManagementStyles.formGroup}>
            <label style={courseManagementStyles.formLabel}>Số sinh viên tối đa</label>
            <input
              type="number"
              style={courseManagementStyles.formInput}
              value={formData.max_students}
              onChange={(e) => handleInputChange('max_students', parseInt(e.target.value))}
              min="1"
              max="200"
            />
          </div>
        </div>

        <div style={courseManagementStyles.formRow}>
          <div style={courseManagementStyles.formGroup}>
            <label style={courseManagementStyles.formLabel}>
              Tên lớp học phần <span style={courseManagementStyles.required}>*</span>
            </label>
            <input
              type="text"
              style={courseManagementStyles.formInput}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Nhập tên lớp học phần"
            />
            {errors.name && <div style={courseManagementStyles.formError}>{errors.name}</div>}
          </div>

          <div style={courseManagementStyles.formGroup}>
            <label style={courseManagementStyles.formLabel}>
              Mã lớp học phần <span style={courseManagementStyles.required}>*</span>
            </label>
            <input
              type="text"
              style={courseManagementStyles.formInput}
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder="Nhập mã lớp học phần"
            />
            {errors.code && <div style={courseManagementStyles.formError}>{errors.code}</div>}
          </div>
        </div>

        <div style={courseManagementStyles.formGroup}>
          <label style={courseManagementStyles.formLabel}>Mô tả</label>
          <textarea
            style={courseManagementStyles.formTextarea}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Nhập mô tả cho lớp học phần"
            rows="3"
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
              {courseData ? 'Cập nhật' : 'Tạo lớp học phần'}
            </>
          )}
        </button>
      </div>
    </>
  );
};

// Main Course Management Component
const CourseManagement = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseSections, setCourseSections] = useState([]);
  const [filteredCourseSections, setFilteredCourseSections] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [currentView, setCurrentView] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  // Modal states
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [courseTemplate, setCourseTemplate] = useState(null);

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

      fetchCourseSections();
      fetchClasses();
      fetchSubjects();
      fetchTeachers();
    };

    checkPermission();
    fetchCourseTemplate();
  }, []);

  const fetchCourseTemplate = async () => {
    try {
      const template = {
        template: [
          { name: 'Toán cao cấp A1 - CNTT K47', code: 'MATH101_CNTT47', class_name: 'CNTT K47', subject_name: 'Toán cao cấp A1', teacher_name: 'Nguyễn Văn A', semester: 'HK1', academic_year: '2024-2025', max_students: '50', description: 'Lớp học phần Toán cao cấp A1 cho sinh viên CNTT K47' }
        ],
        instructions: {
          required_fields: ['name', 'code', 'class_name', 'subject_name', 'teacher_name', 'semester', 'academic_year'],
          optional_fields: ['max_students', 'description'],
          field_descriptions: {
            name: 'Tên lớp học phần (bắt buộc, duy nhất)',
            code: 'Mã lớp học phần (bắt buộc, duy nhất)',
            class_name: 'Tên lớp (bắt buộc)',
            subject_name: 'Tên môn học (bắt buộc)',
            teacher_name: 'Tên giảng viên (bắt buộc)',
            semester: 'Học kỳ: HK1, HK2, HK3, Summer (bắt buộc)',
            academic_year: 'Năm học, ví dụ: 2024-2025 (bắt buộc)',
            max_students: 'Số sinh viên tối đa (mặc định: 50)',
            description: 'Mô tả lớp học phần (tùy chọn)'
          },
          notes: [
            'Tên và mã lớp học phần phải là duy nhất trong hệ thống',
            'Tên lớp, môn học, giảng viên phải tồn tại trong hệ thống',
            'Học kỳ chỉ nhận giá trị: HK1, HK2, HK3, Summer',
            'Năm học theo định dạng: YYYY-YYYY',
            'Xóa các dòng ví dụ trước khi import',
            'Tối đa 100 lớp học phần mỗi lần import'
          ]
        }
      };
      setCourseTemplate(template);
    } catch (error) {
      console.error('Error fetching course template:', error);
    }
  };

  const fetchCourseSections = async () => {
    setLoading(true);
    try {
      const response = await apiService.getCourseSections();
      if (response.success) {
        setCourseSections(response.data.courseSections || response.data || []);
        console.log(response.data.courseSections || response.data || [])
        showNotification('Tải danh sách lớp học phần thành công', 'success');
      } else {
        showNotification(response.message || 'Lỗi khi tải dữ liệu', 'error');
      }
    } catch (error) {
      showNotification('Lỗi kết nối: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiService.getClasses();
      if (response.success) {
        setClasses(response.data.classes || response.data || []);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await apiService.getSubjects();
      if (response.success) {
        setSubjects(response.data.subjects || response.data || []);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await apiService.getAllUsers({ role: 'teacher' });
      if (response.success) {
        setTeachers(response.data.users || response.data || []);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = courseSections.filter(course => {
      const matchesSearch = !searchQuery ||
        course.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.subject_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass = !classFilter || course.class_id == classFilter;
      const matchesSubject = !subjectFilter || course.subject_id == subjectFilter;

      return matchesSearch && matchesClass && matchesSubject;
    });
    setFilteredCourseSections(filtered);
  }, [courseSections, searchQuery, classFilter, subjectFilter]);

  // Calculate statistics
  const statistics = {
    totalCourses: courseSections.length,
    activeCourses: courseSections.filter(c => c.is_active !== false).length,
    totalTeachers: [...new Set(courseSections.map(c => c.teacher_id).filter(Boolean))].length,
    totalStudents: courseSections.reduce((sum, c) => sum + (c.enrolled_students || 0), 0)
  };

  const statsConfig = [
    { title: 'Tổng lớp học phần', value: statistics.totalCourses, icon: 'fas fa-graduation-cap', color: '#3b82f6', change: '+2' },
    { title: 'Đang hoạt động', value: statistics.activeCourses, icon: 'fas fa-play-circle', color: '#10b981', change: '+5.2%' },
    { title: 'Giảng viên', value: statistics.totalTeachers, icon: 'fas fa-chalkboard-teacher', color: '#f59e0b', change: '+1' },
    { title: 'Sinh viên', value: statistics.totalStudents, icon: 'fas fa-user-graduate', color: '#8b5cf6', change: '+3' }
  ];

  // Handle actions
  const handleSaveCourse = async (formData) => {
    setModalLoading(true);

    try {
      let response;
      if (currentCourse) {
        response = await apiService.updateCourseSection(currentCourse.id, formData);
      } else {
        response = await apiService.createCourseSection(formData);
      }

      if (response.success) {
        showNotification(
          currentCourse ? 'Cập nhật lớp học phần thành công!' : 'Thêm lớp học phần thành công!',
          'success'
        );
        setShowCourseModal(false);
        setCurrentCourse(null);
        fetchCourseSections();
      } else {
        showNotification(response.message || 'Có lỗi xảy ra khi lưu lớp học phần', 'error');
      }
    } catch (error) {
      console.error('Save course error:', error);
      showNotification('Có lỗi xảy ra khi lưu lớp học phần: ' + error.message, 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditCourse = (courseItem) => {
    setCurrentCourse(courseItem);
    setShowCourseModal(true);
  };

  const handleDeleteCourse = (courseItem) => {
    setDeleteTarget(courseItem);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setModalLoading(true);

    try {
      const response = await apiService.deleteCourseSection(deleteTarget.id);

      if (response.success) {
        showNotification('Xóa lớp học phần thành công!', 'success');
        setShowDeleteModal(false);
        setDeleteTarget(null);
        fetchCourseSections();
      } else {
        showNotification(response.message || 'Có lỗi xảy ra khi xóa lớp học phần', 'error');
      }
    } catch (error) {
      console.error('Delete course error:', error);
      showNotification('Có lỗi xảy ra khi xóa lớp học phần: ' + error.message, 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddCourse = () => {
    setCurrentCourse(null);
    setShowCourseModal(true);
  };

  const mainContentStyle = {
    ...styles.mainContent,
    ...(sidebarCollapsed ? styles.mainContentCollapsed : {})
  };

  const gridStyle = currentView === 'grid'
    ? courseManagementStyles.coursesGrid
    : { ...courseManagementStyles.coursesGrid, ...courseManagementStyles.coursesGridList };

  if (!hasPermission) {
    return (
      <div style={styles.appContainer}>
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activePage="course"
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
              <p style={{ color: '#64748b' }}>Bạn không có quyền truy cập trang quản lý lớp học phần.</p>
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
        activePage="courses"
      />

      {/* Main Content */}
      <main style={mainContentStyle}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.pageTitle}>
              <i className="fas fa-graduation-cap" style={{ color: '#6366f1', marginRight: '1rem' }}></i>
              Quản lý lớp học phần
            </h1>
            <p style={styles.pageSubtitle}>Quản lý thông tin lớp học phần và phân công giảng dạy</p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.headerActions}>
              <button
                style={styles.actionBtn}
                onClick={() => fetchCourseSections()}
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
              onClick={handleAddCourse}
            >
              <i className="fas fa-plus"></i>
              Thêm lớp học phần
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
                  placeholder="Tìm kiếm theo tên lớp học phần..."
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
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                style={courseManagementStyles.filterSelect}
              >
                <option value="">Tất cả lớp</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>

              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                style={courseManagementStyles.filterSelect}
              >
                <option value="">Tất cả môn học</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>

            <div style={courseManagementStyles.filterSection}>
              <button
                style={{ ...courseManagementStyles.btn, ...courseManagementStyles.btnOutline }}
                onClick={() => {
                  setSearchQuery('');
                  setClassFilter('');
                  setSubjectFilter('');
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

          {/* Course List */}
          <section>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                <i className="fas fa-list" style={styles.sectionIcon}></i>
                Danh sách lớp học phần ({filteredCourseSections.length})
              </h2>
              <div style={courseManagementStyles.viewOptions}>
                <button
                  style={{
                    ...courseManagementStyles.viewBtn,
                    ...(currentView === 'grid' ? courseManagementStyles.viewBtnActive : {})
                  }}
                  onClick={() => setCurrentView('grid')}
                >
                  <i className="fas fa-th-large"></i>
                </button>
                <button
                  style={{
                    ...courseManagementStyles.viewBtn,
                    ...(currentView === 'list' ? courseManagementStyles.viewBtnActive : {})
                  }}
                  onClick={() => setCurrentView('list')}
                >
                  <i className="fas fa-list"></i>
                </button>
              </div>
            </div>

            {filteredCourseSections.length === 0 && !loading ? (
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
                  <i className="fas fa-graduation-cap"></i>
                </div>
                <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>
                  {searchQuery || classFilter || subjectFilter
                    ? 'Không tìm thấy lớp học phần nào'
                    : 'Chưa có lớp học phần nào'
                  }
                </h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                  {searchQuery || classFilter || subjectFilter
                    ? 'Thử điều chỉnh từ khóa tìm kiếm để xem kết quả khác'
                    : 'Bắt đầu bằng cách tạo lớp học phần đầu tiên của bạn'
                  }
                </p>
                <button
                  style={{ ...courseManagementStyles.btn, ...courseManagementStyles.btnPrimary }}
                  onClick={handleAddCourse}
                >
                  <i className="fas fa-plus"></i>
                  Thêm lớp học phần đầu tiên
                </button>
              </div>
            ) : (
              <div style={gridStyle}>
                {filteredCourseSections.map(courseData => (
                  <CourseCard
                    key={courseData.id}
                    courseData={courseData}
                    onEditCourse={handleEditCourse}
                    onDeleteCourse={handleDeleteCourse}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Course Modal */}
      <Modal
        isOpen={showCourseModal}
        onClose={() => !modalLoading && setShowCourseModal(false)}
        title={currentCourse ? 'Chỉnh sửa lớp học phần' : 'Thêm lớp học phần mới'}
      >
        <CourseForm
          courseData={currentCourse}
          onSave={handleSaveCourse}
          onCancel={() => setShowCourseModal(false)}
          isLoading={modalLoading}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
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
              Bạn có chắc chắn muốn xóa lớp học phần <strong>"{deleteTarget?.name}"</strong> không?
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
                Xóa lớp học phần
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
          console.log('Import course sections:', data);
          showNotification('Import thành công!', 'success');
          setShowImportModal(false);
          fetchCourseSections();
        }}
        isLoading={modalLoading}
        type="courses"
        title="📚 Import Lớp học phần từ Excel"
        templateData={courseTemplate}
      />
    </div>
  );
};

export default CourseManagement;