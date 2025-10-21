import React, { useMemo, useRef, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'katex/dist/katex.min.css';
import MathFormulaEditor from './MathFormulaEditor';
import { registerCustomButtons } from '../utils/quillCustomizations';

// Import KaTeX for formula support
import katex from 'katex';
window.katex = katex;

const AdvancedRichTextEditor = ({ 
    value, 
    onChange, 
    placeholder = "Nhập nội dung...", 
    height = "150px",
    readOnly = false,
    showToolbar = true,
    theme = "snow"
}) => {
    const quillRef = useRef();
    const [showMathEditor, setShowMathEditor] = useState(false);

    // Custom toolbar configuration optimized for educational content
    const modules = useMemo(() => ({
        toolbar: showToolbar ? {
            container: [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                [{ 'direction': 'rtl' }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'font': [] }],
                [{ 'align': [] }],
                ['link', 'image', 'formula'],
                ['clean'],
                ['chemical-formula', 'math-formula'] // Custom buttons
            ],
            handlers: {
                'chemical-formula': function() {
                    insertChemicalFormula(this.quill);
                },
                'math-formula': function() {
                    setShowMathEditor(true);
                }
            }
        } : false,
        formula: {
            // KaTeX configuration
            katex: {
                throwOnError: false,
                errorColor: '#f00',
                displayMode: false
            }
        },
        keyboard: {
            bindings: {
                // Custom keyboard shortcuts
                'chemical-formula': {
                    key: 'F',
                    ctrlKey: true,
                    handler: function() {
                        insertChemicalFormula(this.quill);
                    }
                }
            }
        }
    }), [showToolbar]);

    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image', 'formula',
        'script', 'color', 'background',
        'align', 'direction', 'code-block'
    ];

    // Chemical formula insertion helper
    const insertChemicalFormula = (quill) => {
        const formula = prompt('Nhập công thức hóa học (ví dụ: H₂SO₄, CaCO₃):');
        if (formula) {
            const range = quill.getSelection();
            if (range) {
                // Insert as formatted text with chemistry styling
                quill.insertText(range.index, formula, {
                    'font': 'monospace',
                    'color': '#2563eb',
                    'background': '#f0f9ff'
                });
                quill.setSelection(range.index + formula.length);
            }
        }
    };

    // Custom styles for the editor
    const editorStyles = {
        '.ql-editor': {
            minHeight: height,
            fontSize: '14px',
            lineHeight: '1.6',
            fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif"
        },
        '.ql-toolbar': {
            borderTop: '1px solid #e2e8f0',
            borderLeft: '1px solid #e2e8f0',
            borderRight: '1px solid #e2e8f0',
            borderBottom: 'none',
            borderRadius: '8px 8px 0 0',
            backgroundColor: '#f8fafc'
        },
        '.ql-container': {
            borderBottom: '1px solid #e2e8f0',
            borderLeft: '1px solid #e2e8f0',
            borderRight: '1px solid #e2e8f0',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            fontSize: '14px'
        },
        '.ql-editor.ql-blank::before': {
            fontStyle: 'italic',
            color: '#9ca3af',
            fontSize: '14px'
        }
    };

    // Quick insert buttons for common chemistry symbols
    const chemicalSymbols = [
        'H₂O', 'CO₂', 'O₂', 'H₂', 'N₂', 'NH₃', 'CH₄', 'H₂SO₄', 
        'CaCO₃', 'NaCl', 'Al₂O₃', 'Fe₂O₃', 'MgO', 'SiO₂'
    ];

    const insertSymbol = (symbol) => {
        const quill = quillRef.current?.getEditor();
        if (quill) {
            const range = quill.getSelection();
            if (range) {
                quill.insertText(range.index, symbol, {
                    'font': 'monospace',
                    'color': '#2563eb',
                    'background': '#f0f9ff'
                });
                quill.setSelection(range.index + symbol.length);
            }
        }
    };

    // Math formula insertion helper
    const insertMathFormula = (latex) => {
        const quill = quillRef.current?.getEditor();
        if (quill) {
            const range = quill.getSelection();
            if (range) {
                quill.insertEmbed(range.index, 'formula', latex);
                quill.setSelection(range.index + 1);
            }
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <style>
                {Object.entries(editorStyles).map(([selector, styles]) => 
                    `${selector} { ${Object.entries(styles).map(([prop, value]) => 
                        `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`
                    ).join(' ')} }`
                ).join('\n')}
            </style>
            
            <ReactQuill
                ref={quillRef}
                theme={theme}
                value={value || ''}
                onChange={onChange}
                readOnly={readOnly}
                placeholder={placeholder}
                modules={modules}
                formats={formats}
                style={{
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderRadius: '8px'
                }}
            />

            {/* Quick Chemistry Symbols Panel */}
            {showToolbar && (
                <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '6px'
                    }}>
                        Công thức hóa học phổ biến:
                    </div>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px'
                    }}>
                        {chemicalSymbols.map(symbol => (
                            <button
                                key={symbol}
                                type="button"
                                onClick={() => insertSymbol(symbol)}
                                style={{
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    color: '#2563eb',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.backgroundColor = '#f0f9ff';
                                    e.target.style.borderColor = '#2563eb';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.backgroundColor = '#ffffff';
                                    e.target.style.borderColor = '#d1d5db';
                                }}
                            >
                                {symbol}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Usage Tips */}
            <div style={{
                marginTop: '6px',
                fontSize: '11px',
                color: '#64748b',
                fontStyle: 'italic'
            }}>
                💡 Mẹo: Sử dụng Ctrl+F để chèn công thức hóa học, hoặc click vào nút công thức toán học cho LaTeX
            </div>

            {/* Math Formula Editor Modal */}
            {showMathEditor && (
                <MathFormulaEditor
                    onInsert={insertMathFormula}
                    onClose={() => setShowMathEditor(false)}
                />
            )}
        </div>
    );
};

export default AdvancedRichTextEditor;