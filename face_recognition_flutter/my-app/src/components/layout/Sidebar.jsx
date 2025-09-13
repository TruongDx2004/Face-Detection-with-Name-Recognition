// components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const styles = {
  sidebar: {
    width: '280px',
    backgroundColor: '#1e293b',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflow: 'hidden'
  },
  sidebarCollapsed: {
    width: '70px'
  },
  logo: {
    padding: '20px',
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '18px',
    fontWeight: '700'
  },
  logoIcon: {
    fontSize: '24px',
    color: '#3b82f6'
  },
  logoText: {
    transition: 'opacity 0.3s ease'
  },
  logoTextHidden: {
    opacity: 0
  },
  nav: {
    flex: 1,
    padding: '20px 0',
    overflowY: 'auto'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    color: '#cbd5e1',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    borderLeft: '3px solid transparent'
  },
  navItemHover: {
    backgroundColor: '#334155',
    color: '#ffffff'
  },
  navItemActive: {
    backgroundColor: '#1e40af',
    color: '#ffffff',
    borderLeftColor: '#3b82f6'
  },
  navIcon: {
    width: '20px',
    textAlign: 'center',
    fontSize: '16px'
  },
  navText: {
    fontSize: '14px',
    fontWeight: '500',
    transition: 'opacity 0.3s ease'
  },
  navTextHidden: {
    opacity: 0
  },
  collapseToggle: {
    padding: '15px 20px',
    borderTop: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#cbd5e1',
    fontSize: '18px',
    transition: 'all 0.2s ease'
  },
  collapseToggleHover: {
    backgroundColor: '#334155',
    color: '#ffffff'
  }
};

const Sidebar = ({ items = [] }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredToggle, setHoveredToggle] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const defaultItems = [
    { id: 'dashboard', label: 'Trang chủ', icon: 'fas fa-tachometer-alt', path: '/teacher-dashboard' },
    { id: 'classes', label: 'Quản lý lớp', icon: 'fas fa-users', path: '/teacher/classes' },
    { id: 'schedules', label: 'Lịch dạy', icon: 'fas fa-calendar', path: '/teacher/schedules' },
    { id: 'attendance', label: 'Điểm danh', icon: 'fas fa-clipboard-check', path: '/teacher/attendance' },
    { id: 'assignments', label: 'Bài tập', icon: 'fas fa-tasks', path: '/teacher/assignments' },
    { id: 'exams', label: 'Kiểm tra', icon: 'fas fa-file-alt', path: '/teacher/exams' },
    { id: 'reports', label: 'Báo cáo', icon: 'fas fa-chart-bar', path: '/teacher/reports' },
  ];

  const menuItems = items.length > 0 ? items : defaultItems;

  const handleItemClick = (item) => {
    if (item.path) {
      navigate(item.path);
    }
    if (item.onClick) {
      item.onClick();
    }
  };

  const isActive = (item) => {
    if (item.path === '/teacher' && location.pathname === '/teacher') return true;
    if (item.path !== '/teacher' && location.pathname.startsWith(item.path)) return true;
    return false;
  };

  return (
    <div style={{
      ...styles.sidebar,
      ...(collapsed ? styles.sidebarCollapsed : {})
    }}>
      <div style={styles.logo}>
        <i className="fas fa-graduation-cap" style={styles.logoIcon}></i>
        <span style={{
          ...styles.logoText,
          ...(collapsed ? styles.logoTextHidden : {})
        }}>
          EduSystem
        </span>
      </div>

      <nav style={styles.nav}>
        {menuItems.map(item => (
          <div
            key={item.id}
            style={{
              ...styles.navItem,
              ...(hoveredItem === item.id ? styles.navItemHover : {}),
              ...(isActive(item) ? styles.navItemActive : {})
            }}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => handleItemClick(item)}
          >
            <i className={item.icon} style={styles.navIcon}></i>
            <span style={{
              ...styles.navText,
              ...(collapsed ? styles.navTextHidden : {})
            }}>
              {item.label}
            </span>
          </div>
        ))}
      </nav>

      <button
        style={{
          ...styles.collapseToggle,
          ...(hoveredToggle ? styles.collapseToggleHover : {})
        }}
        onMouseEnter={() => setHoveredToggle(true)}
        onMouseLeave={() => setHoveredToggle(false)}
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Mở rộng' : 'Thu gọn'}
      >
        <i className={collapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'}></i>
      </button>
    </div>
  );
};

export default Sidebar;