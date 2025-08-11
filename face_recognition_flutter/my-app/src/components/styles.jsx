// Styles object
const styles = {
  // Root variables
  colors: {
    primary: '#6366f1',
    primaryHover: '#5b21b6',
    secondary: '#f8fafc',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    cardBackground: '#ffffff',
    sidebarBg: '#1e293b',
    sidebarHover: '#334155'
  },
  
  // App container
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#1e293b',
    backgroundColor: '#f8fafc'
  },
  
  // Sidebar styles
  sidebar: {
    width: '280px',
    backgroundColor: '#1e293b',
    color: 'white',
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    zIndex: 1000,
    transition: 'width 0.3s ease-in-out',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  
  sidebarCollapsed: {
    width: '70px'
  },
  
  sidebarHeader: {
    padding: '2rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative'
  },
  
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    fontSize: '1.25rem',
    fontWeight: '700'
  },
  
  logoIcon: {
    fontSize: '2rem',
    color: '#6366f1'
  },
  
  logoText: {
    whiteSpace: 'nowrap',
    opacity: 1,
    transition: 'opacity 0.3s ease-in-out'
  },
  
  logoTextHidden: {
    opacity: 0
  },
  
  sidebarToggle: {
    position: 'absolute',
    right: '-16px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: '#6366f1',
    border: 'none',
    color: 'white',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out'
  },
  
  sidebarToggleHover: {
    background: '#5b21b6',
    transform: 'translateY(-50%) scale(1.1)'
  },
  
  // Navigation styles
  sidebarNav: {
    flex: 1,
    padding: '1.5rem 0',
    overflowY: 'auto'
  },
  
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem 2rem',
    color: 'rgba(255, 255, 255, 0.7)',
    textDecoration: 'none',
    transition: 'all 0.15s ease-in-out',
    position: 'relative',
    margin: '0 1rem',
    borderRadius: '0.5rem',
    cursor: 'pointer'
  },
  
  navItemHover: {
    backgroundColor: '#334155',
    color: 'white',
    transform: 'translateX(4px)'
  },
  
  navItemActive: {
    backgroundColor: '#6366f1',
    color: 'white'
  },
  
  navIcon: {
    width: '20px',
    marginRight: '1rem',
    textAlign: 'center'
  },
  
  navText: {
    whiteSpace: 'nowrap',
    opacity: 1,
    transition: 'opacity 0.3s ease-in-out'
  },
  
  navTextHidden: {
    opacity: 0
  },
  
  // Main content
  mainContent: {
    flex: 1,
    marginLeft: '280px',
    transition: 'margin-left 0.3s ease-in-out',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh'
  },
  
  mainContentCollapsed: {
    marginLeft: '70px'
  },
  
  // Header styles
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  
  headerTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  
  headerIcon: {
    color: '#6366f1'
  },
  
  headerSubtitle: {
    color: '#64748b',
    fontSize: '0.9rem'
  },
  
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  
  headerActions: {
    display: 'flex',
    gap: '0.5rem'
  },
  
  actionBtn: {
    width: '40px',
    height: '40px',
    background: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
    position: 'relative'
  },
  
  actionBtnHover: {
    background: '#6366f1',
    color: 'white',
    borderColor: '#6366f1'
  },
  
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    background: '#ef4444',
    color: 'white',
    fontSize: '0.7rem',
    padding: '2px 6px',
    borderRadius: '10px',
    minWidth: '18px',
    textAlign: 'center'
  },
  
  currentTime: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.9rem',
    color: '#64748b',
    background: '#f8fafc',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: '1px solid #e2e8f0'
  },
  
  // Dashboard content
  dashboardContent: {
    flex: 1,
    padding: '2rem',
    position: 'relative'
  },
  
  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    opacity: 0,
    visibility: 'hidden',
    transition: 'all 0.3s ease-in-out'
  },
  
  loadingOverlayActive: {
    opacity: 1,
    visibility: 'visible'
  },
  
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1rem'
  },
  
  // Section styles
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  
  sectionIcon: {
    color: '#6366f1'
  },
  
  viewAllBtn: {
    background: 'transparent',
    border: '1px solid #6366f1',
    color: '#6366f1',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out'
  },
  
  viewAllBtnHover: {
    background: '#6366f1',
    color: 'white'
  },
  
  // Grid layouts
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem'
  },
  
  quickActionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem'
  },
  
  managementGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem'
  },
  
  // Card styles
  statCard: {
    background: '#ffffff',
    padding: '2rem',
    borderRadius: '1rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease-in-out',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer'
  },
  
  statCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
  },
  
  statCardBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #6366f1, #06b6d4)'
  },
  
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem'
  },
  
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    color: 'white'
  },
  
  statValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.25rem'
  },
  
  statLabel: {
    color: '#64748b',
    fontSize: '0.9rem'
  },
  
  statChange: {
    fontSize: '0.8rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    color: '#10b981'
  },
  
  // Quick action styles
  quickActionCard: {
    background: '#ffffff',
    padding: '2rem',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.3s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  
  quickActionCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    borderColor: '#6366f1'
  },
  
  actionIcon: {
    width: '60px',
    height: '60px',
    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    color: 'white'
  },
  
  actionContent: {
    flex: 1
  },
  
  actionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.25rem'
  },
  
  actionDescription: {
    fontSize: '0.85rem',
    color: '#64748b'
  },
  
  // Management card styles
  managementCard: {
    background: '#ffffff',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    transition: 'all 0.3s ease-in-out',
    cursor: 'pointer'
  },
  
  managementCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
  },
  
  cardHeader: {
    padding: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  
  cardIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    color: 'white'
  },
  
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.25rem'
  },
  
  cardDescription: {
    fontSize: '0.85rem',
    color: '#64748b',
    lineHeight: '1.4'
  },
  
  cardStats: {
    padding: '0 2rem 2rem'
  },
  
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderTop: '1px solid #e2e8f0'
  },
  
  statRowFirst: {
    borderTop: 'none',
    paddingTop: 0
  },
  
  statRowLabel: {
    color: '#64748b',
    fontSize: '0.85rem'
  },
  
  statRowValue: {
    fontWeight: '600',
    color: '#1e293b'
  },
  
  // Activity styles
  activitiesList: {
    background: '#ffffff',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    overflow: 'hidden'
  },
  
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: '1px solid #e2e8f0',
    transition: 'background-color 0.15s ease-in-out'
  },
  
  activityItemLast: {
    borderBottom: 'none'
  },
  
  activityItemHover: {
    backgroundColor: '#f8fafc'
  },
  
  activityIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '1.5rem',
    fontSize: '0.9rem',
    color: 'white'
  },
  
  activityContent: {
    flex: 1
  },
  
  activityTitle: {
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: '0.25rem'
  },
  
  activityDescription: {
    fontSize: '0.85rem',
    color: '#64748b'
  },
  
  activityTime: {
    fontSize: '0.8rem',
    color: '#94a3b8'
  },
  
  // Notification styles
  notification: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    borderLeft: '4px solid',
    padding: '16px',
    minWidth: '300px',
    maxWidth: '400px',
    zIndex: 10000,
    transform: 'translateX(100%)',
    transition: 'transform 0.3s ease-in-out'
  },
  
  notificationShow: {
    transform: 'translateX(0)'
  },
  
  notificationContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  notificationClose: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: '#64748b'
  },
  
  notificationCloseHover: {
    color: '#334155'
  }
};

export default styles;