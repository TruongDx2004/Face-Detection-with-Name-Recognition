import React from 'react';

function ConfirmModal({ show, message, onConfirm, onCancel }) {
  if (!show) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <p style={styles.message}>{message}</p>
        <div style={styles.actions}>
          <button style={styles.btnConfirm} onClick={onConfirm}>Xác nhận</button>
          <button style={styles.btnCancel} onClick={onCancel}>Hủy</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999
  },
  modal: {
    background: '#fff', padding: '20px', borderRadius: '8px',
    minWidth: '300px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    textAlign: 'center'
  },
  message: { fontSize: '16px', marginBottom: '20px' },
  actions: { display: 'flex', justifyContent: 'center', gap: '10px' },
  btnConfirm: { backgroundColor: '#28a745', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  btnCancel: { backgroundColor: '#dc3545', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default ConfirmModal;
