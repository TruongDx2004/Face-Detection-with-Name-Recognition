// Header Component
import React, { useState } from 'react';
import styles from './styles'; 

const Header = ({ currentTime }) => {
  const [actionBtnHover, setActionBtnHover] = useState({});

  return (
    <header style={styles.header}>
      <div>
        <h1 style={styles.headerTitle}>
          <i className="fas fa-tachometer-alt" style={styles.headerIcon}></i>
          Dashboard
        </h1>
        <p style={styles.headerSubtitle}>Tổng quan hệ thống điểm danh</p>
      </div>
      <div style={styles.headerRight}>
        <div style={styles.headerActions}>
          <button 
            style={{
              ...styles.actionBtn,
              ...(actionBtnHover.bell ? styles.actionBtnHover : {})
            }}
            onMouseEnter={() => setActionBtnHover({...actionBtnHover, bell: true})}
            onMouseLeave={() => setActionBtnHover({...actionBtnHover, bell: false})}
            title="Thông báo"
          >
            <i className="fas fa-bell"></i>
            <span style={styles.badge}>3</span>
          </button>
          <button 
            style={{
              ...styles.actionBtn,
              ...(actionBtnHover.cog ? styles.actionBtnHover : {})
            }}
            onMouseEnter={() => setActionBtnHover({...actionBtnHover, cog: true})}
            onMouseLeave={() => setActionBtnHover({...actionBtnHover, cog: false})}
            title="Cài đặt"
          >
            <i className="fas fa-cog"></i>
          </button>
        </div>
        <div style={styles.currentTime}>
          {currentTime}
        </div>
      </div>
    </header>
  );
};

export default Header;