import React, { useState, useEffect } from 'react';
import apiService from '../services/api-service';

const NotificationDashboard = () => {
    const [stats, setStats] = useState({
        total: 0,
        published: 0,
        events: 0,
        notifications: 0,
        recentActivity: []
    });
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            // Load recent notifications
            const response = await apiService.getAdminNotifications({ 
                page: 1, 
                limit: 5,
                status: 'published'
            });
            
            setRecentNotifications(response.data.notifications || []);
            
            // Calculate stats from the data
            const allResponse = await apiService.getAdminNotifications({ 
                page: 1, 
                limit: 100 
            });
            
            const allNotifications = allResponse.data.notifications || [];
            
            setStats({
                total: allNotifications.length,
                published: allNotifications.filter(n => n.status === 'published').length,
                events: allNotifications.filter(n => n.type === 'event').length,
                notifications: allNotifications.filter(n => n.type === 'notification').length,
                recentActivity: allNotifications.slice(0, 5)
            });
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const styles = {
        dashboard: {
            padding: '20px',
            fontFamily: 'Arial, sans-serif'
        },
        title: {
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
        },
        statCard: {
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        },
        statNumber: {
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '5px'
        },
        statLabel: {
            fontSize: '14px',
            color: '#6b7280',
            fontWeight: '500'
        },
        statIcon: {
            fontSize: '24px',
            marginBottom: '10px'
        },
        contentGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30px'
        },
        section: {
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        },
        sectionTitle: {
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        notificationItem: {
            padding: '15px 0',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
        },
        notificationContent: {
            flex: 1
        },
        notificationTitle: {
            fontSize: '14px',
            fontWeight: '500',
            color: '#1f2937',
            marginBottom: '5px'
        },
        notificationMeta: {
            fontSize: '12px',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        typeBadge: {
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '500'
        },
        eventBadge: {
            backgroundColor: '#dcfce7',
            color: '#166534'
        },
        notificationBadge: {
            backgroundColor: '#dbeafe',
            color: '#1d4ed8'
        },
        priorityIndicator: {
            color: '#f59e0b',
            fontSize: '16px'
        },
        loading: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            fontSize: '16px',
            color: '#6b7280'
        },
        emptyState: {
            textAlign: 'center',
            padding: '40px',
            color: '#6b7280'
        },
        quickActions: {
            display: 'flex',
            gap: '10px',
            marginBottom: '20px'
        },
        actionButton: {
            padding: '10px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none'
        }
    };

    if (loading) {
        return (
            <div style={styles.loading}>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
                Đang tải dashboard...
            </div>
        );
    }

    return (
        <div style={styles.dashboard}>
            <h1 style={styles.title}>
                <i className="fas fa-chart-bar" style={{ color: '#3b82f6' }}></i>
                Dashboard Thông báo & Sự kiện
            </h1>

            {/* Quick Actions */}
            <div style={styles.quickActions}>
                <a href="/notifications" style={styles.actionButton}>
                    <i className="fas fa-list"></i>
                    Quản lý thông báo
                </a>
                <button style={styles.actionButton} onClick={() => window.location.reload()}>
                    <i className="fas fa-sync-alt"></i>
                    Làm mới
                </button>
            </div>

            {/* Statistics Cards */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, color: '#3b82f6' }}>
                        <i className="fas fa-bullhorn"></i>
                    </div>
                    <div style={styles.statNumber}>{stats.total}</div>
                    <div style={styles.statLabel}>Tổng số thông báo</div>
                </div>

                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, color: '#10b981' }}>
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div style={styles.statNumber}>{stats.published}</div>
                    <div style={styles.statLabel}>Đã đăng</div>
                </div>

                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, color: '#f59e0b' }}>
                        <i className="fas fa-calendar-alt"></i>
                    </div>
                    <div style={styles.statNumber}>{stats.events}</div>
                    <div style={styles.statLabel}>Sự kiện</div>
                </div>

                <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, color: '#8b5cf6' }}>
                        <i className="fas fa-info-circle"></i>
                    </div>
                    <div style={styles.statNumber}>{stats.notifications}</div>
                    <div style={styles.statLabel}>Thông báo</div>
                </div>
            </div>

            {/* Content Sections */}
            <div style={styles.contentGrid}>
                {/* Recent Notifications */}
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>
                        <i className="fas fa-clock"></i>
                        Thông báo gần đây
                    </h2>
                    {recentNotifications.length === 0 ? (
                        <div style={styles.emptyState}>
                            <i className="fas fa-inbox" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
                            <p>Chưa có thông báo nào</p>
                        </div>
                    ) : (
                        recentNotifications.map((notification) => (
                            <div key={notification.id} style={styles.notificationItem}>
                                <div style={styles.notificationContent}>
                                    <div style={styles.notificationTitle}>
                                        {notification.is_priority && (
                                            <span style={styles.priorityIndicator}>⭐ </span>
                                        )}
                                        {notification.title}
                                    </div>
                                    <div style={styles.notificationMeta}>
                                        <span style={{
                                            ...styles.typeBadge,
                                            ...(notification.type === 'event' 
                                                ? styles.eventBadge 
                                                : styles.notificationBadge)
                                        }}>
                                            {notification.type === 'event' ? 'Sự kiện' : 'Thông báo'}
                                        </span>
                                        <span>{formatDate(notification.publish_date)}</span>
                                        <span>
                                            <i className="fas fa-eye"></i> {notification.view_count || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Activity Summary */}
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>
                        <i className="fas fa-activity"></i>
                        Hoạt động gần đây
                    </h2>
                    {stats.recentActivity.length === 0 ? (
                        <div style={styles.emptyState}>
                            <i className="fas fa-chart-line" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
                            <p>Chưa có hoạt động nào</p>
                        </div>
                    ) : (
                        stats.recentActivity.map((item) => (
                            <div key={item.id} style={styles.notificationItem}>
                                <div style={styles.notificationContent}>
                                    <div style={styles.notificationTitle}>
                                        {item.status === 'published' ? 'Đã đăng' : 'Đã tạo'}: {item.title}
                                    </div>
                                    <div style={styles.notificationMeta}>
                                        <span>Bởi: {item.creator_name}</span>
                                        <span>{formatDate(item.created_at || item.publish_date)}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationDashboard;