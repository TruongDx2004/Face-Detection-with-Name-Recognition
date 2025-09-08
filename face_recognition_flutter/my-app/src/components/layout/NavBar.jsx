// components/layout/NavBar.jsx
import React, { useState, useRef, useEffect } from 'react';

const styles = {
  navbar: {
    backgroundColor: '#ffffff',
    padding: '15px 30px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a202c',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  titleIcon: {
    color: '#3b82f6'
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  timeDisplay: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  userMenu: {
    position: 'relative'
  },
  userButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'all 0.2s ease'
  },
  userButtonHover: {
    backgroundColor: '#f8fafc'
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  userName: {
    fontWeight: '600',
    color: '#374151',
    fontSize: '14px'
  },
  chevron: {
    transition: 'transform 0.2s ease',
    color: '#64748b'
  },
  chevronRotated: {
    transform: 'rotate(180deg)'
  },
  dropdown: {
    position: 'absolute',
    top: '55px',
    right: 0,
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    zIndex: 1000,
    width: '200px',
    overflow: 'hidden',
    animation: 'slideDown 0.2s ease'
  },
  dropdownItem: {
    padding: '12px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#374151',
    transition: 'all 0.2s ease'
  },
  dropdownItemHover: {
    backgroundColor: '#f8fafc'
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: '#e2e8f0',
    margin: '4px 0'
  }
};

const NavBar = ({ user, onLogout, currentTime, title, titleIcon, actions = [] }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [hoveredUserButton, setHoveredUserButton] = useState(false);
  const [hoveredDropdownItem, setHoveredDropdownItem] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const defaultActions = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: 'fas fa-user', onClick: () => console.log('Profile') },
    { id: 'settings', label: 'Cài đặt', icon: 'fas fa-cog', onClick: () => console.log('Settings') },
    { type: 'divider' },
    { id: 'logout', label: 'Đăng xuất', icon: 'fas fa-sign-out-alt', onClick: onLogout, danger: true }
  ];

  const menuActions = actions.length > 0 ? actions : defaultActions;

  return (
    <nav style={styles.navbar}>
      <h1 style={styles.title}>
        {titleIcon && <i className={titleIcon} style={styles.titleIcon}></i>}
        {title || 'Dashboard'}
      </h1>

      <div style={styles.actions}>
        {currentTime && (
          <div style={styles.timeDisplay}>
            <i className="fas fa-clock"></i>
            {currentTime.toLocaleString('vi-VN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}

        <div style={styles.userMenu} ref={menuRef}>
          <button
            style={{
              ...styles.userButton,
              ...(hoveredUserButton ? styles.userButtonHover : {})
            }}
            onMouseEnter={() => setHoveredUserButton(true)}
            onMouseLeave={() => setHoveredUserButton(false)}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div style={styles.userAvatar}>
              {getInitials(user?.full_name)}
            </div>
            <span style={styles.userName}>
              {user?.full_name || 'User'}
            </span>
            <i 
              className="fas fa-chevron-down" 
              style={{
                ...styles.chevron,
                ...(isUserMenuOpen ? styles.chevronRotated : {})
              }}
            ></i>
          </button>

          {isUserMenuOpen && (
            <div style={styles.dropdown}>
              {menuActions.map((action, index) => {
                if (action.type === 'divider') {
                  return <div key={`divider-${index}`} style={styles.dropdownDivider}></div>;
                }

                return (
                  <div
                    key={action.id}
                    style={{
                      ...styles.dropdownItem,
                      ...(hoveredDropdownItem === action.id ? styles.dropdownItemHover : {}),
                      ...(action.danger ? { color: '#ef4444' } : {})
                    }}
                    onMouseEnter={() => setHoveredDropdownItem(action.id)}
                    onMouseLeave={() => setHoveredDropdownItem(null)}
                    onClick={() => {
                      action.onClick();
                      setIsUserMenuOpen(false);
                    }}
                  >
                    <i className={action.icon} style={{ width: '16px', textAlign: 'center' }}></i>
                    <span>{action.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </nav>
  );
};

export default NavBar;