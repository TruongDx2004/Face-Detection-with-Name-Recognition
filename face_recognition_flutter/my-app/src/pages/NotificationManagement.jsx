import React, { useState, useEffect } from 'react';
import apiService from '../services/api-service';
import useNotification from '../hooks/useNotification';
import NotificationForm from '../components/NotificationForm';
import NotificationDetail from '../components/NotificationDetail';
import authService from '../services/auth-service'
import styles from '../components/styles';
import Sidebar from '../components/Sidebar';
import Notification from '../components/Notification';
import LoadingOverlay from '../components/LoadingOverlay';

const NotificationManagement = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        type: '',
        category: '',
        status: '',
        search: ''
    });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingNotification, setEditingNotification] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [hasPermission, setHasPermission] = useState(false);
    
    ///const currentTime = useTime();
    const { notifications: toastNotifications, showNotification, removeNotification } = useNotification();

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

            loadNotifications();
            loadCategories();
        };

        checkPermission();
    }, []);

    useEffect(() => {
        if (hasPermission) {
            loadNotifications();
        }
    }, [currentPage, filters, hasPermission]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: 20,
                ...filters
            };

            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '') delete params[key];
            });

            const response = await apiService.getAdminNotifications(params);
            setNotifications(response.data.notifications || []);
            setTotalPages(response.data.pagination?.total_pages || 1);
        } catch (error) {
            console.error('Error loading notifications:', error);
            showNotification('Có lỗi khi tải danh sách thông báo', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await apiService.getNotificationCategories();
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;

        try {
            await apiService.deleteNotification(id);
            showNotification('Xóa thông báo thành công', 'success');
            loadNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
            showNotification('Có lỗi khi xóa thông báo', 'error');
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({
            type: '',
            category: '',
            status: '',
            search: ''
        });
        setCurrentPage(1);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { color: '#6B7280', label: 'Bản nháp' },
            published: { color: '#10B981', label: 'Đã đăng' },
            archived: { color: '#8B5CF6', label: 'Đã lưu trữ' },
            cancelled: { color: '#EF4444', label: 'Đã hủy' }
        };

        const config = statusConfig[status] || statusConfig.draft;
        return (
            <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: config.color,
                color: 'white'
            }}>
                {config.label}
            </span>
        );
    };

    const getCategoryBadge = (category) => {
        const categoryConfig = {
            general: { color: '#6B7280', label: 'Chung' },
            academic: { color: '#3B82F6', label: 'Học tập' },
            extracurricular: { color: '#10B981', label: 'Ngoại khóa' },
            urgent: { color: '#EF4444', label: 'Khẩn cấp' }
        };

        const config = categoryConfig[category] || categoryConfig.general;
        return (
            <span style={{
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '11px',
                backgroundColor: config.color + '20',
                color: config.color,
                border: `1px solid ${config.color}40`
            }}>
                {config.label}
            </span>
        );
    };

    const mainContentStyle = {
        ...styles.mainContent,
        ...(sidebarCollapsed ? styles.mainContentCollapsed : {})
    };

    const notificationStyles = {
        container: {
            padding: '20px',
            fontFamily: 'Arial, sans-serif'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '2px solid #e5e7eb'
        },
        title: {
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
        },
        createButton: {
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        filtersContainer: {
            backgroundColor: '#f9fafb',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #e5e7eb'
        },
        filtersRow: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            alignItems: 'end'
        },
        filterGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
        },
        filterLabel: {
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151'
        },
        filterInput: {
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
        },
        resetButton: {
            padding: '8px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
        },
        tableContainer: {
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse'
        },
        tableHeader: {
            backgroundColor: '#f3f4f6',
            borderBottom: '1px solid #e5e7eb'
        },
        tableHeaderCell: {
            padding: '12px 15px',
            textAlign: 'left',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151'
        },
        tableRow: {
            borderBottom: '1px solid #f3f4f6'
        },
        tableCell: {
            padding: '12px 15px',
            fontSize: '14px',
            color: '#374151'
        },
        actionButton: {
            padding: '6px 12px',
            margin: '0 4px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
        },
        editButton: {
            backgroundColor: '#f59e0b',
            color: 'white'
        },
        deleteButton: {
            backgroundColor: '#ef4444',
            color: 'white'
        },
        viewButton: {
            backgroundColor: '#3b82f6',
            color: 'white'
        },
        pagination: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            marginTop: '20px',
            padding: '20px'
        },
        pageButton: {
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            backgroundColor: 'white',
            cursor: 'pointer',
            borderRadius: '4px'
        },
        activePageButton: {
            backgroundColor: '#3b82f6',
            color: 'white',
            border: '1px solid #3b82f6'
        },
        loadingContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            fontSize: '16px',
            color: '#6b7280'
        },
        priorityBadge: {
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '11px',
            backgroundColor: '#fbbf24',
            color: '#92400e',
            fontWeight: '600'
        },
        emptyState: {
            textAlign: 'center',
            padding: '40px',
            color: '#6b7280'
        }
    };

    if (!hasPermission) {
        return (
            <div style={styles.appContainer}>
                <Sidebar
                    isCollapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    activePage="notifications"
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
                            <p style={{ color: '#64748b' }}>Bạn không có quyền truy cập trang quản lý thông báo.</p>
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
                {toastNotifications.map((notification) => (
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
                activePage="notifications"
            />

            {/* Main Content */}
            <main style={mainContentStyle}>
                <LoadingOverlay isLoading={loading} />
                
                {/* Header */}
                <header style={styles.header}>
                    <div style={styles.headerLeft}>
                        <h1 style={styles.pageTitle}>
                            <i className="fas fa-bullhorn" style={{ color: '#6366f1', marginRight: '1rem' }}></i>
                            Quản lý Thông báo & Sự kiện
                        </h1>
                        <p style={styles.pageSubtitle}>Quản lý thông báo chung và sự kiện của nhà trường</p>
                    </div>
                    <div style={styles.headerRight}>
                        <div style={styles.headerActions}>
                            <button
                                style={styles.actionBtn}
                                onClick={() => loadNotifications()}
                                title="Làm mới dữ liệu"
                            >
                                <i className="fas fa-sync-alt"></i>
                            </button>
                        </div>
                        <button
                            style={{ ...styles.btn, ...styles.btnPrimary }}
                            onClick={() => setShowCreateModal(true)}
                        >
                            <i className="fas fa-plus"></i>
                            Tạo mới
                        </button>
                    </div>
                </header>

                <div style={styles.dashboardContent}>
                    <div style={notificationStyles.container}>

            {/* Filters */}
            <div style={notificationStyles.filtersContainer}>
                <div style={notificationStyles.filtersRow}>
                    <div style={notificationStyles.filterGroup}>
                        <label style={notificationStyles.filterLabel}>Tìm kiếm</label>
                        <input
                            type="text"
                            style={notificationStyles.filterInput}
                            placeholder="Tìm theo tiêu đề..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                    
                    <div style={notificationStyles.filterGroup}>
                        <label style={notificationStyles.filterLabel}>Loại</label>
                        <select
                            style={notificationStyles.filterInput}
                            value={filters.type}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                        >
                            <option value="">Tất cả</option>
                            <option value="notification">Thông báo</option>
                            <option value="event">Sự kiện</option>
                        </select>
                    </div>

                    <div style={notificationStyles.filterGroup}>
                        <label style={notificationStyles.filterLabel}>Phân loại</label>
                        <select
                            style={notificationStyles.filterInput}
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                        >
                            <option value="">Tất cả</option>
                            {categories.map(cat => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={notificationStyles.filterGroup}>
                        <label style={notificationStyles.filterLabel}>Trạng thái</label>
                        <select
                            style={notificationStyles.filterInput}
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="">Tất cả</option>
                            <option value="draft">Bản nháp</option>
                            <option value="published">Đã đăng</option>
                            <option value="archived">Đã lưu trữ</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                    </div>

                    <div style={notificationStyles.filterGroup}>
                        <button style={notificationStyles.resetButton} onClick={resetFilters}>
                            <i className="fas fa-undo" style={{ marginRight: '5px' }}></i>
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div style={notificationStyles.tableContainer}>
                {loading ? (
                    <div style={notificationStyles.loadingContainer}>
                        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
                        Đang tải...
                    </div>
                ) : notifications.length === 0 ? (
                    <div style={notificationStyles.emptyState}>
                        <i className="fas fa-inbox" style={{ fontSize: '48px', marginBottom: '10px', color: '#d1d5db' }}></i>
                        <p>Không có thông báo nào</p>
                    </div>
                ) : (
                    <table style={notificationStyles.table}>
                        <thead style={notificationStyles.tableHeader}>
                            <tr>
                                <th style={notificationStyles.tableHeaderCell}>Tiêu đề</th>
                                <th style={notificationStyles.tableHeaderCell}>Loại</th>
                                <th style={notificationStyles.tableHeaderCell}>Phân loại</th>
                                <th style={notificationStyles.tableHeaderCell}>Trạng thái</th>
                                <th style={notificationStyles.tableHeaderCell}>Ngày đăng</th>
                                <th style={notificationStyles.tableHeaderCell}>Lượt xem</th>
                                <th style={notificationStyles.tableHeaderCell}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notifications.map((notification) => (
                                <tr key={notification.id} style={notificationStyles.tableRow}>
                                    <td style={notificationStyles.tableCell}>
                                        <div>
                                            <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                                                {notification.is_priority === 1 && (
                                                    <span style={notificationStyles.priorityBadge}>
                                                        ⭐ Ưu tiên
                                                    </span>
                                                )}
                                                {notification.title}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                Tạo bởi: {notification.creator_name}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={notificationStyles.tableCell}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            backgroundColor: notification.type === 'event' ? '#dcfce7' : '#dbeafe',
                                            color: notification.type === 'event' ? '#166534' : '#1d4ed8'
                                        }}>
                                            {notification.type === 'event' ? 'Sự kiện' : 'Thông báo'}
                                        </span>
                                    </td>
                                    <td style={notificationStyles.tableCell}>
                                        {getCategoryBadge(notification.category)}
                                    </td>
                                    <td style={notificationStyles.tableCell}>
                                        {getStatusBadge(notification.status)}
                                    </td>
                                    <td style={notificationStyles.tableCell}>
                                        {formatDate(notification.publish_date)}
                                    </td>
                                    <td style={notificationStyles.tableCell}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <i className="fas fa-eye" style={{ color: '#6b7280' }}></i>
                                            {notification.view_count || 0}
                                        </span>
                                    </td>
                                    <td style={notificationStyles.tableCell}>
                                        <button
                                            style={{ ...notificationStyles.actionButton, ...notificationStyles.viewButton }}
                                            onClick={() => setSelectedNotification(notification)}
                                            title="Xem chi tiết"
                                        >
                                            <i className="fas fa-eye"></i>
                                        </button>
                                        <button
                                            style={{ ...notificationStyles.actionButton, ...notificationStyles.editButton }}
                                            onClick={() => setEditingNotification(notification)}
                                            title="Chỉnh sửa"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            style={{ ...notificationStyles.actionButton, ...notificationStyles.deleteButton }}
                                            onClick={() => handleDelete(notification.id)}
                                            title="Xóa"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={notificationStyles.pagination}>
                    <button
                        style={styles.pageButton}
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        return (
                            <button
                                key={page}
                                style={{
                                    ...notificationStyles.pageButton,
                                    ...(page === currentPage ? notificationStyles.activePageButton : {})
                                }}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        );
                    })}
                    
                    <button
                        style={styles.pageButton}
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            )}

            {/* Create/Edit Modal */}
            <NotificationForm
                isOpen={showCreateModal || !!editingNotification}
                onClose={() => {
                    setShowCreateModal(false);
                    setEditingNotification(null);
                }}
                notification={editingNotification}
                onSuccess={() => {
                    loadNotifications();
                    setShowCreateModal(false);
                    setEditingNotification(null);
                }}
            />

            {/* Detail Modal */}
            <NotificationDetail
                isOpen={!!selectedNotification}
                onClose={() => setSelectedNotification(null)}
                notificationId={selectedNotification?.id}
            />
                </div>
            </div>
            </main>
        </div>
    );
};

export default NotificationManagement;