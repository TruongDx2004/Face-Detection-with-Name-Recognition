import React, { useState, useEffect } from 'react';
import Notification from '../components/Notification';
import Sidebar from '../components/Sidebar';
import LoadingOverlay from '../components/LoadingOverlay';
import Header from '../components/Header';
import useNotification from '../hooks/useNotification';
import useTime from '../hooks/useTime';
import styles from '../components/styles';
import { useNavigate } from 'react-router-dom';
import api from '../services/api-service';  

// Add keyframes for spinner animation
const spinnerKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

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
        <div style={{...styles.statIcon, background: color}}>
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

// Quick Action Card Component
const QuickActionCard = ({ icon, title, description, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardStyle = {
    ...styles.quickActionCard,
    ...(isHovered ? styles.quickActionCardHover : {})
  };

  return (
    <div 
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.actionIcon}>
        <i className={icon}></i>
      </div>
      <div style={styles.actionContent}>
        <h3 style={styles.actionTitle}>{title}</h3>
        <p style={styles.actionDescription}>{description}</p>
      </div>
    </div>
  );
};

// Management Card Component
const ManagementCard = ({ title, description, icon, color, stats, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardStyle = {
    ...styles.managementCard,
    ...(isHovered ? styles.managementCardHover : {})
  };

  return (
    <div 
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.cardHeader}>
        <div style={{...styles.cardIcon, background: color}}>
          <i className={icon}></i>
        </div>
        <div>
          <h3 style={styles.cardTitle}>{title}</h3>
          <p style={styles.cardDescription}>{description}</p>
        </div>
      </div>
      <div style={styles.cardStats}>
        {Object.entries(stats).map(([key, value], index) => (
          <div 
            key={key}
            style={{
              ...styles.statRow,
              ...(index === 0 ? styles.statRowFirst : {})
            }}
          >
            <span style={styles.statRowLabel}>{key}</span>
            <span style={styles.statRowValue}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Activity Item Component
const ActivityItem = ({ activity, isLast }) => {
  const [isHovered, setIsHovered] = useState(false);

  const itemStyle = {
    ...styles.activityItem,
    ...(isLast ? styles.activityItemLast : {}),
    ...(isHovered ? styles.activityItemHover : {})
  };

  return (
    <div 
      style={itemStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{...styles.activityIcon, background: activity.color}}>
        <i className={activity.icon}></i>
      </div>
      <div style={styles.activityContent}>
        <div style={styles.activityTitle}>{activity.title}</div>
        <div style={styles.activityDescription}>{activity.description}</div>
      </div>
      <div style={styles.activityTime}>{activity.time}</div>
    </div>
  );
};

// Main Dashboard Component
const AdminDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [activities, setActivities] = useState([]);
  
  const currentTime = useTime();
  const navigate = useNavigate();
  const { notifications, showNotification, removeNotification } = useNotification();

  // Load dashboard data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [statsRes, activeSessionsRes, classesRes] = await Promise.all([
          api.getStatistics(),                         // /admin/statistics
          api.getSessions({ is_active: true }),        // /attendance/sessions?is_active=true
          api.getClasses()                              // /classes (paginated, default limit)
        ]);

        const stats = statsRes.data || {};
        const userStats = stats.user_statistics || [];
        const attendanceStats = stats.attendance_statistics || [];
        const faceTrain = stats.face_training_statistics || { total_students: 0, trained_students: 0 };

        const totalUsers = userStats.reduce((sum, r) => sum + (r.count || 0), 0);
        const totalStudents = (userStats.find(r => r.role === 'student')?.count) || 0;
        const totalTeachers = (userStats.find(r => r.role === 'teacher')?.count) || 0;

        const totalSessions = attendanceStats.reduce((sum, d) => sum + (d.total_sessions || 0), 0);
        const totalAttendances = attendanceStats.reduce((sum, d) => sum + (d.total_attendances || 0), 0);

        const activeSessions = (activeSessionsRes.data?.sessions || []).length;

        const totalClasses = (classesRes.data?.classes || []).length;

        const modelAccuracy = faceTrain.total_students > 0
          ? Number(((faceTrain.trained_students / faceTrain.total_students) * 100).toFixed(1))
          : 0;

        setStatistics({
          total_users: totalUsers,
          total_students: totalStudents,
          total_teachers: totalTeachers,
          total_classes: totalClasses,
          total_sessions: totalSessions,
          total_attendances: totalAttendances,
          active_sessions: activeSessions,
          model_accuracy: modelAccuracy
        });

        // Optional: populate activities later from your own endpoints
        setActivities(prev => prev.length ? prev : []);
      } catch (err) {
        showNotification(`Tải dữ liệu dashboard thất bại: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickAction = async (action) => {
    switch (action) {
      case 'new-session':
        showNotification('Chuyển đến trang tạo phiên điểm danh mới', 'info');
        break;
      case 'add-user':
        showNotification('Chuyển đến trang thêm người dùng', 'info');
        break;
      case 'train-model':
        showNotification('Bắt đầu huấn luyện mô hình AI...', 'info');
        await new Promise(resolve => setTimeout(resolve, 3000));
        showNotification('Huấn luyện mô hình thành công! Độ chính xác: 98.7%', 'success');
        setStatistics(prev => prev ? {...prev, model_accuracy: 98.7} : null);
        break;
      case 'export-report':
        showNotification('Đang chuẩn bị báo cáo...', 'info');
        setTimeout(() => showNotification('Báo cáo đã được tải xuống', 'success'), 2000);
        break;
      default:
        showNotification('Tính năng đang được phát triển', 'warning');
    }
  };

    const statsConfig = statistics ? [
    { title: 'Tổng người dùng', value: statistics.total_users, icon: 'fas fa-users', color: '#3b82f6', change: '+5.2%' },
    { title: 'Sinh viên', value: statistics.total_students, icon: 'fas fa-user-graduate', color: '#10b981', change: '+2.1%' },
    { title: 'Giáo viên', value: statistics.total_teachers, icon: 'fas fa-chalkboard-teacher', color: '#f59e0b', change: '+1' },
    { title: 'Lớp học', value: statistics.total_classes, icon: 'fas fa-school', color: '#ef4444', change: '+2' },
    { title: 'Phiên điểm danh', value: statistics.total_sessions, icon: 'fas fa-calendar-check', color: '#8b5cf6', change: '+12.8%' },
    { title: 'Lượt điểm danh', value: statistics.total_attendances, icon: 'fas fa-check-circle', color: '#06b6d4', change: '+8.4%' },
  ] : [];

  const quickActions = [
    { icon: 'fas fa-plus-circle', title: 'Tạo phiên điểm danh', description: 'Khởi tạo phiên điểm danh mới', action: 'new-session' },
    { icon: 'fas fa-user-plus', title: 'Thêm người dùng', description: 'Đăng ký người dùng mới', action: 'add-user' },
    { icon: 'fas fa-brain', title: 'Huấn luyện AI', description: 'Cập nhật mô hình nhận diện', action: 'train-model' },
    { icon: 'fas fa-download', title: 'Xuất báo cáo', description: 'Tải báo cáo điểm danh', action: 'export-report' },
  ];

  const managementCards = statistics ? [
    {
      title: 'Quản lý người dùng',
      description: 'Thêm, sửa, xóa người dùng và phân quyền hệ thống',
      icon: 'fas fa-users',
      color: '#3b82f6',
      stats: { 'Tổng người dùng': statistics.total_users, 'Hoạt động': '45', 'Chờ duyệt': '3' }
    },
    {
      title: 'Quản lý lớp học',
      description: 'Tạo lớp học mới và quản lý danh sách sinh viên',
      icon: 'fas fa-school',
      color: '#10b981',
      stats: { 'Tổng lớp học': statistics.total_classes, 'Sinh viên': statistics.total_students, 'Đang học': '12' }
    },
    {
      title: 'Phiên điểm danh',
      description: 'Theo dõi và quản lý tất cả các phiên điểm danh',
      icon: 'fas fa-calendar-check',
      color: '#f59e0b',
      stats: { 'Tổng phiên': statistics.total_sessions, 'Đang diễn ra': statistics.active_sessions, 'Hôm nay': '8' }
    },
    {
      title: 'Môn học & Lịch học',
      description: 'Quản lý môn học và lập thời khóa biểu',
      icon: 'fas fa-book',
      color: '#8b5cf6',
      stats: { 'Môn học': '25', 'Lịch học': '150', 'Tuần này': '35' }
    },
    {
      title: 'Nhận diện khuôn mặt',
      description: 'Quản lý và huấn luyện mô hình AI nhận diện',
      icon: 'fas fa-face-smile',
      color: '#ef4444',
      stats: { 'Mẫu huấn luyện': '2.5K', 'Độ chính xác': `${statistics.model_accuracy}%`, 'Cập nhật': '2 giờ trước' }
    },
    {
      title: 'Báo cáo & Thống kê',
      description: 'Xem báo cáo chi tiết và phân tích dữ liệu',
      icon: 'fas fa-chart-bar',
      color: '#06b6d4',
      stats: { 'Báo cáo': '50', 'Xuất tháng này': '12', 'Tự động': '8' }
    }
  ] : [];

  const mainContentStyle = {
    ...styles.mainContent,
    ...(sidebarCollapsed ? styles.mainContentCollapsed : {})
  };

  return (
    <>
      {/* Add spinner keyframes to head */}
      <style>{spinnerKeyframes}</style>
      
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
        />

        {/* Main Content */}
        <main style={mainContentStyle}>
          <Header currentTime={currentTime} />
          
          <div style={styles.dashboardContent}>
            <LoadingOverlay isLoading={loading} />
            
            {/* Statistics */}
            <section style={{ marginBottom: '3rem' }}>
              <div style={styles.statsGrid}>
                {statsConfig.map((stat, index) => (
                  <StatsCard key={index} {...stat} />
                ))}
              </div>
            </section>

            {/* Quick Actions */}
            <section style={{ marginBottom: '3rem' }}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  <i className="fas fa-bolt" style={styles.sectionIcon}></i>
                  Thao tác nhanh
                </h2>
              </div>
              <div style={styles.quickActionsGrid}>
                {quickActions.map((action, index) => (
                  <QuickActionCard 
                    key={index} 
                    {...action} 
                    onClick={() => handleQuickAction(action.action)}
                  />
                ))}
              </div>
            </section>

            {/* Management Cards */}
            <section style={{ marginBottom: '3rem' }}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  <i className="fas fa-cogs" style={styles.sectionIcon}></i>
                  Quản lý hệ thống
                </h2>
              </div>
              <div style={styles.managementGrid}>
                {managementCards.map((card, index) => (
                  <ManagementCard 
                    key={index} 
                    {...card} 
                    onClick={() => showNotification(`Chuyển đến ${card.title}`, 'info')}
                  />
                ))}
              </div>
            </section>

            {/* Recent Activities */}
            <section style={{ marginBottom: '3rem' }}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  <i className="fas fa-history" style={styles.sectionIcon}></i>
                  Hoạt động gần đây
                </h2>
                <button 
                  style={styles.viewAllBtn}
                  onMouseEnter={(e) => Object.assign(e.target.style, styles.viewAllBtnHover)}
                  onMouseLeave={(e) => Object.assign(e.target.style, styles.viewAllBtn)}
                >
                  Xem tất cả
                </button>
              </div>
              <div style={styles.activitiesList}>
                {activities.map((activity, index) => (
                  <ActivityItem 
                    key={activity.id} 
                    activity={activity} 
                    isLast={index === activities.length - 1}
                  />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;