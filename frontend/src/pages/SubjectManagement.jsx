import React, { useState, useEffect } from 'react';
import Notification from '../components/Notification';
import ImportModal from '../components/ImportModal';
import Sidebar from '../components/Sidebar';
import LoadingOverlay from '../components/LoadingOverlay';
import useNotification from '../hooks/useNotification';
import useTime from '../hooks/useTime';
import styles from '../components/styles';
import classManagementStyles from '../styles/ClassManagementStyles';
import apiService from '../services/api-service';
import authService from '../services/auth-service';
import * as XLSX from 'xlsx';

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

// Subject Card Component
const SubjectCard = ({ subject, onEdit, onDelete }) => {
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
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    marginRight: '1rem'
                }}>
                    <i className="fas fa-book"></i>
                </div>
                <div style={classManagementStyles.classInfo}>
                    <div style={classManagementStyles.className}>{subject.name}</div>
                    <div style={classManagementStyles.classCode}>
                        Mã: {subject.code}
                    </div>
                    <div style={{
                        fontSize: '0.875rem',
                        color: '#ffffffff',
                        marginTop: '0.25rem'
                    }}>
                        Tín chỉ: {subject.credits} |
                        <span style={{
                            marginLeft: '0.5rem',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            backgroundColor: subject.is_active ? '#dcfce7' : '#fef2f2',
                            color: subject.is_active ? '#166534' : '#dc2626'
                        }}>
                            {subject.is_active ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                    </div>
                    {subject.description && (
                        <div style={{
                            fontSize: '0.875rem',
                            color: '#f6f6f6ff',
                            marginTop: '0.5rem',
                            lineHeight: '1.4',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}>
                            {subject.description}
                        </div>
                    )}
                </div>
            </div>
            <div style={classManagementStyles.classCardBody}>
                <div style={classManagementStyles.classActions}>
                    <button
                        style={getActionBtnStyle('edit')}
                        onClick={() => onEdit(subject)}
                        onMouseEnter={() => setHoveredAction('edit')}
                        onMouseLeave={() => setHoveredAction(null)}
                    >
                        <i className="fas fa-edit"></i>
                        Sửa
                    </button>
                    <button
                        style={getActionBtnStyle('delete', true)}
                        onClick={() => onDelete(subject)}
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

// Subject Form Component
const SubjectForm = ({ subject, onSave, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        name: subject?.name || '',
        code: subject?.code || '',
        description: subject?.description || '',
        credits: subject?.credits || 3,
        is_active: subject?.is_active !== undefined ? subject.is_active : true
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
            newErrors.name = 'Tên môn học không được để trống';
        }
        if (!formData.code.trim()) {
            newErrors.code = 'Mã môn học không được để trống';
        }
        if (formData.credits < 1 || formData.credits > 10) {
            newErrors.credits = 'Số tín chỉ phải từ 1 đến 10';
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={classManagementStyles.formGroup}>
                        <label style={classManagementStyles.formLabel}>
                            Tên môn học <span style={classManagementStyles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            style={classManagementStyles.formInput}
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Ví dụ: Toán học, Lập trình"
                        />
                        {errors.name && <div style={classManagementStyles.formError}>{errors.name}</div>}
                    </div>

                    <div style={classManagementStyles.formGroup}>
                        <label style={classManagementStyles.formLabel}>
                            Mã môn học <span style={classManagementStyles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            style={classManagementStyles.formInput}
                            value={formData.code}
                            onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                            placeholder="Ví dụ: MATH101, CS101"
                        />
                        {errors.code && <div style={classManagementStyles.formError}>{errors.code}</div>}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={classManagementStyles.formGroup}>
                        <label style={classManagementStyles.formLabel}>
                            Số tín chỉ <span style={classManagementStyles.required}>*</span>
                        </label>
                        <input
                            type="number"
                            style={classManagementStyles.formInput}
                            value={formData.credits}
                            onChange={(e) => handleInputChange('credits', parseInt(e.target.value) || 1)}
                            min="1"
                            max="10"
                        />
                        {errors.credits && <div style={classManagementStyles.formError}>{errors.credits}</div>}
                    </div>

                    <div style={classManagementStyles.formGroup}>
                        <label style={classManagementStyles.formLabel}>Trạng thái</label>
                        <select
                            style={classManagementStyles.formInput}
                            value={formData.is_active}
                            onChange={(e) => handleInputChange('is_active', e.target.value === 'true')}
                        >
                            <option value={true}>Hoạt động</option>
                            <option value={false}>Không hoạt động</option>
                        </select>
                    </div>
                </div>

                <div style={classManagementStyles.formGroup}>
                    <label style={classManagementStyles.formLabel}>Mô tả</label>
                    <textarea
                        style={{
                            ...classManagementStyles.formInput,
                            minHeight: '80px',
                            resize: 'vertical'
                        }}
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Mô tả chi tiết về môn học..."
                        rows="3"
                    />
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
                            {subject ? 'Cập nhật' : 'Tạo môn học'}
                        </>
                    )}
                </button>
            </div>
        </>
    );
};

// Main Component
const SubjectManagement = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);

    // Subjects data
    const [subjects, setSubjects] = useState([]);
    const [filteredSubjects, setFilteredSubjects] = useState([]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [subjectStatusFilter, setSubjectStatusFilter] = useState('');

    // Modal states
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSubjectImportModal, setShowSubjectImportModal] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [subjectTemplate, setSubjectTemplate] = useState(null);

    const { notifications, showNotification, removeNotification } = useNotification();

    useEffect(() => {
        const checkPermission = () => {
            const allowedRoles = ['admin'];
            const userHasPermission = authService.hasPermission(allowedRoles);
            setHasPermission(userHasPermission);

            if (!userHasPermission) {
                showNotification("Bạn không có quyền truy cập trang này.", 'error');
                setLoading(false);
                return;
            }

            fetchData();
        };

        checkPermission();
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            // Try to fetch subject template from API
            try {
                const subjectResponse = await apiService.get('/subjects/template');
                setSubjectTemplate(subjectResponse.data);
            } catch (error) {
                console.log('Using fallback subject template');
                setSubjectTemplate(createSubjectTemplate());
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            // Set fallback template
            setSubjectTemplate(createSubjectTemplate());
        }
    };

    // Template mẫu để người dùng tải về và nhập liệu môn học
    const createSubjectTemplate = () => {
        return {
            template: [
                {
                    name: 'Toán rời rạc',
                    code: 'MATH101',
                    description: 'Học về cấu trúc rời rạc trong tin học',
                    credits: 3
                },
                {
                    name: 'Bảo mật thông tin',
                    code: 'SEC202',
                    description: 'Nhập môn an toàn thông tin và mã hoá',
                    credits: 3
                },
                {
                    name: 'Lập trình trên thiết bị di động',
                    code: 'MOB401',
                    description: 'Phát triển ứng dụng di động trên Android hoặc iOS',
                    credits: 3
                },
                {
                    name: 'Chủ nghĩa Mác - Lênin',
                    code: 'POL101',
                    description: 'Học phần lý luận chính trị nền tảng',
                    credits: 2
                }
            ],
            instructions: {
                required_fields: ['name', 'code'],
                optional_fields: ['description', 'credits'],
                field_descriptions: {
                    name: 'Tên môn học (bắt buộc, duy nhất)',
                    code: 'Mã môn học (bắt buộc, duy nhất)',
                    description: 'Mô tả ngắn gọn về môn học (tùy chọn)',
                    credits: 'Số tín chỉ (1–10, mặc định = 3 nếu bỏ trống)'
                },
                notes: [
                    'Tên và mã môn học phải là duy nhất trong hệ thống.',
                    'Tên và mã không được để trống hoặc trùng lặp.',
                    'Nếu không nhập "credits", hệ thống sẽ tự động gán là 3.',
                    'Xóa các dòng ví dụ trước khi import để tránh lỗi trùng.',
                    'Tối đa 100 môn học mỗi lần import.',
                    'Chỉ hỗ trợ file Excel (.xlsx, .xls).'
                ]
            }
        };
    };


    const handleSubjectImport = (result) => {
        console.log('Subject import result:', result);
        const successCount = result.summary?.success || 0;
        showNotification(`Import hoàn tất! ${successCount} môn học được import thành công.`, 'success');
        fetchSubjects(); // Refresh subjects list
    };

    const handleImportFile = async (subjectsData) => {
        try {
            const result = await apiService.importSubjects(subjectsData);
            handleSubjectImport(result);
        } catch (error) {
            console.error('Subject import error:', error);
            showNotification('Có lỗi xảy ra khi import môn học.', 'error');
        }
    };

    // Download Subject Template Excel
    const downloadSubjectTemplate = () => {
        try {
            const template = subjectTemplate || createSubjectTemplate();

            // Create main template sheet
            const ws = XLSX.utils.json_to_sheet(template.template);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Môn học');

            // Create instructions sheet
            const instructionsData = [
                ['HƯỚNG DẪN IMPORT MÔN HỌC'],
                [''],
                ['1. CÁC TRƯỜNG BẮT BUỘC:'],
                ...template.instructions.required_fields.map(field => [`   - ${field}`]),
                [''],
                ['2. MÔ TẢ CÁC TRƯỜNG:'],
                ...Object.entries(template.instructions.field_descriptions || {}).map(([field, desc]) => [`   ${field}: ${desc}`]),
                [''],
                ['3. GHI CHÚ QUAN TRỌNG:'],
                ...template.instructions.notes.map(note => [`   - ${note}`]),
                [''],
                ['4. VÍ DỤ DỮ LIỆU:'],
                ['   Xem sheet "Môn học" để tham khảo format dữ liệu'],
                [''],
                ['5. CÁCH SỬ DỤNG:'],
                ['   - Xóa các dòng ví dụ trong sheet "Môn học"'],
                ['   - Nhập dữ liệu thực tế của bạn'],
                ['   - Lưu file và import vào hệ thống'],
                [''],
                ['Chúc bạn import thành công! 🎉']
            ];

            const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
            XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Hướng dẫn');

            // Download file
            XLSX.writeFile(wb, 'Template_Mon_Hoc.xlsx');
            showNotification('Đã tải template môn học thành công!', 'success');
        } catch (error) {
            console.error('Error downloading subject template:', error);
            showNotification('Lỗi khi tải template môn học', 'error');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            await fetchSubjects();
        } catch (error) {
            console.error('Fetch data error:', error);
            showNotification('Lỗi khi tải dữ liệu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await apiService.getSubjects();
            if (response.success) {
                setSubjects(response.data.subjects || []);
            }
        } catch (error) {
            console.error('Fetch subjects error:', error);
        }
    };

    // Apply filters
    useEffect(() => {
        // Filter subjects
        let filteredSubjs = subjects.filter(subject => {
            // Search filter
            const matchesSearch = !searchQuery || (() => {
                const query = searchQuery.toLowerCase();
                return (
                    subject.name.toLowerCase().includes(query) ||
                    subject.code.toLowerCase().includes(query) ||
                    (subject.description && subject.description.toLowerCase().includes(query))
                );
            })();

            // Status filter
            const matchesStatus = !subjectStatusFilter ||
                (subjectStatusFilter === 'active' && subject.is_active) ||
                (subjectStatusFilter === 'inactive' && !subject.is_active);

            return matchesSearch && matchesStatus;
        });
        setFilteredSubjects(filteredSubjs);
    }, [subjects, searchQuery, subjectStatusFilter]);

    // Calculate statistics
    const statistics = {
        totalSubjects: subjects.length,
        activeSubjects: subjects.filter(s => s.is_active).length,
        inactiveSubjects: subjects.filter(s => !s.is_active).length,
        totalCredits: subjects.reduce((sum, s) => sum + (s.credits || 0), 0)
    };

    const statsConfig = [
        { title: 'Tổng môn học', value: statistics.totalSubjects, icon: 'fas fa-book', color: '#3b82f6', change: '+2' },
        { title: 'Môn đang hoạt động', value: statistics.activeSubjects, icon: 'fas fa-check-circle', color: '#10b981', change: '+1' },
        { title: 'Môn tạm dừng', value: statistics.inactiveSubjects, icon: 'fas fa-pause-circle', color: '#f59e0b', change: '0' },
        { title: 'Tổng tín chỉ', value: statistics.totalCredits, icon: 'fas fa-graduation-cap', color: '#8b5cf6', change: '+6' }
    ];

    // Handle actions
    const handleSaveSubject = async (formData) => {
        setModalLoading(true);
        try {
            let response;
            if (currentItem) {
                response = await apiService.updateSubject(currentItem.id, formData);
            } else {
                response = await apiService.createSubject(formData);
            }

            if (response.success) {
                showNotification(
                    currentItem ? 'Cập nhật môn học thành công!' : 'Thêm môn học thành công!',
                    'success'
                );
                setShowSubjectModal(false);
                setCurrentItem(null);
                fetchSubjects();
            } else {
                showNotification(response.message || 'Có lỗi xảy ra khi lưu môn học', 'error');
            }
        } catch (error) {
            console.error('Save subject error:', error);
            showNotification('Có lỗi xảy ra khi lưu môn học: ' + error.message, 'error');
        } finally {
            setModalLoading(false);
        }
    };

    const handleEditSubject = (subject) => {
        setCurrentItem(subject);
        setShowSubjectModal(true);
    };

    const handleDeleteSubject = (subject) => {
        setDeleteTarget(subject);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        setModalLoading(true);
        try {
            const response = await apiService.deleteSubject(deleteTarget.id);

            if (response.success) {
                showNotification('Xóa môn học thành công!', 'success');
                setShowDeleteModal(false);
                setDeleteTarget(null);
                fetchSubjects();
            } else {
                showNotification(response.message || 'Có lỗi xảy ra khi xóa', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showNotification('Có lỗi xảy ra khi xóa: ' + error.message, 'error');
        } finally {
            setModalLoading(false);
        }
    };

    const handleAddSubject = () => {
        setCurrentItem(null);
        setShowSubjectModal(true);
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
                    activePage="subjects"
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
                            <p style={{ color: '#64748b' }}>Bạn không có quyền truy cập trang quản lý môn học.</p>
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
                activePage="subjects"
            />

            {/* Main Content */}
            <main style={mainContentStyle}>
                {/* Header */}
                <header style={styles.header}>
                    <div style={styles.headerLeft}>
                        <h1 style={styles.pageTitle}>
                            <i className="fas fa-book" style={{ color: '#6366f1', marginRight: '1rem' }}></i>
                            Quản lý môn học
                        </h1>
                        <p style={styles.pageSubtitle}>Quản lý thông tin môn học trong hệ thống</p>
                    </div>
                    <div style={styles.headerRight}>
                        <div style={styles.headerActions}>
                            <button
                                style={styles.actionBtn}
                                onClick={() => fetchData()}
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

                            <button
                                style={{ ...classManagementStyles.btn, ...classManagementStyles.btnSecondary }}
                                onClick={() => setShowSubjectImportModal(true)}
                            >
                                <i className="fas fa-file-import"></i>
                                Import Excel
                            </button>
                            <button
                                style={{ ...classManagementStyles.btn, ...classManagementStyles.btnPrimary }}
                                onClick={handleAddSubject}
                            >
                                <i className="fas fa-plus"></i>
                                Thêm môn học
                            </button>
                        </div>
                    </div>
                </header>

                <div style={styles.dashboardContent}>
                    <LoadingOverlay isLoading={loading} />

                    {/* Statistics */}
                    <section style={{ marginBottom: '2rem' }}>
                        <div style={styles.statsGrid}>
                            {statsConfig.map((stat, index) => (
                                <StatsCard key={index} {...stat} />
                            ))}
                        </div>
                    </section>

                    {/* Filter Bar */}
                    <div style={classManagementStyles.filterBar}>
                        <div style={classManagementStyles.searchSection}>
                            <div style={classManagementStyles.searchBox}>
                                <i className="fas fa-search" style={classManagementStyles.searchIcon}></i>
                                <input
                                    type="text"
                                    style={classManagementStyles.searchInput}
                                    placeholder="Tìm kiếm môn học (tên, mã, mô tả)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button
                                        style={classManagementStyles.clearSearch}
                                        onClick={() => setSearchQuery("")}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                )}
                            </div>

                            <select
                                style={{
                                    padding: "0.5rem 1rem",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "0.5rem",
                                    fontSize: "0.875rem",
                                    backgroundColor: "#fff",
                                    minWidth: "150px",
                                    outline: "none"
                                }}
                                value={subjectStatusFilter}
                                onChange={(e) => setSubjectStatusFilter(e.target.value)}
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Không hoạt động</option>
                            </select>
                        </div>

                        <div style={classManagementStyles.filterSection}>
                            <button
                                style={{ ...classManagementStyles.btn, ...classManagementStyles.btnSecondary }}
                                onClick={() => {
                                    setSearchQuery("");
                                    setSubjectStatusFilter("");
                                }}
                            >
                                <i className="fas fa-filter"></i>
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>


                    {/* Subjects Grid */}
                    <section>
                        <div style={styles.sectionHeader}>
                            <h2 style={styles.sectionTitle}>
                                <i className="fas fa-book" style={styles.sectionIcon}></i>
                                Danh sách môn học ({filteredSubjects.length})
                            </h2>
                        </div>

                        {filteredSubjects.length === 0 && !loading ? (
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
                                    <i className="fas fa-book"></i>
                                </div>
                                <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>
                                    {searchQuery ? 'Không tìm thấy môn học nào' : 'Chưa có môn học nào'}
                                </h3>
                                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                                    {searchQuery
                                        ? 'Thử điều chỉnh từ khóa tìm kiếm để xem kết quả khác'
                                        : 'Bắt đầu bằng cách tạo môn học đầu tiên của bạn'
                                    }
                                </p>
                                <button
                                    style={{ ...classManagementStyles.btn, ...classManagementStyles.btnPrimary }}
                                    onClick={handleAddSubject}
                                >
                                    <i className="fas fa-plus"></i>
                                    Thêm môn học đầu tiên
                                </button>
                            </div>
                        ) : (
                            <div style={{
                                background: 'white',
                                borderRadius: '1rem',
                                border: '1px solid #e2e8f0',
                                overflow: 'hidden'
                            }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse'
                                }}>
                                    <thead>
                                        <tr style={{
                                            background: '#f8fafc',
                                            borderBottom: '1px solid #e2e8f0'
                                        }}>
                                            <th style={{
                                                padding: '1rem',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                color: '#374151',
                                                fontSize: '0.875rem'
                                            }}>
                                                Mã môn học
                                            </th>
                                            <th style={{
                                                padding: '1rem',
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                color: '#374151',
                                                fontSize: '0.875rem'
                                            }}>
                                                Tên môn học
                                            </th>
                                            <th style={{
                                                padding: '1rem',
                                                textAlign: 'center',
                                                fontWeight: '600',
                                                color: '#374151',
                                                fontSize: '0.875rem'
                                            }}>
                                                Số tín chỉ
                                            </th>
                                            {/* <th style={{
                                                padding: '1rem',
                                                textAlign: 'center',
                                                fontWeight: '600',
                                                color: '#374151',
                                                fontSize: '0.875rem'
                                            }}>
                                                Loại môn học
                                            </th> */}
                                            <th style={{
                                                padding: '1rem',
                                                textAlign: 'center',
                                                fontWeight: '600',
                                                color: '#374151',
                                                fontSize: '0.875rem'
                                            }}>
                                                Ngày tạo
                                            </th>
                                            <th style={{
                                                padding: '1rem',
                                                textAlign: 'center',
                                                fontWeight: '600',
                                                color: '#374151',
                                                fontSize: '0.875rem'
                                            }}>
                                                Thao tác
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSubjects.map((subject, index) => (
                                            <tr
                                                key={subject.id}
                                                style={{
                                                    borderBottom: index < filteredSubjects.length - 1 ? '1px solid #f1f5f9' : 'none',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#f8fafc'}
                                                onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                                            >
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{
                                                        fontWeight: '600',
                                                        color: '#1e293b',
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        {subject.code}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{
                                                        fontWeight: '500',
                                                        color: '#1e293b',
                                                        marginBottom: '0.25rem'
                                                    }}>
                                                        {subject.name}
                                                    </div>
                                                    {subject.description && (
                                                        <div style={{
                                                            fontSize: '0.75rem',
                                                            color: '#64748b'
                                                        }}>
                                                            {subject.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '1rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '500',
                                                        background: '#ddd6fe',
                                                        color: '#7c3aed'
                                                    }}>
                                                        {subject.credits}
                                                    </span>
                                                </td>
                                                {/* <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '1rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '500',
                                                        background: subject.subject_type === 'Bắt buộc' ? '#dcfce7' : '#fef3c7',
                                                        color: subject.subject_type === 'Bắt buộc' ? '#166534' : '#d97706'
                                                    }}>
                                                        {subject.subject_type || 'Chưa xác định'}
                                                    </span>
                                                </td> */}
                                                <td style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                                                    {new Date(subject.created_at).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button
                                                            style={{
                                                                padding: '0.5rem 0.75rem',
                                                                background: '#fef3c7',
                                                                color: '#d97706',
                                                                border: 'none',
                                                                borderRadius: '0.375rem',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '500'
                                                            }}
                                                            onClick={() => handleEditSubject(subject)}
                                                            title="Chỉnh sửa"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            style={{
                                                                padding: '0.5rem 0.75rem',
                                                                background: '#fee2e2',
                                                                color: '#dc2626',
                                                                border: 'none',
                                                                borderRadius: '0.375rem',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '500'
                                                            }}
                                                            onClick={() => handleDeleteSubject(subject)}
                                                            title="Xóa"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Subject Modal */}
            <Modal
                isOpen={showSubjectModal}
                onClose={() => !modalLoading && setShowSubjectModal(false)}
                title={currentItem ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
            >
                <SubjectForm
                    subject={currentItem}
                    onSave={handleSaveSubject}
                    onCancel={() => setShowSubjectModal(false)}
                    isLoading={modalLoading}
                />
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
                            Bạn có chắc chắn muốn xóa môn học
                            <strong> "{deleteTarget?.name}"</strong> không?
                        </p>
                        <small style={{ color: '#94a3b8' }}>
                            Hành động này không thể hoàn tác!
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
                                Xóa môn học
                            </>
                        )}
                    </button>
                </div>
            </Modal>

            {/* Subject Import Modal */}
            <ImportModal
                isOpen={showSubjectImportModal}
                onClose={() => setShowSubjectImportModal(false)}
                onImport={handleImportFile}
                isLoading={modalLoading}
                type="subjects"
                title="📚 Import Môn học từ Excel"
                templateData={subjectTemplate}
            />
        </div>
    );
};

export default SubjectManagement;