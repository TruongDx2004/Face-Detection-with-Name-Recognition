import React, { useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const MathFormulaEditor = ({ onInsert, onClose }) => {
    const [formula, setFormula] = useState('');
    const [preview, setPreview] = useState('');
    const [error, setError] = useState('');

    const updatePreview = (latex) => {
        try {
            const html = katex.renderToString(latex, {
                throwOnError: false,
                errorColor: '#f00',
                displayMode: false
            });
            setPreview(html);
            setError('');
        } catch (err) {
            setError(err.message);
            setPreview('');
        }
    };

    const handleFormulaChange = (value) => {
        setFormula(value);
        updatePreview(value);
    };

    const insertFormula = () => {
        if (formula.trim()) {
            onInsert(formula);
            onClose();
        }
    };

    const commonFormulas = [
        { name: 'Phân số', latex: '\\frac{a}{b}' },
        { name: 'Căn bậc hai', latex: '\\sqrt{x}' },
        { name: 'Căn bậc n', latex: '\\sqrt[n]{x}' },
        { name: 'Lũy thừa', latex: 'x^{n}' },
        { name: 'Chỉ số dưới', latex: 'x_{n}' },
        { name: 'Tích phân', latex: '\\int_{a}^{b} f(x) dx' },
        { name: 'Tổng', latex: '\\sum_{i=1}^{n} a_i' },
        { name: 'Giới hạn', latex: '\\lim_{x \\to \\infty} f(x)' },
        { name: 'Ma trận', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
        { name: 'Phương trình', latex: 'ax^2 + bx + c = 0' }
    ];

    const chemistryFormulas = [
        { name: 'Phân tử nước', latex: 'H_2O' },
        { name: 'Carbon dioxide', latex: 'CO_2' },
        { name: 'Axit sulfuric', latex: 'H_2SO_4' },
        { name: 'Canxi carbonate', latex: 'CaCO_3' },
        { name: 'Ion dương', latex: 'Ca^{2+}' },
        { name: 'Ion âm', latex: 'SO_4^{2-}' },
        { name: 'Phản ứng', latex: 'A + B \\rightarrow C + D' },
        { name: 'Cân bằng', latex: 'A + B \\rightleftharpoons C + D' }
    ];

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
            maxWidth: '700px',
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
        content: {
            padding: '24px',
            maxHeight: '60vh',
            overflowY: 'auto'
        },
        section: {
            marginBottom: '24px'
        },
        sectionTitle: {
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px'
        },
        input: {
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            fontFamily: 'monospace',
            marginBottom: '12px'
        },
        preview: {
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '16px',
            minHeight: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            marginBottom: '16px'
        },
        error: {
            color: '#ef4444',
            fontSize: '12px',
            marginBottom: '12px'
        },
        formulaGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '8px',
            marginBottom: '16px'
        },
        formulaButton: {
            padding: '8px 12px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            textAlign: 'center',
            transition: 'all 0.2s ease'
        },
        buttons: {
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            paddingTop: '16px',
            borderTop: '1px solid #e2e8f0'
        },
        button: {
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
        },
        buttonPrimary: {
            backgroundColor: '#3b82f6',
            color: '#ffffff'
        },
        buttonSecondary: {
            backgroundColor: '#f1f5f9',
            color: '#374151',
            border: '1px solid #e2e8f0'
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <div style={styles.title}>
                        📐 Trình soạn công thức toán học
                    </div>
                    <button style={styles.closeButton} onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div style={styles.content}>
                    <div style={styles.section}>
                        <div style={styles.sectionTitle}>Nhập công thức LaTeX:</div>
                        <input
                            type="text"
                            style={styles.input}
                            value={formula}
                            onChange={(e) => handleFormulaChange(e.target.value)}
                            placeholder="Ví dụ: x^2 + y^2 = z^2"
                            autoFocus
                        />
                        {error && <div style={styles.error}>{error}</div>}
                        
                        <div style={styles.sectionTitle}>Xem trước:</div>
                        <div style={styles.preview}>
                            {preview ? (
                                <div dangerouslySetInnerHTML={{ __html: preview }} />
                            ) : (
                                <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                                    Nhập công thức để xem trước
                                </span>
                            )}
                        </div>
                    </div>

                    <div style={styles.section}>
                        <div style={styles.sectionTitle}>Công thức toán học phổ biến:</div>
                        <div style={styles.formulaGrid}>
                            {commonFormulas.map((item, index) => (
                                <button
                                    key={index}
                                    style={styles.formulaButton}
                                    onClick={() => handleFormulaChange(item.latex)}
                                    onMouseOver={(e) => {
                                        e.target.style.backgroundColor = '#e2e8f0';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.backgroundColor = '#f1f5f9';
                                    }}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={styles.section}>
                        <div style={styles.sectionTitle}>Công thức hóa học:</div>
                        <div style={styles.formulaGrid}>
                            {chemistryFormulas.map((item, index) => (
                                <button
                                    key={index}
                                    style={styles.formulaButton}
                                    onClick={() => handleFormulaChange(item.latex)}
                                    onMouseOver={(e) => {
                                        e.target.style.backgroundColor = '#e2e8f0';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.backgroundColor = '#f1f5f9';
                                    }}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={styles.buttons}>
                        <button
                            style={{ ...styles.button, ...styles.buttonSecondary }}
                            onClick={onClose}
                        >
                            Hủy
                        </button>
                        <button
                            style={{ ...styles.button, ...styles.buttonPrimary }}
                            onClick={insertFormula}
                            disabled={!formula.trim()}
                        >
                            Chèn công thức
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MathFormulaEditor;