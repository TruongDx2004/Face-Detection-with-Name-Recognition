const courseManagementStyles = {
  // Filter Bar Styles
  filterBar: {
    background: '#fff',
    borderRadius: '1rem',
    padding: '1.5rem',
    marginBottom: '2rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem'
  },

  searchSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1,
    flexWrap: 'wrap'
  },

  searchBox: {
    position: 'relative',
    minWidth: '320px',
    display: 'flex',
    alignItems: 'center'
  },

  searchIcon: {
    position: 'absolute',
    left: '1rem',
    color: '#64748b',
    fontSize: '0.875rem',
    zIndex: 1
  },

  searchInput: {
    width: '100%',
    padding: '0.875rem 1rem 0.875rem 2.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    background: '#f8fafc',
    outline: 'none',
    transition: 'all 0.2s'
  },

  clearSearch: {
    position: 'absolute',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '50%',
    fontSize: '0.75rem',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  filterSelect: {
    padding: '0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    background: '#f8fafc',
    outline: 'none',
    minWidth: '140px',
    cursor: 'pointer'
  },

  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },

  // Course Grid Styles
  coursesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },

  coursesGridList: {
    gridTemplateColumns: '1fr',
    gap: '1rem'
  },

  // Course Card Styles
  courseCard: {
    background: '#fff',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
    overflow: 'hidden'
  },

  courseCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
    border: '1px solid #c7d2fe'
  },

  courseCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },

  courseIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '0.75rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    marginRight: '1rem',
    flexShrink: 0
  },

  courseInfo: {
    flex: 1,
    minWidth: 0
  },

  courseName: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
    marginBottom: '0.25rem',
    lineHeight: '1.4',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
  },

  courseCode: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: 0,
    marginBottom: '0.25rem',
    fontWeight: '500'
  },

  courseDetails: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: 0,
    marginBottom: '0.25rem'
  },

  courseCardBody: {
    marginTop: '1rem'
  },

  courseBadges: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
    flexWrap: 'wrap'
  },

  courseBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '1rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },

  semesterBadge: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8'
  },

  yearBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534'
  },

  studentsBadge: {
    backgroundColor: '#fef3c7',
    color: '#92400e'
  },

  courseActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem'
  },

  courseActionBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    background: '#f1f5f9',
    color: '#475569'
  },

  courseActionBtnHover: {
    background: '#f59e0b',
    color: '#fff',
    transform: 'translateY(-1px)'
  },

  courseActionBtnDanger: {
    background: '#ef4444',
    color: '#fff',
    transform: 'translateY(-1px)'
  },

  // View Options
  viewOptions: {
    display: 'flex',
    background: '#f1f5f9',
    borderRadius: '0.5rem',
    padding: '0.25rem'
  },

  viewBtn: {
    padding: '0.5rem 0.75rem',
    background: 'transparent',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    color: '#64748b',
    fontSize: '0.875rem',
    transition: 'all 0.2s'
  },

  viewBtnActive: {
    background: '#fff',
    color: '#3b82f6',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
  },

  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },

  modal: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },

  modalLarge: {
    maxWidth: '800px'
  },

  modalHeader: {
    padding: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  },

  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  },

  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#64748b',
    padding: '0.25rem',
    borderRadius: '0.375rem',
    transition: 'color 0.2s'
  },

  modalBody: {
    padding: '1.5rem',
    flex: 1,
    overflowY: 'auto'
  },

  modalFooter: {
    padding: '1.5rem',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    flexShrink: 0
  },

  // Form Styles
  formGroup: {
    marginBottom: '1rem'
  },

  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1rem'
  },

  formLabel: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem'
  },

  formInput: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },

  formTextarea: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    resize: 'vertical',
    minHeight: '80px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },

  formError: {
    fontSize: '0.75rem',
    color: '#ef4444',
    marginTop: '0.25rem'
  },

  required: {
    color: '#ef4444'
  },

  // Button Styles
  btn: {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  },

  btnPrimary: {
    backgroundColor: '#3b82f6',
    color: '#fff'
  },

  btnSecondary: {
    backgroundColor: '#f8fafc',
    color: '#64748b',
    border: '1px solid #e2e8f0'
  },

  btnOutline: {
    backgroundColor: 'transparent',
    color: '#64748b',
    border: '1px solid #d1d5db'
  },

  btnDanger: {
    backgroundColor: '#ef4444',
    color: '#fff'
  }
};

export default courseManagementStyles;