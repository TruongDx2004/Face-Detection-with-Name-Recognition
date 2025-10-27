import React, { useState, useEffect } from 'react';
import apiService from '../services/api-service';
import useNotification from '../hooks/useNotification';

const NotificationDetail = ({ 
    isOpen, 
    onClose, 
    notificationId 
}) => {
    const [notification, setNotification] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [registrationFilters, setRegistrationFilters] = useState({
        status: '',
        page: 1
    });
    const [registrationPagination, setRegistrationPagination] = useState({});
    
    const { showNotification } = useNotification();

    useEffect(() => {
        if (isOpen && notificationId) {
            loadNotificationDetail();
            loadStats();
            if (activeTab === 'registrations') {
                loadRegistrations();
            }
        }
    }, [isOpen, notificationId, activeTab, registrationFilters]);

    const loadNotificationDetail = async () => {
        try {
            setLoading(true);
            const response = await apiService.getNotificationById(notificationId);
            setNotification(response.data);
        } catch (error) {
            console.error('Error loading notification detail:', error);
            showNotification('Có lỗi khi tải chi tiết thông báo', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadRegistrations = async () => {
        if (!notification || notification.type !== 'event') return;
        
        try {
            const response = await apiService.getEventRegistrations(notificationId, registrationFilters);
            setRegistrations(response.data.registrations || []);
            setRegistrationPagination(response.data.pagination || {});
        } catch (error) {
            console.error('Error loading registrations:', error);
            showNotification('Có lỗi khi tải danh sách đăng ký', 'error');
        }
    };

    const loadStats = async () => {
        try {
            const response = await apiService.getNotificationStats(notificationId);
            setStats(response.data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const updateRegistrationStatus = async (registrationId, newStatus, adminNotes = '') => {
        try {
            await apiService.updateRegistrationStatus(registrationId, newStatus, adminNotes);
            showNotification('Cập nhật trạng thái thành công', 'success');
            loadRegistrations();
            loadStats();
        } catch (error) {
            console.error('Error updating registration status:', error);
            showNotification('Có lỗi khi cập nhật trạng thái', 'error');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Không xác định';
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
            registered: { color: '#F59E0B', label: 'Đã đăng ký' },
            confirmed: { color: '#3B82F6', label: 'Đã xác nhận' },
            attended: { color: '#10B981', label: 'Đã tham gia' },
            absent: { color: '#EF4444', label: 'Vắng mặt' },
            cancelled: { color: '#6B7280', label: 'Đã hủy' }
        };

        const config = statusConfig[status] || statusConfig.registered;
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

    if (!isOpen) return null;

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        },
        modal: {
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '95%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        },
        header: {
            padding: '20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        title: {
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
        },
        closeButton: {
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '5px'
        },
        tabContainer: {
            borderBottom: '1px solid #e5e7eb',
            display: 'flex'
        },
        tab: {
            padding: '15px 20px',
            cursor: 'pointer',
            borderBottom: '2px solid transparent',
            fontSize: '14px',
            fontWeight: '500'
        },
        activeTab: {
            borderBottomColor: '#3b82f6',
            color: '#3b82f6'
        },
        content: {
            flex: 1,
            overflow: 'auto',
            padding: '20px'
        },
        detailGrid: {
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '30px'
        },
        mainContent: {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        },
        sidebar: {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        },
        card: {
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px'
        },
        cardTitle: {
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '15px'
        },
        infoItem: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: '1px solid #e5e7eb'
        },
        infoLabel: {
            fontSize: '14px',
            color: '#6b7280',
            fontWeight: '500'
        },
        infoValue: {
            fontSize: '14px',
            color: '#1f2937',
            fontWeight: '500'
        },
        contentText: {
            lineHeight: '1.6',
            color: '#374151',
            whiteSpace: 'pre-wrap'
        },
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '15px'
        },
        statCard: {
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '15px',
            textAlign: 'center'
        },
        statNumber: {
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937'
        },
        statLabel: {
            fontSize: '12px',
            color: '#6b7280',
            marginTop: '5px'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb'
        },
        tableHeader: {
            backgroundColor: '#f3f4f6'
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
        filterContainer: {
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
            alignItems: 'center'
        },
        select: {
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
        },
        actionButton: {
            padding: '4px 8px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
        },
        confirmButton: {
            backgroundColor: '#10b981',
            color: 'white'
        },
        attendButton: {
            backgroundColor: '#3b82f6',
            color: 'white'
        },
        absentButton: {
            backgroundColor: '#ef4444',
            color: 'white'
        },
        loading: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            fontSize: '16px',
            color: '#6b7280'
        },
        tagContainer: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '10px'
        },
        tag: {
            padding: '4px 8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#374151'
        }
    };

    if (loading || !notification) {
        return (
            <div style={styles.overlay}>
                <div style={styles.modal}>
                    <div style={styles.loading}>
                        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
                        Đang tải...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Chi tiết thông báo/sự kiện</h2>
                    <button style={styles.closeButton} onClick={onClose}>×</button>
                </div>

                <div style={styles.tabContainer}>
                    <div
                        style={{
                            ...styles.tab,
                            ...(activeTab === 'details' ? styles.activeTab : {})
                        }}
                        onClick={() => setActiveTab('details')}
                    >
                        <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                        Chi tiết
                    </div>
                    {notification.type === 'event' && (
                        <div
                            style={{
                                ...styles.tab,
                                ...(activeTab === 'registrations' ? styles.activeTab : {})
                            }}
                            onClick={() => setActiveTab('registrations')}
                        >
                            <i className="fas fa-users" style={{ marginRight: '8px' }}></i>
                            Đăng ký ({stats?.registration_stats?.total || 0})
                        </div>
                    )}
                </div>

                <div style={styles.content}>
                    {activeTab === 'details' && (
                        <div style={styles.detailGrid}>
                            <div style={styles.mainContent}>
                                {/* Title and Content */}
                                <div style={styles.card}>
                                    <h3 style={styles.cardTitle}>
                                        {notification.is_priority && (
                                            <span style={{ color: '#f59e0b', marginRight: '8px' }}>⭐</span>
                                        )}
                                        {notification.title}
                                    </h3>
                                    <div style={styles.contentText}>
                                        {notification.content}
                                    </div>
                                    {notification.tags && notification.tags.length > 0 && (
                                        <div style={styles.tagContainer}>
                                            {notification.tags.map((tag, index) => (
                                                <span key={index} style={styles.tag}>
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Event Details */}
                                {notification.type === 'event' && (
                                    <div style={styles.card}>
                                        <h3 style={styles.cardTitle}>Thông tin sự kiện</h3>
                                        <div style={styles.infoItem}>
                                            <span style={styles.infoLabel}>Thời gian bắt đầu:</span>
                                            <span style={styles.infoValue}>
                                                {formatDate(notification.event_start_datetime)}
                                            </span>
                                        </div>
                                        <div style={styles.infoItem}>
                                            <span style={styles.infoLabel}>Thời gian kết thúc:</span>
                                            <span style={styles.infoValue}>
                                                {formatDate(notification.event_end_datetime)}
                                            </span>
                                        </div>
                                        <div style={styles.infoItem}>
                                            <span style={styles.infoLabel}>Địa điểm:</span>
                                            <span style={styles.infoValue}>
                                                {notification.location || 'Chưa xác định'}
                                            </span>
                                        </div>
                                        <div style={styles.infoItem}>
                                            <span style={styles.infoLabel}>Đơn vị tổ chức:</span>
                                            <span style={styles.infoValue}>
                                                {notification.organizer || 'Chưa xác định'}
                                            </span>
                                        </div>
                                        {notification.allow_registration && (
                                            <>
                                                <div style={styles.infoItem}>
                                                    <span style={styles.infoLabel}>Hạn đăng ký:</span>
                                                    <span style={styles.infoValue}>
                                                        {formatDate(notification.registration_deadline)}
                                                    </span>
                                                </div>
                                                <div style={styles.infoItem}>
                                                    <span style={styles.infoLabel}>Phí đăng ký:</span>
                                                    <span style={styles.infoValue}>
                                                        {notification.registration_fee > 0 
                                                            ? `${notification.registration_fee.toLocaleString()} VNĐ`
                                                            : 'Miễn phí'
                                                        }
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div style={styles.sidebar}>
                                {/* Basic Info */}
                                <div style={styles.card}>
                                    <h3 style={styles.cardTitle}>Thông tin cơ bản</h3>
                                    <div style={styles.infoItem}>
                                        <span style={styles.infoLabel}>Loại:</span>
                                        <span style={styles.infoValue}>
                                            {notification.type === 'event' ? 'Sự kiện' : 'Thông báo'}
                                        </span>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <span style={styles.infoLabel}>Phân loại:</span>
                                        <span style={styles.infoValue}>
                                            {notification.category}
                                        </span>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <span style={styles.infoLabel}>Trạng thái:</span>
                                        <span style={styles.infoValue}>
                                            {notification.status}
                                        </span>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <span style={styles.infoLabel}>Ngày đăng:</span>
                                        <span style={styles.infoValue}>
                                            {formatDate(notification.publish_date)}
                                        </span>
                                    </div>
                                    <div style={styles.infoItem}>
                                        <span style={styles.infoLabel}>Người tạo:</span>
                                        <span style={styles.infoValue}>
                                            {notification.creator_name}
                                        </span>
                                    </div>
                                </div>

                                {/* Statistics */}
                                {stats && (
                                    <div style={styles.card}>
                                        <h3 style={styles.cardTitle}>Thống kê</h3>
                                        <div style={styles.statsGrid}>
                                            <div style={styles.statCard}>
                                                <div style={styles.statNumber}>
                                                    {stats.view_count || 0}
                                                </div>
                                                <div style={styles.statLabel}>Lượt xem</div>
                                            </div>
                                            {stats.registration_stats && (
                                                <div style={styles.statCard}>
                                                    <div style={styles.statNumber}>
                                                        {stats.registration_stats.total || 0}
                                                    </div>
                                                    <div style={styles.statLabel}>Đăng ký</div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {stats.registration_stats?.by_status && (
                                            <div style={{ marginTop: '15px' }}>
                                                <div style={styles.infoLabel}>Theo trạng thái:</div>
                                                {Object.entries(stats.registration_stats.by_status).map(([status, count]) => (
                                                    <div key={status} style={styles.infoItem}>
                                                        <span style={styles.infoLabel}>{status}:</span>
                                                        <span style={styles.infoValue}>{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'registrations' && notification.type === 'event' && (
                        <div>
                            {/* Registration Filters */}
                            <div style={styles.filterContainer}>
                                <label>Lọc theo trạng thái:</label>
                                <select
                                    style={styles.select}
                                    value={registrationFilters.status}
                                    onChange={(e) => setRegistrationFilters({
                                        ...registrationFilters,
                                        status: e.target.value,
                                        page: 1
                                    })}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="registered">Đã đăng ký</option>
                                    <option value="confirmed">Đã xác nhận</option>
                                    <option value="attended">Đã tham gia</option>
                                    <option value="absent">Vắng mặt</option>
                                    <option value="cancelled">Đã hủy</option>
                                </select>
                            </div>

                            {/* Registrations Table */}
                            <table style={styles.table}>
                                <thead style={styles.tableHeader}>
                                    <tr>
                                        <th style={styles.tableHeaderCell}>Sinh viên</th>
                                        <th style={styles.tableHeaderCell}>Email</th>
                                        <th style={styles.tableHeaderCell}>Ngày đăng ký</th>
                                        <th style={styles.tableHeaderCell}>Trạng thái</th>
                                        <th style={styles.tableHeaderCell}>Ghi chú</th>
                                        <th style={styles.tableHeaderCell}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.map((registration) => (
                                        <tr key={registration.id} style={styles.tableRow}>
                                            <td style={styles.tableCell}>
                                                <div>
                                                    <div style={{ fontWeight: '500' }}>
                                                        {registration.student_name}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                        {registration.student_username}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={styles.tableCell}>
                                                {registration.student_email}
                                            </td>
                                            <td style={styles.tableCell}>
                                                {formatDate(registration.registration_date)}
                                            </td>
                                            <td style={styles.tableCell}>
                                                {getStatusBadge(registration.status)}
                                            </td>
                                            <td style={styles.tableCell}>
                                                <div style={{ fontSize: '12px', maxWidth: '200px' }}>
                                                    {registration.notes && (
                                                        <div style={{ marginBottom: '5px' }}>
                                                            <strong>SV:</strong> {registration.notes}
                                                        </div>
                                                    )}
                                                    {registration.admin_notes && (
                                                        <div style={{ color: '#6b7280' }}>
                                                            <strong>Admin:</strong> {registration.admin_notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={styles.tableCell}>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    {registration.status === 'registered' && (
                                                        <button
                                                            style={{
                                                                ...styles.actionButton,
                                                                ...styles.confirmButton
                                                            }}
                                                            onClick={() => updateRegistrationStatus(
                                                                registration.id, 
                                                                'confirmed'
                                                            )}
                                                            title="Xác nhận"
                                                        >
                                                            <i className="fas fa-check"></i>
                                                        </button>
                                                    )}
                                                    {['registered', 'confirmed'].includes(registration.status) && (
                                                        <>
                                                            <button
                                                                style={{
                                                                    ...styles.actionButton,
                                                                    ...styles.attendButton
                                                                }}
                                                                onClick={() => updateRegistrationStatus(
                                                                    registration.id, 
                                                                    'attended'
                                                                )}
                                                                title="Đánh dấu đã tham gia"
                                                            >
                                                                <i className="fas fa-user-check"></i>
                                                            </button>
                                                            <button
                                                                style={{
                                                                    ...styles.actionButton,
                                                                    ...styles.absentButton
                                                                }}
                                                                onClick={() => updateRegistrationStatus(
                                                                    registration.id, 
                                                                    'absent'
                                                                )}
                                                                title="Đánh dấu vắng mặt"
                                                            >
                                                                <i className="fas fa-user-times"></i>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination for registrations */}
                            {registrationPagination.total_pages > 1 && (
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    gap: '10px', 
                                    marginTop: '20px' 
                                }}>
                                    <button
                                        onClick={() => setRegistrationFilters({
                                            ...registrationFilters,
                                            page: Math.max(1, registrationFilters.page - 1)
                                        })}
                                        disabled={registrationFilters.page === 1}
                                    >
                                        ◀
                                    </button>
                                    <span>
                                        Trang {registrationFilters.page} / {registrationPagination.total_pages}
                                    </span>
                                    <button
                                        onClick={() => setRegistrationFilters({
                                            ...registrationFilters,
                                            page: Math.min(registrationPagination.total_pages, registrationFilters.page + 1)
                                        })}
                                        disabled={registrationFilters.page === registrationPagination.total_pages}
                                    >
                                        ▶
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationDetail;