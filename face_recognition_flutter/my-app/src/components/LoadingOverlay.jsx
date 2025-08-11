// Loading Component
import styles from './styles';

const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null;
  
  const overlayStyle = {
    ...styles.loadingOverlay,
    ...(isLoading ? styles.loadingOverlayActive : {})
  };
  
  return (
    <div style={overlayStyle}>
      <div style={{ textAlign: 'center' }}>
        <div style={styles.spinner}></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;

