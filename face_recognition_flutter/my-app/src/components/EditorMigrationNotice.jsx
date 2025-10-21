import React, { useState } from 'react';

const EditorMigrationNotice = ({ onDismiss }) => {
    const [showDetails, setShowDetails] = useState(false);

    const styles = {
        notice: {
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            position: 'relative'
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
        },
        title: {
            fontSize: '16px',
            fontWeight: '600',
            color: '#0369a1',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        closeButton: {
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: '#64748b',
            padding: '4px'
        },
        content: {
            fontSize: '14px',
            color: '#0369a1',
            lineHeight: '1.5',
            marginBottom: '12px'
        },
        features: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginTop: '12px'
        },
        feature: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#0369a1'
        },
        featureIcon: {
            color: '#10b981'
        },
        buttons: {
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
        },
        button: {
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
        },
        buttonPrimary: {
            backgroundColor: '#3b82f6',
            color: '#ffffff'
        },
        buttonSecondary: {
            backgroundColor: '#ffffff',
            color: '#374151',
            border: '1px solid #d1d5db'
        },
        detailsToggle: {
            backgroundColor: 'transparent',
            color: '#0369a1',
            textDecoration: 'underline',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            padding: 0
        }
    };

    const newFeatures = [
        { icon: '🎨', text: 'WYSIWYG editing' },
        { icon: '⚗️', text: 'Chemistry formulas' },
        { icon: '📐', text: 'Math equations' },
        { icon: '⌨️', text: 'Keyboard shortcuts' },
        { icon: '👀', text: 'Live preview' },
        { icon: '🎯', text: 'Better UX' }
    ];

    return (
        <div style={styles.notice}>
            <div style={styles.header}>
                <div style={styles.title}>
                    🚀 Trình soạn thảo đã được nâng cấp!
                </div>
                <button 
                    style={styles.closeButton}
                    onClick={onDismiss}
                    title="Đóng thông báo"
                >
                    ✕
                </button>
            </div>

            <div style={styles.content}>
                Hệ thống đã được nâng cấp lên <strong>WYSIWYG Editor</strong> với nhiều tính năng mới để tạo câu hỏi 
                trắc nghiệm chuyên nghiệp, đặc biệt hỗ trợ tốt cho môn hóa học và toán học.
            </div>

            {showDetails && (
                <div style={styles.features}>
                    {newFeatures.map((feature, index) => (
                        <div key={index} style={styles.feature}>
                            <span style={styles.featureIcon}>{feature.icon}</span>
                            {feature.text}
                        </div>
                    ))}
                </div>
            )}

            <div style={styles.buttons}>
                <button
                    style={{ ...styles.button, ...styles.buttonPrimary }}
                    onClick={() => window.open('/demo/wysiwyg', '_blank')}
                >
                    🎮 Xem demo
                </button>
                <button
                    style={{ ...styles.button, ...styles.buttonSecondary }}
                    onClick={() => window.open('/help/wysiwyg', '_blank')}
                >
                    📚 Hướng dẫn
                </button>
                <button
                    style={styles.detailsToggle}
                    onClick={() => setShowDetails(!showDetails)}
                >
                    {showDetails ? 'Ẩn chi tiết' : 'Xem tính năng mới'}
                </button>
            </div>
        </div>
    );
};

export default EditorMigrationNotice;