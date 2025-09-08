//components/layout/Header.jsx
import React, { useState } from 'react';


const styles = {
  header: {
    backgroundColor: '#ffffff',
    padding: '20px 0',
    borderBottom: '1px solid #e2e8f0',
    marginBottom: '30px'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  backButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  backButtonHover: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1'
  },
  title: {
    fontSize: '28px',
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
  subtitle: {
    fontSize: '16px',
    color: '#64748b',
    marginTop: '4px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '12px'
  },
  breadcrumbItem: {
    color: '#64748b',
    textDecoration: 'none',
    transition: 'color 0.2s ease'
  },
  breadcrumbItemHover: {
    color: '#3b82f6'
  },
  breadcrumbSeparator: {
    color: '#cbd5e1'
  },
  breadcrumbCurrent: {
    color: '#374151',
    fontWeight: '500'
  }
};

const Header = ({ 
  title, 
  subtitle, 
  titleIcon, 
  showBack = false, 
  onBack, 
  breadcrumb = [], 
  actions = [],
  children 
}) => {
  const [hoveredBack, setHoveredBack] = useState(false);

  return (
    <div style={styles.header}>
      <div style={styles.headerContent}>
        <div style={styles.headerLeft}>
          {showBack && (
            <button
              style={{
                ...styles.backButton,
                ...(hoveredBack ? styles.backButtonHover : {})
              }}
              onMouseEnter={() => setHoveredBack(true)}
              onMouseLeave={() => setHoveredBack(false)}
              onClick={onBack}
            >
              <i className="fas fa-arrow-left"></i>
              Quay lại
            </button>
          )}
          
          <div>
            {breadcrumb.length > 0 && (
              <div style={styles.breadcrumb}>
                {breadcrumb.map((item, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <i className="fas fa-chevron-right" style={styles.breadcrumbSeparator}></i>
                    )}
                    {item.path ? (
                      <a 
                        href={item.path} 
                        style={styles.breadcrumbItem}
                        onMouseEnter={(e) => e.target.style.color = styles.breadcrumbItemHover.color}
                        onMouseLeave={(e) => e.target.style.color = styles.breadcrumbItem.color}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span style={index === breadcrumb.length - 1 ? styles.breadcrumbCurrent : styles.breadcrumbItem}>
                        {item.label}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
            
            <h1 style={styles.title}>
              {titleIcon && <i className={titleIcon} style={styles.titleIcon}></i>}
              {title}
            </h1>
            
            {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
          </div>
        </div>

        <div style={styles.headerRight}>
          {actions.map((action, index) => (
            <button
              key={index}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: action.primary ? '#3b82f6' : '#f1f5f9',
                color: action.primary ? '#ffffff' : '#374151',
                border: action.primary ? 'none' : '1px solid #e2e8f0'
              }}
              onClick={action.onClick}
            >
              {action.icon && <i className={action.icon}></i>}
              {action.label}
            </button>
          ))}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Header;