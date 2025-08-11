// Class Management specific styles
const classManagementStyles = {
  filterBar: {
    background: '#ffffff',
    padding: '1.5rem',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    marginBottom: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1.5rem',
    flexWrap: 'wrap'
  },
  searchSection: {
    flex: 1,
    maxWidth: '400px'
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  searchInput: {
    width: '100%',
    padding: '0.5rem 0.5rem 0.5rem 2.5rem',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    transition: 'all 0.15s ease-in-out'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: '#94a3b8'
  },
  clearSearch: {
    position: 'absolute',
    right: '8px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '50%'
  },
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  filterSelect: {
    padding: '0.5rem 1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    background: 'white',
    cursor: 'pointer'
  },
  viewOptions: {
    display: 'flex',
    gap: '0.25rem'
  },
  viewBtn: {
    width: '36px',
    height: '36px',
    background: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out'
  },
  viewBtnActive: {
    background: '#6366f1',
    color: 'white',
    borderColor: '#6366f1'
  },
  classesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
    padding: '2rem'
  },
  classesGridList: {
    display: 'block'
  },
  classCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '1rem',
    overflow: 'hidden',
    transition: 'all 0.3s ease-in-out',
    cursor: 'pointer'
  },
  classCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    borderColor: '#6366f1'
  },
  classCardHeader: {
    padding: '1.5rem',
    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    color: 'white',
    position: 'relative'
  },
  classInfo: {
    position: 'relative',
    zIndex: 1
  },
  className: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '0.25rem'
  },
  classCode: {
    fontSize: '0.9rem',
    opacity: 0.9
  },
  classCardBody: {
    padding: '1.5rem'
  },
  classStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1rem'
  },
  classStat: {
    textAlign: 'center'
  },
  classStatValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#6366f1'
  },
  classStatLabel: {
    fontSize: '0.8rem',
    color: '#64748b'
  },
  classDescription: {
    color: '#64748b',
    fontSize: '0.9rem',
    marginBottom: '1rem',
    maxHeight: '40px',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2
  },
  classActions: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  classActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.375rem',
    fontSize: '0.8rem',
    border: '1px solid #e2e8f0',
    background: 'white',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out'
  },
  classActionBtnHover: {
    background: '#6366f1',
    color: 'white',
    borderColor: '#6366f1'
  },
  classActionBtnDanger: {
    background: '#ef4444',
    borderColor: '#ef4444'
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: '500'
  },
  statusBadgeActive: {
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981'
  },
  statusBadgeInactive: {
    background: 'rgba(107, 114, 128, 0.1)',
    color: '#94a3b8'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '1.5rem'
  },
  modal: {
    background: '#ffffff',
    borderRadius: '1rem',
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden'
  },
  modalLarge: {
    maxWidth: '900px'
  },
  modalHeader: {
    padding: '2rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  modalClose: {
    width: '32px',
    height: '32px',
    background: 'transparent',
    border: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#94a3b8',
    transition: 'all 0.15s ease-in-out'
  },
  modalBody: {
    padding: '2rem',
    maxHeight: 'calc(90vh - 140px)',
    overflowY: 'auto'
  },
  modalFooter: {
    padding: '2rem',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end'
  },
  formGroup: {
    marginBottom: '1.5rem'
  },
  formLabel: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: '0.5rem'
  },
  formInput: {
    width: '100%',
    padding: '0.5rem 1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    transition: 'all 0.15s ease-in-out',
    background: 'white'
  },
  formError: {
    color: '#ef4444',
    fontSize: '0.8rem',
    marginTop: '0.25rem'
  },
  required: {
    color: '#ef4444'
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    textDecoration: 'none',
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
    whiteSpace: 'nowrap'
  },
  btnPrimary: {
    background: '#6366f1',
    color: 'white',
    borderColor: '#6366f1'
  },
  btnOutline: {
    background: 'transparent',
    color: '#6366f1',
    borderColor: '#6366f1'
  },
  btnDanger: {
    background: '#ef4444',
    color: 'white',
    borderColor: '#ef4444'
  }
};

export default classManagementStyles;