import React, { useState } from 'react';
import AdvancedRichTextEditor from './AdvancedRichTextEditor';
import QuestionEditor from './QuestionEditor';
import WysiwygUsageGuide from './WysiwygUsageGuide';

const WysiwygDemo = () => {
    const [demoContent, setDemoContent] = useState(`
        <h2>Ví dụ về câu hỏi hóa học</h2>
        <p>Phương trình hóa học của phản ứng giữa <strong>axit sulfuric</strong> và <strong>natri hidroxit</strong>:</p>
        <p style="font-family: monospace; color: #2563eb; background: #f0f9ff;">H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O</p>
        <p>Trong phản ứng này:</p>
        <ul>
            <li>H₂SO₄ là <em>axit mạnh</em></li>
            <li>NaOH là <em>bazơ mạnh</em></li>
            <li>Sản phẩm là <strong>muối</strong> và <strong>nước</strong></li>
        </ul>
    `);

    const [sampleQuestions, setSampleQuestions] = useState([
        {
            id: 1,
            question_text: `
                <p>Cho phương trình hóa học sau:</p>
                <p style="font-family: monospace; color: #2563eb; background: #f0f9ff;">
                    CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂
                </p>
                <p>Khối lượng <strong>CO₂</strong> thu được khi cho <u>50g CaCO₃</u> tác dụng với HCl dư là:</p>
            `,
            question_type: 'multiple_choice',
            points: 2.5,
            correct_answer: '22g',
            options: ['11g', '22g', '33g', '44g'],
            explanation: `
                <p><strong>Giải:</strong></p>
                <p>Khối lượng mol: M<sub>CaCO₃</sub> = 100 g/mol, M<sub>CO₂</sub> = 44 g/mol</p>
                <p>Số mol CaCO₃: n = 50/100 = 0.5 mol</p>
                <p>Theo phương trình: n<sub>CO₂</sub> = n<sub>CaCO₃</sub> = 0.5 mol</p>
                <p>Khối lượng CO₂: m = 0.5 × 44 = <strong>22g</strong></p>
            `
        },
        {
            id: 2,
            question_text: `
                <p>Ion nào sau đây có <strong>cấu hình electron</strong> giống với khí hiếm <em>Neon</em>?</p>
                <p><em>Biết: Na (Z=11), Mg (Z=12), Al (Z=13), Cl (Z=17)</em></p>
            `,
            question_type: 'multiple_choice',
            points: 2.5,
            correct_answer: 'Na⁺, Mg²⁺, Al³⁺',
            options: ['Na⁺, Cl⁻', 'Na⁺, Mg²⁺, Al³⁺', 'Mg²⁺, Cl⁻', 'Al³⁺, Cl⁻'],
            explanation: `
                <p><strong>Giải thích:</strong></p>
                <p>Neon có cấu hình: 1s² 2s² 2p⁶ (10 electron)</p>
                <ul>
                    <li>Na⁺: 11 - 1 = 10 electron → 1s² 2s² 2p⁶ ✓</li>
                    <li>Mg²⁺: 12 - 2 = 10 electron → 1s² 2s² 2p⁶ ✓</li>
                    <li>Al³⁺: 13 - 3 = 10 electron → 1s² 2s² 2p⁶ ✓</li>
                    <li>Cl⁻: 17 + 1 = 18 electron → giống Argon</li>
                </ul>
            `
        }
    ]);

    const [showGuide, setShowGuide] = useState(false);
    const [activeDemo, setActiveDemo] = useState('editor');

    const updateSampleQuestion = (index, field, value) => {
        setSampleQuestions(prev => prev.map((q, i) =>
            i === index ? { ...q, [field]: value } : q
        ));
    };

    const styles = {
        container: {
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px'
        },
        header: {
            textAlign: 'center',
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
        },
        title: {
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '8px'
        },
        subtitle: {
            fontSize: '16px',
            color: '#64748b',
            marginBottom: '16px'
        },
        tabs: {
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            justifyContent: 'center'
        },
        tab: {
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
        },
        tabActive: {
            backgroundColor: '#3b82f6',
            color: '#ffffff'
        },
        tabInactive: {
            backgroundColor: '#f1f5f9',
            color: '#374151',
            border: '1px solid #e2e8f0'
        },
        section: {
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        },
        sectionTitle: {
            fontSize: '18px',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        button: {
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
        },
        buttonPrimary: {
            backgroundColor: '#3b82f6',
            color: '#ffffff'
        },
        buttonSecondary: {
            backgroundColor: '#f1f5f9',
            color: '#374151',
            border: '1px solid #e2e8f0'
        },
        preview: {
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '16px'
        },
        previewTitle: {
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
        },
        comparison: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginTop: '20px'
        },
        comparisonItem: {
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px'
        },
        comparisonTitle: {
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px',
            textAlign: 'center'
        },
        feature: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
            fontSize: '13px',
            color: '#64748b'
        },
        featureIcon: {
            color: '#10b981'
        },
        oldFeatureIcon: {
            color: '#ef4444'
        }
    };

    const tabs = [
        { id: 'editor', label: 'Trình soạn thảo', icon: '📝' },
        { id: 'questions', label: 'Câu hỏi mẫu', icon: '❓' },
        { id: 'comparison', label: 'So sánh', icon: '⚖️' }
    ];

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.title}>
                    🚀 Demo WYSIWYG Editor Nâng Cao
                </div>
                <div style={styles.subtitle}>
                    Trình soạn thảo chuyên nghiệp cho câu hỏi trắc nghiệm với hỗ trợ công thức hóa học và toán học
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                        style={{ ...styles.button, ...styles.buttonPrimary }}
                        onClick={() => setShowGuide(true)}
                    >
                        📚 Hướng dẫn sử dụng
                    </button>
                    <button
                        style={{ ...styles.button, ...styles.buttonSecondary }}
                        onClick={() => window.open('/teacher/exam-form-advanced', '_blank')}
                    >
                        🔗 Thử nghiệm thực tế
                    </button>
                </div>
            </div>

            <div style={styles.tabs}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        style={{
                            ...styles.tab,
                            ...(activeDemo === tab.id ? styles.tabActive : styles.tabInactive)
                        }}
                        onClick={() => setActiveDemo(tab.id)}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {activeDemo === 'editor' && (
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>
                        📝 Trình soạn thảo WYSIWYG
                    </div>
                    <AdvancedRichTextEditor
                        value={demoContent}
                        onChange={setDemoContent}
                        placeholder="Thử nghiệm các tính năng của trình soạn thảo..."
                        height="200px"
                    />
                    
                    <div style={styles.preview}>
                        <div style={styles.previewTitle}>🔍 Xem trước kết quả:</div>
                        <div dangerouslySetInnerHTML={{ __html: demoContent }} />
                    </div>
                </div>
            )}

            {activeDemo === 'questions' && (
                <div>
                    {sampleQuestions.map((question, index) => (
                        <QuestionEditor
                            key={question.id}
                            question={question}
                            questionIndex={index}
                            onQuestionUpdate={updateSampleQuestion}
                            onDeleteQuestion={() => {}}
                            canDelete={false}
                        />
                    ))}
                </div>
            )}

            {activeDemo === 'comparison' && (
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>
                        ⚖️ So sánh: Cũ vs Mới
                    </div>
                    
                    <div style={styles.comparison}>
                        <div style={styles.comparisonItem}>
                            <div style={styles.comparisonTitle}>
                                ❌ Trình soạn thảo cũ (Manual)
                            </div>
                            <div style={styles.feature}>
                                <span style={styles.oldFeatureIcon}>✗</span>
                                Định dạng thủ công phức tạp
                            </div>
                            <div style={styles.feature}>
                                <span style={styles.oldFeatureIcon}>✗</span>
                                Khó chèn công thức hóa học
                            </div>
                            <div style={styles.feature}>
                                <span style={styles.oldFeatureIcon}>✗</span>
                                Không có preview trực tiếp
                            </div>
                            <div style={styles.feature}>
                                <span style={styles.oldFeatureIcon}>✗</span>
                                Thiếu các công cụ hỗ trợ
                            </div>
                            <div style={styles.feature}>
                                <span style={styles.oldFeatureIcon}>✗</span>
                                Giao diện đơn giản
                            </div>
                        </div>

                        <div style={styles.comparisonItem}>
                            <div style={styles.comparisonTitle}>
                                ✅ WYSIWYG Editor Mới
                            </div>
                            <div style={styles.feature}>
                                <span style={styles.featureIcon}>✓</span>
                                Định dạng trực quan WYSIWYG
                            </div>
                            <div style={styles.feature}>
                                <span style={styles.featureIcon}>✓</span>
                                Nút công thức hóa học có sẵn
                            </div>
                            <div style={styles.feature}>
                                <span style={styles.featureIcon}>✓</span>
                                Preview thời gian thực
                            </div>
                            <div style={styles.feature}>
                                <span style={styles.featureIcon}>✓</span>
                                Thanh công cụ đầy đủ
                            </div>
                            <div style={styles.feature}>
                                <span style={styles.featureIcon}>✓</span>
                                Giao diện chuyên nghiệp
                            </div>
                            <div style={styles.feature}>
                                <span style={styles.featureIcon}>✓</span>
                                Hỗ trợ phím tắt
                            </div>
                            <div style={styles.feature}>
                                <span style={styles.featureIcon}>✓</span>
                                Tích hợp ReactQuill
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #16a34a', borderRadius: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#15803d', marginBottom: '8px' }}>
                            🎯 Lợi ích chính:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '20px', color: '#166534' }}>
                            <li>Tiết kiệm thời gian soạn thảo đáng kể</li>
                            <li>Giảm lỗi định dạng và hiển thị</li>
                            <li>Cải thiện chất lượng câu hỏi</li>
                            <li>Tăng hiệu quả làm việc của giáo viên</li>
                            <li>Hỗ trợ tốt hơn cho môn hóa học và toán học</li>
                        </ul>
                    </div>
                </div>
            )}

            {showGuide && (
                <WysiwygUsageGuide onClose={() => setShowGuide(false)} />
            )}
        </div>
    );
};

export default WysiwygDemo;