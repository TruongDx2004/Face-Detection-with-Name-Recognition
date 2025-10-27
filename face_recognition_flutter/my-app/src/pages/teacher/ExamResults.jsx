import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import { AppLayout, Header } from '../../components/layout/AppLayout';

const styles = {
    section: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
    },
    statCard: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
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
    },
    resultsTable: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: '#ffffff'
    },
    tableHeader: {
        backgroundColor: '#f8fafc',
        padding: '12px',
        textAlign: 'left',
        fontWeight: '600',
        color: '#374151',
        border: '1px solid #e2e8f0'
    },
    tableCell: {
        padding: '12px',
        border: '1px solid #e2e8f0',
        color: '#4b5563'
    },
    tableRow: {
        transition: 'background-color 0.2s ease'
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
    statusBadge: {
        fontSize: '12px',
        padding: '4px 8px',
        borderRadius: '6px',
        fontWeight: '500'
    },
    statusCompleted: {
        backgroundColor: '#dcfce7',
        color: '#166534'
    },
    statusInProgress: {
        backgroundColor: '#fef3c7',
        color: '#92400e'
    },
    statusNotStarted: {
        backgroundColor: '#f3f4f6',
        color: '#374151'
    },
    scoreGood: {
        color: '#059669',
        fontWeight: '600'
    },
    scoreAverage: {
        color: '#d97706',
        fontWeight: '600'
    },
    scorePoor: {
        color: '#dc2626',
        fontWeight: '600'
    },
    filterSection: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap'
    },
    formSelect: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        backgroundColor: '#ffffff'
    },
    searchInput: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        width: '250px'
    }
};

const ExamResults = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { notifications, showNotification, removeNotification } = useNotification();

    const [exam, setExam] = useState(null);
    const [results, setResults] = useState([]);
    const [statistics, setStatistics] = useState({});
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [filters, setFilters] = useState({
        status: '',
        search: ''
    });

    useEffect(() => {
        fetchExamData();
        fetchResults();
        fetchStatistics();
    }, [examId]);

    useEffect(() => {
        const init = async () => {
            try {
                const user = await ApiService.getProfile();
                setCurrentUser(user.data);
            } catch (error) {
                console.error("Error fetching profile:", error);
                showNotification("Không thể tải thông tin người dùng", "error");
            }
        };

        init();

        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);


    const fetchExamData = async () => {
        try {
            const response = await ApiService.getExam(examId);
            setExam(response.data);
        } catch (error) {
            console.error('Error fetching exam:', error);
            showNotification('Không thể tải thông tin bài kiểm tra', 'error');
        }
    };

    const fetchResults = async () => {
        try {
            const response = await ApiService.getExamResults(examId);
            console.log('Fetched results:', response.data);
            setResults(response.data || []);
        } catch (error) {
            console.error('Error fetching results:', error);
            showNotification('Không thể tải kết quả thi', 'error');
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await ApiService.getExamStatistics(examId);
            setStatistics(response.data || {});
        } catch (error) {
            console.error('Error fetching statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed':
            case 'graded':
                return styles.statusCompleted;
            case 'in_progress':
                return styles.statusInProgress;
            default:
                return styles.statusNotStarted;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed':
                return 'Hoàn thành';
            case 'graded':
                return 'Đã chấm';
            case 'in_progress':
                return 'Đang làm';
            default:
                return 'Chưa bắt đầu';
        }
    };

    const getScoreStyle = (score, maxScore) => {
        const percentage = (score / maxScore) * 100;
        if (percentage >= 80) return styles.scoreGood;
        if (percentage >= 60) return styles.scoreAverage;
        return styles.scorePoor;
    };

    const formatDuration = (startTime, endTime) => {
        if (!startTime || !endTime) return '-';

        // Parse chuỗi thành Date
        const start = new Date(startTime.replace(' ', 'T'));
        const end = new Date(endTime.replace(' ', 'T'));

        // Tính chênh lệch theo mili giây
        const diffMs = end - start;

        // Nếu muốn hiển thị theo giây
        const diffSeconds = Math.round(diffMs / 1000);

        // Nếu muốn hiển thị theo phút
        const diffMinutes = Math.round(diffMs / (1000 * 60));

        // Chọn hiển thị theo giây hoặc phút tùy nhu cầu
        if (diffSeconds < 60) {
            return `${diffSeconds} giây`;
        } else {
            return `${diffMinutes} phút`;
        }
    };

    const filteredResults = results.filter(result => {
        if (filters.status && result.status !== filters.status) return false;
        if (filters.search && !result.student_name.toLowerCase().includes(filters.search.toLowerCase()) &&
            !result.student_email.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
    });

    const handleLogout = () => {
        authService.logout();
        navigate('/');
    };

    const handleViewDetails = (resultId) => {
        navigate(`/teacher/exams/${examId}/results/${resultId}`);
    };

    const handleGradeManually = (resultId) => {
        navigate(`/teacher/exams/${examId}/grade/${resultId}`);
    };

    const exportResults = () => {
        // Export functionality would be implemented here
        showNotification('Tính năng xuất file đang được phát triển', 'info');
    };

    if (loading) {
        return (
            <AppLayout>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                    <div>Đang tải...</div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            user={currentUser}
            onLogout={handleLogout}
            currentTime={currentTime}
            title="Kết quả kiểm tra"
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

            {/* Statistics */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>{statistics.total_students || 0}</div>
                    <div style={styles.statLabel}>Tổng số học sinh</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>{statistics.completed_count || 0}</div>
                    <div style={styles.statLabel}>Đã hoàn thành</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>{statistics.in_progress_count || 0}</div>
                    <div style={styles.statLabel}>Đang làm bài</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>
                        {statistics.avg_score ? Number(statistics.avg_score).toFixed(1) : '0'}
                    </div>
                    <div style={styles.statLabel}>Điểm trung bình</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>{statistics.max_score || 0}</div>
                    <div style={styles.statLabel}>Điểm cao nhất</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>{statistics.min_score || 0}</div>
                    <div style={styles.statLabel}>Điểm thấp nhất</div>
                </div>
            </div>

            {/* Results Table */}
            <div style={styles.section}>
                <div style={styles.filterSection}>
                    <select
                        style={styles.formSelect}
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="graded">Đã chấm</option>
                        <option value="in_progress">Đang làm</option>
                        <option value="not_started">Chưa bắt đầu</option>
                    </select>

                    <input
                        type="text"
                        style={styles.searchInput}
                        placeholder="Tìm kiếm học sinh..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />

                    <button
                        style={{ ...styles.button, ...styles.buttonSecondary }}
                        onClick={exportResults}
                    >
                        📊 Xuất Excel
                    </button>

                    <button
                        style={{ ...styles.button, ...styles.buttonSecondary }}
                        onClick={() => navigate('/teacher/exams')}
                    >
                        ← Quay lại
                    </button>
                </div>

                <table style={styles.resultsTable}>
                    <thead>
                        <tr>
                            <th style={styles.tableHeader}>Học sinh</th>
                            <th style={styles.tableHeader}>Email</th>
                            <th style={styles.tableHeader}>Trạng thái</th>
                            <th style={styles.tableHeader}>Điểm</th>
                            <th style={styles.tableHeader}>Thời gian làm</th>
                            <th style={styles.tableHeader}>Nộp bài</th>
                            <th style={styles.tableHeader}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredResults.map((result) => (
                            <tr
                                key={result.id}
                                style={styles.tableRow}
                                onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = '#f8fafc'}
                                onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}
                            >
                                <td style={styles.tableCell}>{result.student_name}</td>
                                <td style={styles.tableCell}>{result.student_email}</td>
                                <td style={styles.tableCell}>
                                    <span style={{
                                        ...styles.statusBadge,
                                        ...getStatusStyle(result.status)
                                    }}>
                                        {getStatusLabel(result.status)}
                                    </span>
                                </td>
                                <td style={{
                                    ...styles.tableCell,
                                    ...getScoreStyle(result.score || 0, exam?.max_score || 10)
                                }}>
                                    {result.score ? `${result.score}/${exam?.max_score}` : '-'}
                                </td>
                                <td style={styles.tableCell}>
                                    {formatDuration(result.start_time, result.submitted_at)}
                                </td>
                                <td style={styles.tableCell}>
                                    {result.submitted_at ?
                                        new Date(result.submitted_at).toLocaleString('vi-VN') : '-'
                                    }
                                </td>
                                <td style={styles.tableCell}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            style={{ ...styles.button, ...styles.buttonPrimary }}
                                            onClick={() => handleViewDetails(result.id)}
                                        >
                                            👁️ Xem
                                        </button>
                                        {(result.status === 'completed' || result.status === 'graded') && (
                                            <button
                                                style={{ ...styles.button, ...styles.buttonSecondary }}
                                                onClick={() => handleGradeManually(result.id)}
                                            >
                                                ✏️ Chấm
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredResults.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        Không có kết quả nào
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default ExamResults;