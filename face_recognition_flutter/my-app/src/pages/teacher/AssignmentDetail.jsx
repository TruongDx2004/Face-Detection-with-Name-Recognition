import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
    },
    infoCard: {
        backgroundColor: '#f8fafc',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
    },
    infoLabel: {
        fontSize: '12px',
        fontWeight: '500',
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: '4px'
    },
    infoValue: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1a202c'
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
    buttonDanger: {
        backgroundColor: '#ef4444',
        color: '#ffffff'
    },
    buttonSuccess: {
        backgroundColor: '#10b981',
        color: '#ffffff'
    },
    submissionGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '16px'
    },
    submissionCard: {
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        transition: 'all 0.2s ease'
    },
    submissionCardHover: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    },
    submissionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px'
    },
    studentName: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1a202c'
    },
    submissionStatus: {
        fontSize: '12px',
        padding: '4px 8px',
        borderRadius: '4px',
        fontWeight: '500'
    },
    statusSubmitted: {
        backgroundColor: '#10b981',
        color: '#ffffff'
    },
    statusGraded: {
        backgroundColor: '#3b82f6',
        color: '#ffffff'
    },
    statusPending: {
        backgroundColor: '#f59e0b',
        color: '#ffffff'
    },
    submissionDetails: {
        fontSize: '14px',
        color: '#64748b',
        marginBottom: '12px'
    },
    submissionActions: {
        display: 'flex',
        gap: '8px'
    },
    modal: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto'
    },
    modalHeader: {
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    formGroup: {
        marginBottom: '16px'
    },
    formLabel: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '6px'
    },
    formInput: {
        width: '100%',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px'
    },
    formTextarea: {
        width: '100%',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        minHeight: '80px',
        resize: 'vertical'
    },
    loadingSpinner: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        fontSize: '18px',
        color: '#64748b'
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
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
    },
    statCard: {
        backgroundColor: '#f8fafc',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        textAlign: 'center'
    },
    statNumber: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1a202c',
        marginBottom: '4px'
    },
    statLabel: {
        fontSize: '14px',
        color: '#64748b'
    }
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

// Submission Card Component
const SubmissionCard = ({ submission, onGrade, onViewDetails }) => {
    const [hovered, setHovered] = useState(false);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'graded':
                return styles.statusGraded;
            case 'submitted':
                return styles.statusSubmitted;
            default:
                return styles.statusPending;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'graded':
                return 'Đã chấm';
            case 'submitted':
                return 'Đã nộp';
            default:
                return 'Chưa nộp';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa nộp';
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
                ...styles.submissionCard,
                ...(hovered ? styles.submissionCardHover : {})
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div style={styles.submissionHeader}>
                <div>
                    <div style={styles.studentName}>
                        {submission.student_name || 'Sinh viên'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {submission.student_code || ''}
                    </div>
                </div>
                <div style={{
                    ...styles.submissionStatus,
                    ...getStatusStyle(submission.status)
                }}>
                    {getStatusText(submission.status)}
                </div>
            </div>

            <div style={styles.submissionDetails}>
                <div style={{ marginBottom: '4px' }}>
                    <i className="fas fa-clock" style={{ marginRight: '6px', color: '#64748b' }}></i>
                    Nộp lúc: {formatDate(submission.submitted_at)}
                </div>
                {submission.score !== null && (
                    <div style={{ marginBottom: '4px' }}>
                        <i className="fas fa-star" style={{ marginRight: '6px', color: '#f59e0b' }}></i>
                        Điểm: {submission.score}
                    </div>
                )}
                {submission.feedback && (
                    <div>
                        <i className="fas fa-comment" style={{ marginRight: '6px', color: '#64748b' }}></i>
                        Có nhận xét
                    </div>
                )}
            </div>

            <div style={styles.submissionActions}>
                <button
                    style={{ ...styles.button, ...styles.buttonPrimary }}
                    onClick={() => onViewDetails(submission)}
                >
                    <i className="fas fa-eye"></i>
                    Chi tiết
                </button>
                {submission.status === 'submitted' && (
                    <button
                        style={{ ...styles.button, ...styles.buttonSuccess }}
                        onClick={() => onGrade(submission)}
                    >
                        <i className="fas fa-edit"></i>
                        Chấm điểm
                    </button>
                )}
            </div>
        </div>
    );
};

// Grade Modal Component
const GradeModal = ({ isOpen, onClose, submission, onSubmit, loading }) => {
    const [gradeData, setGradeData] = useState({
        score: '',
        feedback: ''
    });

    useEffect(() => {
        if (submission) {
            setGradeData({
                score: submission.score || '',
                feedback: submission.feedback || ''
            });
        }
    }, [submission]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(gradeData);
    };

    if (!isOpen) return null;

    return (
        <div style={styles.modal}>
            <div style={styles.modalContent}>
                <div style={styles.modalHeader}>
                    <i className="fas fa-edit"></i>
                    Chấm điểm bài tập
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Sinh viên</label>
                        <div style={{ fontSize: '16px', fontWeight: '500', padding: '8px 0' }}>
                            {submission?.student_name} ({submission?.student_code})
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Điểm *</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            style={styles.formInput}
                            value={gradeData.score}
                            onChange={(e) => setGradeData(prev => ({ ...prev, score: e.target.value }))}
                            required
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Nhận xét</label>
                        <textarea
                            style={styles.formTextarea}
                            value={gradeData.feedback}
                            onChange={(e) => setGradeData(prev => ({ ...prev, feedback: e.target.value }))}
                            placeholder="Nhập nhận xét cho sinh viên..."
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            style={{ ...styles.button, ...styles.buttonSecondary }}
                            onClick={onClose}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            style={{ ...styles.button, ...styles.buttonPrimary }}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i>
                                    Lưu điểm
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Delete Confirmation Modal
const DeleteModal = ({ isOpen, onClose, onConfirm, loading }) => {
    if (!isOpen) return null;

    return (
        <div style={styles.modal}>
            <div style={styles.modalContent}>
                <div style={styles.modalHeader}>
                    <i className="fas fa-exclamation-triangle" style={{ color: '#ef4444' }}></i>
                    Xác nhận xóa
                </div>

                <div style={{ marginBottom: '20px', fontSize: '14px', color: '#374151' }}>
                    Bạn có chắc chắn muốn xóa bài tập này? Hành động này không thể hoàn tác.
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        style={{ ...styles.button, ...styles.buttonSecondary }}
                        onClick={onClose}
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        style={{ ...styles.button, ...styles.buttonDanger }}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Đang xóa...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-trash"></i>
                                Xóa bài tập
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Component
const AssignmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { notifications, showNotification, removeNotification } = useNotification();

    const [loading, setLoading] = useState(true);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [stats, setStats] = useState({
        totalStudents: 0,
        submittedCount: 0,
        gradedCount: 0,
        avgScore: 0
    });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentUser, setCurrentUser] = useState(null);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [grading, setGrading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        loadData();
        return () => clearInterval(timer);
    }, []);

    const loadData = async () => {
        try {
            const user = await ApiService.getProfile();
            setCurrentUser(user.data);
            await Promise.all([fetchAssignment(), fetchSubmissions()]);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const fetchAssignment = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await ApiService.getAssignment(id);
            if (response.success) {
                setAssignment(response.data);
            } else {
                throw new Error('Assignment not found');
            }
        } catch (error) {
            console.error('Error fetching assignment:', error);
            setError(error.message || 'Không thể tải thông tin bài tập');
            showNotification('Lỗi khi tải thông tin bài tập', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubmissions = async () => {
        try {
            setSubmissionsLoading(true);
            const response = await ApiService.getAssignmentSubmissions(id);
            console.log(response);
            if (response.success) {
                const submissionData = response.data || [];
                setSubmissions(submissionData);
                calculateStats(submissionData);
            }
        } catch (error) {
            console.error('Error fetching submissions:', error);
            showNotification('Lỗi khi tải danh sách bài nộp', 'error');
        } finally {
            setSubmissionsLoading(false);
        }
    };

    const calculateStats = (submissionData) => {
        const totalStudents = submissionData.length;
        const submittedCount = submissionData.filter(s => s.status === 'submitted' || s.status === 'graded').length;
        const gradedCount = submissionData.filter(s => s.status === 'graded').length;
        const scores = submissionData.filter(s => s.score !== null).map(s => parseFloat(s.score));
        const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;

        setStats({
            totalStudents,
            submittedCount,
            gradedCount,
            avgScore
        });
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleDeleteAssignment = async () => {
        try {
            setDeleting(true);
            const response = await ApiService.deleteAssignment(id);
            
            if (response.success) {
                showNotification('Xóa bài tập thành công', 'success');
                navigate('/teacher/assignments');
            } else {
                throw new Error('Failed to delete assignment');
            }
        } catch (error) {
            console.error('Error deleting assignment:', error);
            showNotification('Lỗi khi xóa bài tập', 'error');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleGradeSubmission = async (gradeData) => {
        try {
            setGrading(true);
            const response = await ApiService.gradeSubmission(selectedSubmission.id, {
                score: parseFloat(gradeData.score),
                feedback: gradeData.feedback
            });
            
            if (response.success) {
                showNotification('Chấm điểm thành công', 'success');
                await fetchSubmissions();
                setShowGradeModal(false);
                setSelectedSubmission(null);
            } else {
                throw new Error('Failed to grade submission');
            }
        } catch (error) {
            console.error('Error grading submission:', error);
            showNotification('Lỗi khi chấm điểm', 'error');
        } finally {
            setGrading(false);
        }
    };

    const handleViewSubmissionDetails = (submission) => {
        // TODO: Implement submission details view
        console.log('View submission details:', submission);
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

    const breadcrumb = [
        { label: 'Trang chủ', path: '/teacher' },
        { label: 'Bài tập', path: '/teacher/assignments' },
        { label: assignment?.title || 'Chi tiết bài tập', path: '' }
    ];

    if (loading) {
        return (
            <AppLayout
                user={currentUser}
                onLogout={handleLogout}
                currentTime={currentTime}
                title="Chi tiết bài tập"
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
                title="Chi tiết bài tập"
            >
                <ErrorMessage message={error} onRetry={loadData} />
            </AppLayout>
        );
    }

    if (!assignment) {
        return (
            <AppLayout
                user={currentUser}
                onLogout={handleLogout}
                currentTime={currentTime}
                title="Chi tiết bài tập"
            >
                <ErrorMessage message="Không tìm thấy bài tập" onRetry={loadData} />
            </AppLayout>
        );
    }

    return (
        <AppLayout
            user={currentUser}
            onLogout={handleLogout}
            currentTime={currentTime}
            title="Chi tiết bài tập"
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
                title={assignment.title}
                titleIcon="fas fa-tasks"
                showBack={true}
                onBack={() => navigate('/teacher/assignments')}
                breadcrumb={breadcrumb}
                actions={[
                    {
                        label: 'Chỉnh sửa',
                        icon: 'fas fa-edit',
                        onClick: () => navigate(`/teacher/assignments/${id}/edit`)
                    },
                    {
                        label: 'Xóa bài tập',
                        icon: 'fas fa-trash',
                        onClick: () => setShowDeleteModal(true),
                        variant: 'danger'
                    }
                ]}
            />

            {/* Assignment Information */}
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>
                        <i className="fas fa-info-circle"></i>
                        Thông tin bài tập
                    </h2>
                </div>

                <div style={styles.infoGrid}>
                    <div style={styles.infoCard}>
                        <div style={styles.infoLabel}>Lớp học phần</div>
                        <div style={styles.infoValue}>
                            {assignment.course_name} - {assignment.subject_name}
                        </div>
                    </div>
                    <div style={styles.infoCard}>
                        <div style={styles.infoLabel}>Loại bài tập</div>
                        <div style={styles.infoValue}>
                            {assignment.assignment_type === 'homework' && 'Bài tập về nhà'}
                            {assignment.assignment_type === 'project' && 'Dự án'}
                            {assignment.assignment_type === 'lab' && 'Thí nghiệm'}
                            {assignment.assignment_type === 'essay' && 'Tiểu luận'}
                        </div>
                    </div>
                    <div style={styles.infoCard}>
                        <div style={styles.infoLabel}>Điểm tối đa</div>
                        <div style={styles.infoValue}>{assignment.max_score}</div>
                    </div>
                    <div style={styles.infoCard}>
                        <div style={styles.infoLabel}>Hạn nộp</div>
                        <div style={styles.infoValue}>{formatDate(assignment.due_date)}</div>
                    </div>
                </div>

                {assignment.description && (
                    <div style={{ marginBottom: '16px' }}>
                        <div style={styles.infoLabel}>Mô tả</div>
                        <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                            {assignment.description}
                        </div>
                    </div>
                )}

                {assignment.instructions && (
                    <div style={{ marginBottom: '16px' }}>
                        <div style={styles.infoLabel}>Hướng dẫn</div>
                        <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                            {assignment.instructions}
                        </div>
                    </div>
                )}

                {assignment.attachment_path && (
                    <div>
                        <div style={styles.infoLabel}>Tệp đính kèm</div>
                        <button
                            style={{ ...styles.button, ...styles.buttonSecondary }}
                            onClick={() => window.open(assignment.attachment_path, '_blank')}
                        >
                            <i className="fas fa-download"></i>
                            Tải xuống
                        </button>
                    </div>
                )}
            </div>

            {/* Statistics */}
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>
                        <i className="fas fa-chart-bar"></i>
                        Thống kê
                    </h2>
                </div>

                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <div style={styles.statNumber}>{stats.totalStudents}</div>
                        <div style={styles.statLabel}>Tổng sinh viên</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statNumber}>{stats.submittedCount}</div>
                        <div style={styles.statLabel}>Đã nộp bài</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statNumber}>{stats.gradedCount}</div>
                        <div style={styles.statLabel}>Đã chấm điểm</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statNumber}>{stats.avgScore}</div>
                        <div style={styles.statLabel}>Điểm trung bình</div>
                    </div>
                </div>
            </div>

            {/* Submissions */}
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>
                        <i className="fas fa-file-alt"></i>
                        Bài nộp ({submissions.length})
                    </h2>
                    <button
                        style={{ ...styles.button, ...styles.buttonPrimary }}
                        onClick={fetchSubmissions}
                        disabled={submissionsLoading}
                    >
                        {submissionsLoading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Đang tải...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-sync-alt"></i>
                                Làm mới
                            </>
                        )}
                    </button>
                </div>

                {submissionsLoading ? (
                    <LoadingSpinner />
                ) : submissions.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyStateIcon}>
                            <i className="fas fa-file-alt"></i>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                            Chưa có bài nộp nào
                        </div>
                        <div style={{ fontSize: '14px' }}>
                            Sinh viên chưa nộp bài tập này
                        </div>
                    </div>
                ) : (
                    <div style={styles.submissionGrid}>
                        {submissions.map(submission => (
                            <SubmissionCard
                                key={submission.id}
                                submission={submission}
                                onGrade={(submission) => {
                                    setSelectedSubmission(submission);
                                    setShowGradeModal(true);
                                }}
                                onViewDetails={handleViewSubmissionDetails}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Grade Modal */}
            <GradeModal
                isOpen={showGradeModal}
                onClose={() => {
                    setShowGradeModal(false);
                    setSelectedSubmission(null);
                }}
                submission={selectedSubmission}
                onSubmit={handleGradeSubmission}
                loading={grading}
            />

            {/* Delete Modal */}
            <DeleteModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteAssignment}
                loading={deleting}
            />
        </AppLayout>
    );
};

export default AssignmentDetail;