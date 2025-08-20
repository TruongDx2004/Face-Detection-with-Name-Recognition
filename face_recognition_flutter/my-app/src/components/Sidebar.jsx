import styles from './styles';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import authService from '../services/auth-service';
import useNotification from '../hooks/useNotification';

const Sidebar = ({ isCollapsed, onToggle, activePage }) => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  // Nếu có activePage từ props thì set ban đầu bằng giá trị đó
  const [activeNav, setActiveNav] = useState(activePage || 'dashboard');
  const [showConfirm, setShowConfirm] = useState(false);

  // Nếu prop activePage thay đổi, update state
  useEffect(() => {
    if (activePage) {
      setActiveNav(activePage);
    }
  }, [activePage]);

  const navItems = [
    { id: 'dashboard', icon: 'fas fa-home', text: 'Dashboard', path: '/admin-dashboard' },
    { id: 'users', icon: 'fas fa-users', text: 'Quản lý người dùng', path: '/users' },
    { id: 'classes', icon: 'fas fa-school', text: 'Quản lý lớp học', path: '/classes' },
    { id: 'sessions', icon: 'fas fa-calendar-check', text: 'Phiên điểm danh', path: '/sessions' },
    { id: 'subjects', icon: 'fas fa-book', text: 'Môn học & Lịch', path: '/subjects' },
    { id: 'face-recognition', icon: 'fas fa-face-smile', text: 'Nhận diện khuôn mặt', path: '/face-recognition' },
    
  ];

  const sidebarStyle = {
    ...styles.sidebar,
    ...(isCollapsed ? styles.sidebarCollapsed : {})
  };

  const handleNavigation = (page) => {
    console.log(`Navigating to ${page.id}`);
    setActiveNav(page.id); // set item đang click là active
    if (page.path) {
      navigate(page.path);
      showNotification(`Chuyển đến trang ${page.text}`, 'info');
    } else {
      showNotification('Tính năng đang được phát triển', 'warning');
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  return (
    <>
      <aside style={sidebarStyle}>
        {/* Header */}
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <i className="fas fa-graduation-cap" style={styles.logoIcon}></i>
            <span style={{
              ...styles.logoText,
              ...(isCollapsed ? styles.logoTextHidden : {})
            }}>
              Face Attendance
            </span>
          </div>
          <button
            style={styles.sidebarToggle}
            onClick={onToggle}
            onMouseEnter={(e) => Object.assign(e.target.style, styles.sidebarToggleHover)}
            onMouseLeave={(e) => Object.assign(e.target.style, styles.sidebarToggle)}
          >
            <i className={`fas fa-chevron-left ${isCollapsed ? 'fa-rotate-180' : ''}`}></i>
          </button>
        </div>

        {/* Navigation */}
        <nav style={styles.sidebarNav}>
          {navItems.map((item) => (
            <div
              key={item.id}
              style={{
                ...styles.navItem,
                ...(activeNav === item.id ? styles.navItemActive : {})
              }}
              onClick={() => handleNavigation(item)}
            >
              <i className={item.icon} style={styles.navIcon}></i>
              <span style={{
                ...styles.navText,
                ...(isCollapsed ? styles.navTextHidden : {})
              }}>
                {item.text}
              </span>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#6366f1',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="fas fa-user"></i>
            </div>
            <div style={{
              opacity: isCollapsed ? 0 : 1,
              transition: 'opacity 0.3s ease-in-out'
            }}>
              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Admin</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>Quản trị viên</div>
            </div>
          </div>
          <button style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'rgba(255, 255, 255, 0.7)',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }} onClick={() => setShowConfirm(true)}
          >
            <i className="fas fa-sign-out-alt"></i>
            {!isCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Xác nhận đăng xuất */}
      {showConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1f2937',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            maxWidth: '300px',
            color: '#fff'
          }}>
            <p>Bạn có chắc chắn muốn đăng xuất?</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                onClick={handleLogout}
                style={{
                  background: '#d9534f',
                  color: '#fff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.3rem',
                  cursor: 'pointer'
                }}
              >
                Đăng xuất
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.3rem',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
