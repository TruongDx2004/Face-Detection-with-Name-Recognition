import React, { useState } from 'react';

const WysiwygUsageGuide = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('basic');

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
        },
        modal: {
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        },
        header: {
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        title: {
            fontSize: '18px',
            fontWeight: '600',
            color: '#1e293b'
        },
        closeButton: {
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#64748b'
        },
        tabs: {
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc'
        },
        tab: {
            padding: '12px 20px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            border: 'none',
            background: 'none',
            borderBottom: '2px solid transparent',
            transition: 'all 0.2s ease'
        },
        tabActive: {
            color: '#3b82f6',
            borderBottomColor: '#3b82f6',
            backgroundColor: '#ffffff'
        },
        tabInactive: {
            color: '#64748b'
        },
        content: {
            padding: '24px',
            maxHeight: '60vh',
            overflowY: 'auto'
        },
        section: {
            marginBottom: '24px'
        },
        sectionTitle: {
            fontSize: '16px',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        feature: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
        },
        featureIcon: {
            fontSize: '20px',
            minWidth: '24px'
        },
        featureContent: {
            flex: 1
        },
        featureTitle: {
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '4px'
        },
        featureDesc: {
            fontSize: '13px',
            color: '#64748b',
            lineHeight: '1.5'
        },
        shortcut: {
            display: 'inline-block',
            padding: '2px 6px',
            backgroundColor: '#e2e8f0',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#374151',
            margin: '0 2px'
        },
        example: {
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '6px',
            padding: '12px',
            marginTop: '8px'
        },
        exampleTitle: {
            fontSize: '12px',
            fontWeight: '600',
            color: '#0369a1',
            marginBottom: '6px'
        },
        exampleContent: {
            fontSize: '13px',
            color: '#0369a1',
            fontFamily: 'monospace'
        }
    };

    const tabs = [
        { id: 'basic', label: 'Cơ bản', icon: '📝' },
        { id: 'chemistry', label: 'Hóa học', icon: '⚗️' },
        { id: 'math', label: 'Toán học', icon: '🔢' },
        { id: 'shortcuts', label: 'Phím tắt', icon: '⌨️' }
    ];

    const basicFeatures = [
        {
            icon: '🔤',
            title: 'Định dạng văn bản',
            desc: 'In đậm, in nghiêng, gạch chân, gạch ngang để làm nổi bật nội dung quan trọng.',
            shortcuts: ['Ctrl+B', 'Ctrl+I', 'Ctrl+U']
        },
        {
            icon: '📋',
            title: 'Danh sách',
            desc: 'Tạo danh sách có thứ tự và không có thứ tự để sắp xếp thông tin.',
            shortcuts: ['Ctrl+Shift+7', 'Ctrl+Shift+8']
        },
        {
            icon: '📏',
            title: 'Căn chỉnh',
            desc: 'Căn trái, căn giữa, căn phải, căn đều cho văn bản.',
            shortcuts: ['Ctrl+Shift+L', 'Ctrl+Shift+E', 'Ctrl+Shift+R']
        },
        {
            icon: '🎨',
            title: 'Màu sắc',
            desc: 'Thay đổi màu chữ và màu nền để làm nổi bật nội dung.',
            shortcuts: []
        }
    ];

    const chemistryFeatures = [
        {
            icon: '🧪',
            title: 'Công thức hóa học',
            desc: 'Sử dụng các nút công thức có sẵn hoặc nhập thủ công.',
            example: 'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O',
            shortcuts: ['Ctrl+F']
        },
        {
            icon: '⬇️',
            title: 'Chỉ số dưới',
            desc: 'Cho số nguyên tử trong công thức hóa học.',
            example: 'H₂O, CO₂, CaCO₃',
            shortcuts: ['Ctrl+,']
        },
        {
            icon: '⬆️',
            title: 'Chỉ số trên',
            desc: 'Cho điện tích ion hoặc số oxi hóa.',
            example: 'Ca²⁺, SO₄²⁻, Fe³⁺',
            shortcuts: ['Ctrl+.']
        },
        {
            icon: '↔️',
            title: 'Mũi tên phản ứng',
            desc: 'Sử dụng → ← ↔ để biểu diễn phản ứng hóa học.',
            example: 'A + B → C + D',
            shortcuts: []
        }
    ];

    const mathFeatures = [
        {
            icon: '∑',
            title: 'Công thức toán học',
            desc: 'Chèn công thức toán học phức tạp với LaTeX.',
            example: '∫₀¹ x² dx = ⅓',
            shortcuts: []
        },
        {
            icon: '√',
            title: 'Căn bậc hai',
            desc: 'Ký hiệu căn bậc hai và căn bậc n.',
            example: '√9 = 3, ∛8 = 2',
            shortcuts: []
        },
        {
            icon: '∞',
            title: 'Ký hiệu đặc biệt',
            desc: 'Các ký hiệu toán học như vô cực, pi, alpha.',
            example: 'π ≈ 3.14159, ∞, α, β, γ',
            shortcuts: []
        }
    ];

    const shortcuts = [
        { key: 'Ctrl+B', desc: 'In đậm' },
        { key: 'Ctrl+I', desc: 'In nghiêng' },
        { key: 'Ctrl+U', desc: 'Gạch chân' },
        { key: 'Ctrl+F', desc: 'Chèn công thức hóa học' },
        { key: 'Ctrl+,', desc: 'Chỉ số dưới' },
        { key: 'Ctrl+.', desc: 'Chỉ số trên' },
        { key: 'Ctrl+Z', desc: 'Hoàn tác' },
        { key: 'Ctrl+Y', desc: 'Làm lại' },
        { key: 'Ctrl+A', desc: 'Chọn tất cả' },
        { key: 'Ctrl+C', desc: 'Sao chép' },
        { key: 'Ctrl+V', desc: 'Dán' },
        { key: 'Ctrl+X', desc: 'Cắt' }
    ];

    const renderFeatures = (features) => (
        <div>
            {features.map((feature, index) => (
                <div key={index} style={styles.feature}>
                    <div style={styles.featureIcon}>{feature.icon}</div>
                    <div style={styles.featureContent}>
                        <div style={styles.featureTitle}>{feature.title}</div>
                        <div style={styles.featureDesc}>{feature.desc}</div>
                        {feature.shortcuts && feature.shortcuts.length > 0 && (
                            <div style={{ marginTop: '6px' }}>
                                {feature.shortcuts.map(shortcut => (
                                    <span key={shortcut} style={styles.shortcut}>{shortcut}</span>
                                ))}
                            </div>
                        )}
                        {feature.example && (
                            <div style={styles.example}>
                                <div style={styles.exampleTitle}>Ví dụ:</div>
                                <div style={styles.exampleContent}>{feature.example}</div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <div style={styles.title}>
                        📚 Hướng dẫn sử dụng trình soạn thảo WYSIWYG
                    </div>
                    <button style={styles.closeButton} onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div style={styles.tabs}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            style={{
                                ...styles.tab,
                                ...(activeTab === tab.id ? styles.tabActive : styles.tabInactive)
                            }}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div style={styles.content}>
                    {activeTab === 'basic' && (
                        <div>
                            <div style={styles.sectionTitle}>
                                📝 Các tính năng cơ bản
                            </div>
                            {renderFeatures(basicFeatures)}
                        </div>
                    )}

                    {activeTab === 'chemistry' && (
                        <div>
                            <div style={styles.sectionTitle}>
                                ⚗️ Công cụ hóa học
                            </div>
                            {renderFeatures(chemistryFeatures)}
                            
                            <div style={styles.section}>
                                <div style={styles.sectionTitle}>
                                    🧪 Công thức phổ biến
                                </div>
                                <div style={styles.feature}>
                                    <div style={styles.featureContent}>
                                        <div style={styles.featureDesc}>
                                            Click vào các nút công thức bên dưới thanh công cụ để chèn nhanh: 
                                            H₂O, CO₂, H₂SO₄, CaCO₃, NaCl, NH₃, CH₄, Al₂O₃, Fe₂O₃, MgO, SiO₂
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'math' && (
                        <div>
                            <div style={styles.sectionTitle}>
                                🔢 Công cụ toán học
                            </div>
                            {renderFeatures(mathFeatures)}
                        </div>
                    )}

                    {activeTab === 'shortcuts' && (
                        <div>
                            <div style={styles.sectionTitle}>
                                ⌨️ Phím tắt hữu ích
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {shortcuts.map((shortcut, index) => (
                                    <div key={index} style={styles.feature}>
                                        <div style={styles.featureContent}>
                                            <div style={styles.featureTitle}>
                                                <span style={styles.shortcut}>{shortcut.key}</span>
                                            </div>
                                            <div style={styles.featureDesc}>{shortcut.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WysiwygUsageGuide;