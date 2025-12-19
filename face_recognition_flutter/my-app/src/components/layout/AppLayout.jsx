// components/layout/AppLayout.jsx
import React from 'react';
import Sidebar from './Sidebar';
import NavBar from './NavBar';
import Header from './Header';
import ChatWidget from '../ChatWidget';

const styles = {
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    transition: 'all 0.3s ease'
  },
  content: {
    flex: 1,
    padding: '30px',
    overflow: 'auto'
  }
};

const AppLayout = ({ children, user, onLogout, currentTime, sidebarItems = [], title }) => {
  // Show ChatWidget only for teachers and admins
  const showChatWidget = user && (user.role === 'teacher' || user.role === 'admin');
  
  return (
    <div style={styles.appContainer}>
      <Sidebar items={sidebarItems} />
      <div style={styles.mainContent}>
        <NavBar 
          user={user} 
          onLogout={onLogout} 
          currentTime={currentTime}
          title={title}
        />
        <div style={styles.content}>
          {children}
        </div>
      </div>
      
      {/* ChatWidget for teachers only */}
      {showChatWidget && <ChatWidget user={user} />}
    </div>
  );
};

export {AppLayout, Header};