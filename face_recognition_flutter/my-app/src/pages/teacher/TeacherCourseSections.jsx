import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import { AppLayout, Header } from '../../components/layout/AppLayout';

// Styles
const styles = {
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
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: '20px'
    },
    card: {
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
    },
    cardHover: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        borderColor: '#3b82f6'
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1a202c',
        marginBottom: '4px'
    },
    cardSubtitle: {
        fontSize: '14px',
        color: '#64748b'
    },
    cardBadge: {
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
    },
    badgeActive: {
        backgroundColor: '#dcfce7',
        color: '#166534'
    },
    badgeInactive: {
        backgroundColor: '#fee2e2',
        color: '#991b1b'
    },
    cardInfo: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '16px'
    },
    infoItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        color: '#64748b'
    },
    cardActions: {
        display: 'flex',
        gap: '8px',
        paddingTop: '16px',
        borderTop: '1px solid #f1f5f9'
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
    }
};

// Course Section Card Component
const CourseSectionCard = ({ courseSection, onClick, onManageGrades }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            style={{
                ...styles.card,
                ...(hovered ? styles.cardHover : {})
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
        >
            <div style={styles.cardHeader}>
                <div>
                    <div style={styles.cardTitle}>{courseSection.name}</div>
                    <div style={styles.cardSubtitle}>{courseSection.subject_name}</div>
                </div>
                <div style={{
                    ...styles.cardBadge,
                    ...(courseSection.is_active ? styles.badgeActive : styles.badgeInactive)
                }}>
                    {courseSection.is_active ? 'Đang diễn ra' : 'Đã kết thúc'}
                </div>
            </div>

            <div style={styles.cardInfo}>
                <div style={styles.infoItem}>
                    <i className="fas fa-users"></i>
                    <span>Lớp: {courseSection.class_name}</span>
                </div>
                <div style={styles.infoItem}>
                    <i className="fas fa-user-tie"></i>
                    <span>GV: {courseSection.teacher_name}</span>
                </div>
                <div style={styles.infoItem}>
                    <i className="fas fa-calendar"></i>
                    <span>{courseSection.semester}</span>
                </div>
                <div style={styles.infoItem}>
                    <i className="fas fa-graduation-cap"></i>
                    <span>{courseSection.academic_year}</span>
                </div>
            </div>

            {courseSection.description && (
                <div style={{
                    fontSize: '14px',
                    color: '#64748b',
                    marginBottom: '16px',
                    lineHeight: '1.5'
                }}>
                    {courseSection.description.length > 100 
                        ? courseSection.description.substring(0, 100) + '...'
                        : courseSection.description}
                </div>
            )}

            <div style={styles.cardActions}>
                <button
                    style={{ ...styles.button, ...styles.buttonPrimary }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onManageGrades(courseSection);
                    }}
                >
                    <i className="fas fa-table"></i>
                    Quản lý điểm
                </button>
                <button
                    style={{ ...styles.button, ...styles.buttonSecondary }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                    }}
                >
                    <i className="fas fa-eye"></i>
                    Chi tiết
                </button>
            </div>
        </div>
    );
};

// Main Component
const TeacherCourseSections = () => {
    const navigate = useNavigate();
    const { notifications, showNotification, removeNotification } = useNotification();

    const [loading, setLoading] = useState(true);
    const [courseSections, setCourseSections] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [error, setError] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        loadCourseSections();
        return () => clearInterval(timer);
    }, []);

    const loadCourseSections = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const userResponse = await ApiService.getProfile();
            setCurrentUser(userResponse.data);

            // Load course sections for this teacher
            const response = await ApiService.getCourseSectionsByTeacher(userResponse.data.id);
            if (response.success) {
                setCourseSections(response.data.courseSections || []);
            } else {
                throw new Error('Failed to load course sections');
            }
        } catch (error) {
            console.error('Error loading course sections:', error);
            setError('Không thể tải danh sách học phần');
            showNotification('Lỗi khi tải danh sách học phần', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewCourseSection = (courseSection) => {
        navigate(`/teacher/course-sections/${courseSection.id}`);
    };

    const handleManageGrades = (courseSection) => {
        navigate(`/teacher/course-sections/${courseSection.id}`);
    };

    return (
        <AppLayout
            user={currentUser}
            onLogout={() => {
                authService.logout();
                navigate('/login');
            }}
            currentTime={currentTime}
            title="Quản lý học phần"
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
                title="Quản lý học phần"
                titleIcon="fas fa-chalkboard-teacher"
                actions={[
                    {
                        label: 'Làm mới',
                        icon: 'fas fa-sync-alt',
                        onClick: loadCourseSections
                    }
                ]}
            />

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#64748b' }}></i>
                    <div style={{ marginTop: '16px', color: '#64748b' }}>Đang tải danh sách học phần...</div>
                </div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', color: '#ef4444', marginBottom: '16px' }}></i>
                    <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>Có lỗi xảy ra</div>
                    <div style={{ color: '#64748b', marginBottom: '20px' }}>{error}</div>
                    <button
                        style={{ ...styles.button, ...styles.buttonPrimary }}
                        onClick={loadCourseSections}
                    >
                        <i className="fas fa-sync-alt"></i>
                        Thử lại
                    </button>
                </div>
            ) : (
                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>
                            <i className="fas fa-list"></i>
                            Danh sách học phần ({courseSections.length})
                        </h2>
                    </div>

                    {courseSections.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyStateIcon}>
                                <i className="fas fa-chalkboard-teacher"></i>
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                                Chưa có học phần nào
                            </div>
                            <div style={{ fontSize: '14px' }}>
                                Bạn chưa được phân công giảng dạy học phần nào
                            </div>
                        </div>
                    ) : (
                        <div style={styles.grid}>
                            {courseSections.map(courseSection => (
                                <CourseSectionCard
                                    key={courseSection.id}
                                    courseSection={courseSection}
                                    onClick={() => handleViewCourseSection(courseSection)}
                                    onManageGrades={() => handleManageGrades(courseSection)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </AppLayout>
    );
};

export default TeacherCourseSections;