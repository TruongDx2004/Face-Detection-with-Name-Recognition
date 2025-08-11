import styles from './styles';
import React, { useState, useEffect } from 'react';

const Notification = ({ notification, onRemove }) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setShow(true), 100);
  }, []);

  const getIcon = (type) => {
    const icons = {
      'success': 'fas fa-check-circle',
      'error': 'fas fa-exclamation-circle',
      'warning': 'fas fa-exclamation-triangle',
      'info': 'fas fa-info-circle'
    };
    return icons[type] || 'fas fa-info-circle';
  };

  const getColor = (type) => {
    const colors = {
      'success': '#10b981',
      'error': '#ef4444',
      'warning': '#f59e0b',
      'info': '#3b82f6'
    };
    return colors[type] || '#3b82f6';
  };

  const notificationStyle = {
    ...styles.notification,
    borderLeftColor: getColor(notification.type),
    ...(show ? styles.notificationShow : {})
  };

  return (
    <div style={notificationStyle}>
      <div style={styles.notificationContent}>
        <i 
          className={getIcon(notification.type)} 
          style={{ color: getColor(notification.type), fontSize: '18px' }}
        ></i>
        <span>{notification.message}</span>
      </div>
      <button 
        style={styles.notificationClose}
        onClick={() => onRemove(notification.id)}
        onMouseEnter={(e) => Object.assign(e.target.style, styles.notificationCloseHover)}
        onMouseLeave={(e) => Object.assign(e.target.style, styles.notificationClose)}
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default Notification;