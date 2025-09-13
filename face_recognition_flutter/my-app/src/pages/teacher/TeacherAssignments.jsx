import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';
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

// Main Component
const TeacherAssignments = () => {
    const navigate = useNavigate();
    const { notifications, showNotification, removeNotification } = useNotification();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [filterStatus, setFilterStatus] = useState('active');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentUser, setCurrentUser] = useState(null);

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
        if (!window.confirm(`Bạn có chắc chắn muốn xóa bài tập "${assignment.title}"?`)) {
            return;
        }

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
        if (filterStatus === 'all') {
            return assignments;
        }

        return assignments.filter(assignment => {
            if (filterStatus === 'active') {
                return assignment.is_active === 1;
            }
            if (filterStatus === 'draft' || filterStatus === 'closed') {
                return assignment.is_active === 0;
            }
            return true;
        });
    }, [assignments, filterStatus]);


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

                {/* Filters */}
                <div style={styles.filterContainer}>
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

                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#64748b' }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                        Hiển thị {filteredAssignments.length} bài tập
                    </div>
                </div>

                {/* Assignment Cards */}
                {filteredAssignments.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyStateIcon}>
                            <i className="fas fa-tasks"></i>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                            Chưa có bài tập nào
                        </div>
                        <div style={{ fontSize: '14px', marginBottom: '20px' }}>
                            Tạo bài tập mới để bắt đầu quản lý bài tập của bạn
                        </div>
                        <button
                            style={{ ...styles.button, ...styles.buttonPrimary }}
                            onClick={() => navigate('/teacher/assignments/new')}
                        >
                            <i className="fas fa-plus"></i>
                            Tạo bài tập đầu tiên
                        </button>
                    </div>
                ) : (
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
                )}
            </div>
        </AppLayout>
    );
};

export default TeacherAssignments;