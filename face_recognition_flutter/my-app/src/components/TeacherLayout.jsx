// components/TeacherLayout.jsx
// Reusable layout component cho tất cả các trang teacher
import React from 'react';
import Sidebar from './layout/Sidebar';
import NavBar from './layout/NavBar';
import ChatWidget from './ChatWidget';

const TeacherLayout = ({ 
    children, 
    user, 
    onLogout, 
    currentTime, 
    sidebarItems = [], 
    title 
}) => {
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
            
            {/* ChatWidget always available for teachers */}
            {user && (user.role === 'teacher' || user.role === 'admin') && (
                <ChatWidget user={user} />
            )}
        </div>
    );
};

export default TeacherLayout;