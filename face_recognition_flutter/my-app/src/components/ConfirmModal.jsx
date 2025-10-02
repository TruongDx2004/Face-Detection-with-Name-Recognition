import React from 'react';

function ConfirmModal({ show, title, message, onConfirm, onCancel }) {
  if (!show) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {title && <h3 style={styles.title}>{title}</h3>}
        <div style={styles.message}>
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>
        <div style={styles.actions}>
          <button style={styles.btnCancel} onClick={onCancel}>Hủy</button>
          <button style={styles.btnConfirm} onClick={onConfirm}>Xác nhận</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10000
  },
  modal: {
    background: '#fff', 
    padding: '24px', 
    borderRadius: '12px',
    minWidth: '320px', 
    maxWidth: '500px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    textAlign: 'left'
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: '16px',
    textAlign: 'center'
  },
  message: { 
    fontSize: '14px', 
    lineHeight: '1.5',
    color: '#374151',
    marginBottom: '24px' 
  },
  actions: { 
    display: 'flex', 
    justifyContent: 'flex-end', 
    gap: '12px' 
  },
  btnConfirm: { 
    backgroundColor: '#3b82f6', 
    color: '#fff', 
    padding: '10px 20px', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
  },
  btnCancel: { 
    backgroundColor: '#6b7280', 
    color: '#fff', 
    padding: '10px 20px', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
  }
};

export default ConfirmModal;
