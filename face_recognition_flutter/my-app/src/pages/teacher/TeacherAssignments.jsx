import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import ConfirmModal from '../../components/ConfirmModal';
import { AppLayout, Header } from '../../components/layout/AppLayout';

// Styles
const styles = {
    assignmentGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
    },
    assignmentCard: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s ease'
    },
    assignmentCardHover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
    },
    assignmentHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
    },
    assignmentTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1a202c',
        marginBottom: '4px'
    },
    assignmentCourse: {
        fontSize: '14px',
        color: '#64748b'
    },
    assignmentStatus: {
        fontSize: '12px',
        padding: '4px 8px',
        borderRadius: '6px',
        fontWeight: '500'
    },
    statusActive: {
        backgroundColor: '#10b981',
        color: '#ffffff'
    },
    statusDraft: {
        backgroundColor: '#f59e0b',
        color: '#ffffff'
    },
    statusClosed: {
        backgroundColor: '#ef4444',
        color: '#ffffff'
    },
    assignmentDetails: {
        marginTop: '16px'
    },
    assignmentDetailItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        fontSize: '14px',
        color: '#374151'
    },
    assignmentActions: {
        display: 'flex',
        gap: '8px',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid #e2e8f0'
    },
    button: {
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
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
    section: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
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
    filterContainer: {
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
    },
    filterSelect: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        backgroundColor: '#ffffff'
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 20px',
        color: '#64748b'
    },
    emptyStateIcon: {
        fontSize: '48px',
        marginBottom: '16px',
        color: '#cbd5e1'
    },
    loadingSpinner: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        fontSize: '18px',
        color: '#64748b'
    },
    searchInput: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        backgroundColor: '#ffffff',
        minWidth: '200px'
    },
    dateInput: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        backgroundColor: '#ffffff',
        minWidth: '150px'
    },
    viewToggle: {
        display: 'flex',
        backgroundColor: '#f1f5f9',
        borderRadius: '6px',
        padding: '2px',
        border: '1px solid #e2e8f0'
    },
    viewToggleButton: {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '4px',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: 'transparent',
        color: '#64748b'
    },
    viewToggleButtonActive: {
        backgroundColor: '#3b82f6',
        color: '#ffffff'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
    },
    tableHeader: {
        backgroundColor: '#f8fafc'
    },
    tableHeaderCell: {
        padding: '12px 16px',
        textAlign: 'left',
        fontWeight: '600',
        fontSize: '14px',
        color: '#374151',
        borderBottom: '1px solid #e2e8f0',
        cursor: 'pointer',
        position: 'relative'
    },
    tableRow: {
        borderBottom: '1px solid #e2e8f0',
        transition: 'background-color 0.2s ease'
    },
    tableRowHover: {
        backgroundColor: '#f8fafc'
    },
    tableCell: {
        padding: '12px 16px',
        fontSize: '14px',
        color: '#374151',
        verticalAlign: 'middle'
    },
    actionButtons: {
        display: 'flex',
        gap: '4px'
    },
    actionButton: {
        padding: '4px 8px',
        border: 'none',
        borderRadius: '4px',
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    sortIcon: {
        marginLeft: '4px',
        fontSize: '12px',
        color: '#9ca3af'
    },
    filterRow: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: '16px'
    },
    filterGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    filterLabel: {
        fontSize: '12px',
        fontWeight: '500',
        color: '#374151'
    }
};

// Assignment Card Component
const AssignmentCard = ({ assignment, onViewDetails, onEdit, onDelete }) => {
    const [hovered, setHovered] = useState(false);

    const getStatusStyle = (status) => {
        switch (status) {
            case 1:
                return styles.statusActive;
            case 'draft':
                return styles.statusDraft;
            case 0:
                return styles.statusClosed;
            default:
                return styles.statusDraft;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 1:
                return 'Đang hoạt động';
            case 'draft':
                return 'Bản nháp';
            case 0:
                return 'Đã đóng';
            default:
                return 'Bản nháp';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa xác định';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div
            style={{
                ...styles.assignmentCard,
                ...(hovered ? styles.assignmentCardHover : {})
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div style={styles.assignmentHeader}>
                <div>
                    <div style={styles.assignmentTitle}>{assignment.title}</div>
                    <div style={styles.assignmentCourse}>
                        {assignment.course_name} - {assignment.subject_name}
                    </div>
                </div>
                <div style={{
                    ...styles.assignmentStatus,
                    ...getStatusStyle(assignment.is_active)
                }}>
                    {getStatusText(assignment.is_active)}
                </div>
            </div>

            <div style={styles.assignmentDetails}>
                <div style={styles.assignmentDetailItem}>
                    <i className="fas fa-calendar-alt" style={{ width: '16px', color: '#3b82f6' }}></i>
                    <span>Hạn nộp: {formatDate(assignment.due_date)}</span>
                </div>
                <div style={styles.assignmentDetailItem}>
                    <i className="fas fa-star" style={{ width: '16px', color: '#f59e0b' }}></i>
                    <span>Điểm tối đa: {assignment.max_points || 'Chưa xác định'}</span>
                </div>
                <div style={styles.assignmentDetailItem}>
                    <i className="fas fa-users" style={{ width: '16px', color: '#10b981' }}></i>
                    <span>Số bài nộp: {assignment.submission_count || 0}</span>
                </div>
                {assignment.description && (
                    <div style={styles.assignmentDetailItem}>
                        <i className="fas fa-align-left" style={{ width: '16px', color: '#64748b' }}></i>
                        <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '300px'
                        }}>
                            {assignment.description}
                        </span>
                    </div>
                )}
            </div>

            <div style={styles.assignmentActions}>
                <button
                    style={{ ...styles.button, ...styles.buttonPrimary }}
                    onClick={() => onViewDetails(assignment)}
                >
                    <i className="fas fa-eye"></i>
                    Chi tiết
                </button>
                <button
                    style={{ ...styles.button, ...styles.buttonSecondary }}
                    onClick={() => onEdit(assignment)}
                >
                    <i className="fas fa-edit"></i>
                    Sửa
                </button>
                <button
                    style={{ ...styles.button, ...styles.buttonDanger }}
                    onClick={() => onDelete(assignment)}
                >
                    <i className="fas fa-trash"></i>
                    Xóa
                </button>
            </div>
        </div>
    );
};

// Loading Spinner Component
const LoadingSpinner = () => (
    <div style={styles.loadingSpinner}>
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Đang tải dữ liệu...
    </div>
);

// Error Message Component
const ErrorMessage = ({ message, onRetry }) => (
    <div style={styles.emptyState}>
        <div style={styles.emptyStateIcon}>
            <i className="fas fa-exclamation-triangle"></i>
        </div>
        <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
            Có lỗi xảy ra
        </div>
        <div style={{ fontSize: '14px', marginBottom: '20px' }}>
            {message}
        </div>
        <button
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={onRetry}
        >
            <i className="fas fa-sync-alt"></i>
            Thử lại
        </button>
    </div>
);

// Assignment Table Component
const AssignmentTable = ({ assignments, onViewDetails, onEdit, onDelete, onSort, sortField, sortDirection }) => {
    const [hoveredRow, setHoveredRow] = useState(null);

    const getStatusStyle = (status) => {
        switch (status) {
            case 1:
                return { ...styles.assignmentStatus, ...styles.statusActive };
            case 0:
                return { ...styles.assignmentStatus, ...styles.statusClosed };
            default:
                return { ...styles.assignmentStatus, ...styles.statusDraft };
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 1:
                return 'Đang hoạt động';
            case 0:
                return 'Đã đóng';
            default:
                return 'Bản nháp';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa xác định';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSortIcon = (field) => {
        if (sortField !== field) return <i className="fas fa-sort" style={styles.sortIcon}></i>;
        return sortDirection === 'asc' 
            ? <i className="fas fa-sort-up" style={styles.sortIcon}></i>
            : <i className="fas fa-sort-down" style={styles.sortIcon}></i>;
    };

    return (
        <table style={styles.table}>
            <thead style={styles.tableHeader}>
                <tr>
                    <th style={styles.tableHeaderCell} onClick={() => onSort('title')}>
                        Tên bài tập {getSortIcon('title')}
                    </th>
                    <th style={styles.tableHeaderCell} onClick={() => onSort('course_name')}>
                        Khóa học {getSortIcon('course_name')}
                    </th>
                    <th style={styles.tableHeaderCell} onClick={() => onSort('due_date')}>
                        Hạn nộp {getSortIcon('due_date')}
                    </th>
                    <th style={styles.tableHeaderCell} onClick={() => onSort('max_points')}>
                        Điểm tối đa {getSortIcon('max_points')}
                    </th>
                    <th style={styles.tableHeaderCell} onClick={() => onSort('submission_count')}>
                        Số bài nộp {getSortIcon('submission_count')}
                    </th>
                    <th style={styles.tableHeaderCell} onClick={() => onSort('is_active')}>
                        Trạng thái {getSortIcon('is_active')}
                    </th>
                    <th style={styles.tableHeaderCell}>
                        Thao tác
                    </th>
                </tr>
            </thead>
            <tbody>
                {assignments.map((assignment) => (
                    <tr
                        key={assignment.id}
                        style={{
                            ...styles.tableRow,
                            ...(hoveredRow === assignment.id ? styles.tableRowHover : {})
                        }}
                        onMouseEnter={() => setHoveredRow(assignment.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                    >
                        <td style={styles.tableCell}>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                {assignment.title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {assignment.description || 'Không có mô tả'}
                            </div>
                        </td>
                        <td style={styles.tableCell}>
                            <div style={{ fontWeight: '500' }}>{assignment.course_name}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{assignment.subject_name}</div>
                        </td>
                        <td style={styles.tableCell}>
                            {formatDate(assignment.due_date)}
                        </td>
                        <td style={styles.tableCell}>
                            {assignment.max_points || 'Chưa xác định'}
                        </td>
                        <td style={styles.tableCell}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px',
                                color: assignment.submission_count > 0 ? '#10b981' : '#64748b'
                            }}>
                                <i className="fas fa-users"></i>
                                {assignment.submission_count || 0}
                            </div>
                        </td>
                        <td style={styles.tableCell}>
                            <span style={getStatusStyle(assignment.is_active)}>
                                {getStatusText(assignment.is_active)}
                            </span>
                        </td>
                        <td style={styles.tableCell}>
                            <div style={styles.actionButtons}>
                                <button
                                    style={{ ...styles.actionButton, backgroundColor: '#3b82f6', color: '#ffffff' }}
                                    onClick={() => onViewDetails(assignment)}
                                    title="Xem chi tiết"
                                >
                                    <i className="fas fa-eye"></i>
                                </button>
                                <button
                                    style={{ ...styles.actionButton, backgroundColor: '#10b981', color: '#ffffff' }}
                                    onClick={() => onEdit(assignment)}
                                    title="Chỉnh sửa"
                                >
                                    <i className="fas fa-edit"></i>
                                </button>
                                <button
                                    style={{ ...styles.actionButton, backgroundColor: '#ef4444', color: '#ffffff' }}
                                    onClick={() => onDelete(assignment)}
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
    );
};

// Main Component
const TeacherAssignments = () => {
    const navigate = useNavigate();
    const { notifications, showNotification, removeNotification } = useNotification();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [filterStatus, setFilterStatus] = useState('active');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCourse, setFilterCourse] = useState('all');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
    const [sortField, setSortField] = useState('due_date');
    const [sortDirection, setSortDirection] = useState('asc');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentUser, setCurrentUser] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null
    });

    useEffect(() => {
        loadAssignments();
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);

        return () => clearInterval(timer);
    }, []);

    const loadAssignments = async () => {
        try {
            setLoading(true);
            setError(null);

            const user = await ApiService.getProfile();
            setCurrentUser(user.data);

            const response = await ApiService.getTeacherAssignments(user.data.id);
            console.log(response);
            if (response.success) {
                setAssignments(response.data || []);
            } else {
                throw new Error(response.message || 'Không thể tải danh sách bài tập');
            }
        } catch (error) {
            console.error('Error loading assignments:', error);
            setError(error.message || 'Không thể tải danh sách bài tập');
            showNotification('Không thể tải danh sách bài tập', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleViewDetails = (assignment) => {
        navigate(`/teacher/assignments/${assignment.id}`);
    };

    const handleEdit = (assignment) => {
        navigate(`/teacher/assignments/${assignment.id}/edit`);
    };

    const handleDelete = async (assignment) => {
        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận xóa bài tập',
            message: `Bạn có chắc chắn muốn xóa bài tập "${assignment.title}"? Hành động này không thể hoàn tác.`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                await performDeleteAssignment(assignment);
            },
            onCancel: () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const performDeleteAssignment = async (assignment) => {
        try {
            const response = await ApiService.deleteAssignment(assignment.id);
            if (response.success) {
                showNotification('Xóa bài tập thành công', 'success');
                loadAssignments();
            } else {
                throw new Error(response.message || 'Không thể xóa bài tập');
            }
        } catch (error) {
            console.error('Error deleting assignment:', error);
            showNotification(error.message || 'Không thể xóa bài tập', 'error');
        }
    };

    const filteredAssignments = useMemo(() => {
        let filtered = [...assignments];

        // Filter by status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(assignment => {
                if (filterStatus === 'active') {
                    return assignment.is_active === 1;
                }
                if (filterStatus === 'draft' || filterStatus === 'closed') {
                    return assignment.is_active === 0;
                }
                return true;
            });
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(assignment =>
                assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                assignment.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by course
        if (filterCourse !== 'all') {
            filtered = filtered.filter(assignment => assignment.course_name === filterCourse);
        }

        // Filter by date range
        if (filterDateFrom) {
            filtered = filtered.filter(assignment => {
                if (!assignment.due_date) return false;
                return new Date(assignment.due_date) >= new Date(filterDateFrom);
            });
        }

        if (filterDateTo) {
            filtered = filtered.filter(assignment => {
                if (!assignment.due_date) return false;
                return new Date(assignment.due_date) <= new Date(filterDateTo);
            });
        }

        // Sort assignments
        filtered.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            // Handle different data types
            if (sortField === 'due_date') {
                aValue = new Date(aValue || 0);
                bValue = new Date(bValue || 0);
            } else if (sortField === 'max_points' || sortField === 'submission_count') {
                aValue = Number(aValue) || 0;
                bValue = Number(bValue) || 0;
            } else {
                aValue = String(aValue || '').toLowerCase();
                bValue = String(bValue || '').toLowerCase();
            }

            if (sortDirection === 'asc') {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            } else {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            }
        });

        return filtered;
    }, [assignments, filterStatus, searchTerm, filterCourse, filterDateFrom, filterDateTo, sortField, sortDirection]);


    // Helper functions
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterCourse('all');
        setFilterDateFrom('');
        setFilterDateTo('');
        setFilterStatus('active');
    };

    const uniqueCourses = useMemo(() => {
        const courses = [...new Set(assignments.map(a => a.course_name))].filter(Boolean);
        return courses.sort();
    }, [assignments]);

    const breadcrumb = [
        { label: 'Trang chủ', path: '/teacher' },
        { label: 'Bài tập', path: '/teacher/assignments' }
    ];

    if (loading) {
        return (
            <AppLayout
                user={currentUser}
                onLogout={handleLogout}
                currentTime={currentTime}
                title="Bài tập"
            >
                <LoadingSpinner />
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout
                user={currentUser}
                onLogout={handleLogout}
                currentTime={currentTime}
                title="Bài tập"
            >
                <ErrorMessage message={error} onRetry={loadAssignments} />
            </AppLayout>
        );
    }

    return (
        <AppLayout
            user={currentUser}
            onLogout={handleLogout}
            currentTime={currentTime}
            title="Bài tập"
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
                title="Quản lý bài tập"
                titleIcon="fas fa-tasks"
                showBack={true}
                onBack={() => navigate('/teacher')}
                breadcrumb={breadcrumb}
                actions={[
                    {
                        label: 'Ngân hàng bài tập',
                        icon: 'fas fa-database',
                        onClick: () => navigate('/teacher/assignment-templates')
                    },
                    {
                        label: 'Tạo bài tập mới',
                        icon: 'fas fa-plus',
                        onClick: () => navigate('/teacher/assignments/new')
                    },
                    {
                        label: 'Làm mới',
                        icon: 'fas fa-sync-alt',
                        onClick: loadAssignments
                    }
                ]}
            />

            {/* Main Content */}
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>
                        <i className="fas fa-list"></i>
                        Danh sách bài tập ({filteredAssignments.length})
                    </h2>
                </div>

                {/* Enhanced Filters */}
                <div style={styles.filterContainer}>
                    {/* First Row - Main Filters */}
                    <div style={styles.filterRow}>
                        <div style={styles.filterGroup}>
                            <label style={styles.filterLabel}>Tìm kiếm</label>
                            <input
                                type="text"
                                placeholder="Tìm theo tên bài tập..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={styles.searchInput}
                            />
                        </div>

                        <div style={styles.filterGroup}>
                            <label style={styles.filterLabel}>Trạng thái</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={styles.filterSelect}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="active">Đang hoạt động</option>
                                <option value="draft">Bản nháp</option>
                                <option value="closed">Đã đóng</option>
                            </select>
                        </div>

                        <div style={styles.filterGroup}>
                            <label style={styles.filterLabel}>Khóa học</label>
                            <select
                                value={filterCourse}
                                onChange={(e) => setFilterCourse(e.target.value)}
                                style={styles.filterSelect}
                            >
                                <option value="all">Tất cả khóa học</option>
                                {uniqueCourses.map(course => (
                                    <option key={course} value={course}>{course}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Second Row - Date Filters and View Toggle */}
                    <div style={styles.filterRow}>
                        <div style={styles.filterGroup}>
                            <label style={styles.filterLabel}>Từ ngày</label>
                            <input
                                type="date"
                                value={filterDateFrom}
                                onChange={(e) => setFilterDateFrom(e.target.value)}
                                style={styles.dateInput}
                            />
                        </div>

                        <div style={styles.filterGroup}>
                            <label style={styles.filterLabel}>Đến ngày</label>
                            <input
                                type="date"
                                value={filterDateTo}
                                onChange={(e) => setFilterDateTo(e.target.value)}
                                style={styles.dateInput}
                            />
                        </div>

                        <div style={styles.filterGroup}>
                            <label style={styles.filterLabel}>Hiển thị</label>
                            <div style={styles.viewToggle}>
                                <button
                                    style={{
                                        ...styles.viewToggleButton,
                                        ...(viewMode === 'cards' ? styles.viewToggleButtonActive : {})
                                    }}
                                    onClick={() => setViewMode('cards')}
                                >
                                    <i className="fas fa-th-large"></i>
                                    Thẻ
                                </button>
                                <button
                                    style={{
                                        ...styles.viewToggleButton,
                                        ...(viewMode === 'table' ? styles.viewToggleButtonActive : {})
                                    }}
                                    onClick={() => setViewMode('table')}
                                >
                                    <i className="fas fa-table"></i>
                                    Bảng
                                </button>
                            </div>
                        </div>

                        <div style={styles.filterGroup}>
                            <label style={styles.filterLabel}>&nbsp;</label>
                            <button
                                onClick={clearFilters}
                                style={{ ...styles.button, ...styles.buttonSecondary }}
                            >
                                <i className="fas fa-times"></i>
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>

                    {/* Filter Summary */}
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#64748b', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                        Hiển thị {filteredAssignments.length} / {assignments.length} bài tập
                        {(searchTerm || filterCourse !== 'all' || filterDateFrom || filterDateTo || filterStatus !== 'active') && (
                            <span style={{ marginLeft: '8px', color: '#3b82f6' }}>
                                (Đã áp dụng bộ lọc)
                            </span>
                        )}
                    </div>
                </div>

                {/* Assignment Display */}
                {filteredAssignments.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyStateIcon}>
                            <i className="fas fa-tasks"></i>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                            {assignments.length === 0 ? 'Chưa có bài tập nào' : 'Không tìm thấy bài tập nào'}
                        </div>
                        <div style={{ fontSize: '14px', marginBottom: '20px' }}>
                            {assignments.length === 0 
                                ? 'Tạo bài tập mới để bắt đầu quản lý bài tập của bạn'
                                : 'Thử thay đổi bộ lọc để xem thêm bài tập'
                            }
                        </div>
                        {assignments.length === 0 ? (
                            <button
                                style={{ ...styles.button, ...styles.buttonPrimary }}
                                onClick={() => navigate('/teacher/assignments/new')}
                            >
                                <i className="fas fa-plus"></i>
                                Tạo bài tập đầu tiên
                            </button>
                        ) : (
                            <button
                                onClick={clearFilters}
                                style={{ ...styles.button, ...styles.buttonSecondary }}
                            >
                                <i className="fas fa-times"></i>
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {viewMode === 'cards' ? (
                            <div style={styles.assignmentGrid}>
                                {filteredAssignments.map(assignment => (
                                    <AssignmentCard
                                        key={assignment.id}
                                        assignment={assignment}
                                        onViewDetails={handleViewDetails}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        ) : (
                            <AssignmentTable
                                assignments={filteredAssignments}
                                onViewDetails={handleViewDetails}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onSort={handleSort}
                                sortField={sortField}
                                sortDirection={sortDirection}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                show={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={confirmModal.onCancel}
            />
        </AppLayout>
    );
};

export default TeacherAssignments;