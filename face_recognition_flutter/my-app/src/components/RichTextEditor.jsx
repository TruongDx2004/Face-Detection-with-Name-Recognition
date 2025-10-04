import React, { useRef, useEffect, useState } from 'react';

const RichTextEditor = ({ value, onChange, placeholder = "Nhập nội dung...", height = "150px" }) => {
    const editorRef = useRef(null);
    const [selectedText, setSelectedText] = useState('');

    // Chemistry symbols and common subscripts/superscripts
    const chemicalSymbols = [
        { symbol: 'H₂O', display: 'H₂O' },
        { symbol: 'CO₂', display: 'CO₂' },
        { symbol: 'NaCl', display: 'NaCl' },
        { symbol: 'H₂SO₄', display: 'H₂SO₄' },
        { symbol: 'CaCO₃', display: 'CaCO₃' },
        { symbol: 'NH₃', display: 'NH₃' },
        { symbol: 'CH₄', display: 'CH₄' },
        { symbol: 'O₂', display: 'O₂' },
        { symbol: 'N₂', display: 'N₂' },
        { symbol: 'H₂', display: 'H₂' },
        { symbol: 'Al₂O₃', display: 'Al₂O₃' },
        { symbol: 'Fe₂O₃', display: 'Fe₂O₃' }
    ];

    const subscriptNumbers = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
    const superscriptNumbers = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current && onChange) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current.focus();
        handleInput();
    };

    const insertText = (text) => {
        if (document.selection) {
            // IE
            editorRef.current.focus();
            const sel = document.selection.createRange();
            sel.text = text;
        } else if (editorRef.current.selectionStart || editorRef.current.selectionStart === 0) {
            // Firefox/Chrome
            const startPos = editorRef.current.selectionStart;
            const endPos = editorRef.current.selectionEnd;
            editorRef.current.value = editorRef.current.value.substring(0, startPos) + text + editorRef.current.value.substring(endPos, editorRef.current.value.length);
            editorRef.current.selectionStart = startPos + text.length;
            editorRef.current.selectionEnd = startPos + text.length;
        } else {
            editorRef.current.innerHTML += text;
        }
        handleInput();
    };

    const insertChemicalSymbol = (symbol) => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            span.innerHTML = symbol;
            span.style.fontFamily = 'monospace';
            span.style.color = '#2563eb';
            range.deleteContents();
            range.insertNode(span);
            range.setStartAfter(span);
            range.setEndAfter(span);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            const span = document.createElement('span');
            span.innerHTML = symbol;
            span.style.fontFamily = 'monospace';
            span.style.color = '#2563eb';
            editorRef.current.appendChild(span);
        }
        handleInput();
    };

    const handleKeyDown = (e) => {
        // Save state for undo
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    execCommand('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    execCommand('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    execCommand('underline');
                    break;
                case 'z':
                    e.preventDefault();
                    execCommand('undo');
                    break;
                case 'y':
                    e.preventDefault();
                    execCommand('redo');
                    break;
            }
        }
    };

    const styles = {
        container: {
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            fontFamily: 'Arial, sans-serif'
        },
        toolbar: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            padding: '8px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
        },
        toolbarGroup: {
            display: 'flex',
            gap: '2px',
            alignItems: 'center',
            marginRight: '8px',
            paddingRight: '8px',
            borderRight: '1px solid #e5e7eb'
        },
        toolbarButton: {
            padding: '6px 8px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151',
            transition: 'all 0.2s',
            minWidth: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        toolbarButtonActive: {
            backgroundColor: '#dbeafe',
            color: '#2563eb'
        },
        editor: {
            minHeight: height,
            padding: '12px',
            outline: 'none',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#374151',
            overflow: 'auto'
        },
        chemicalPalette: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            marginTop: '4px',
            padding: '8px',
            backgroundColor: '#f0f9ff',
            borderRadius: '6px',
            border: '1px solid #bae6fd'
        },
        chemicalButton: {
            padding: '4px 8px',
            border: '1px solid #93c5fd',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#1e40af',
            transition: 'all 0.2s'
        },
        subscriptPanel: {
            display: 'flex',
            gap: '2px',
            alignItems: 'center'
        },
        numberButton: {
            padding: '2px 6px',
            border: '1px solid #d1d5db',
            borderRadius: '3px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontSize: '12px',
            minWidth: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }
    };

    return (
        <div style={styles.container}>
            {/* Toolbar */}
            <div style={styles.toolbar}>
                {/* Basic formatting */}
                <div style={styles.toolbarGroup}>
                    <button
                        type="button"
                        style={styles.toolbarButton}
                        onClick={() => execCommand('bold')}
                        title="Đậm (Ctrl+B)"
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        type="button"
                        style={styles.toolbarButton}
                        onClick={() => execCommand('italic')}
                        title="Nghiêng (Ctrl+I)"
                    >
                        <em>I</em>
                    </button>
                    <button
                        type="button"
                        style={styles.toolbarButton}
                        onClick={() => execCommand('underline')}
                        title="Gạch chân (Ctrl+U)"
                    >
                        <u>U</u>
                    </button>
                </div>

                {/* Subscript/Superscript */}
                <div style={styles.toolbarGroup}>
                    <button
                        type="button"
                        style={styles.toolbarButton}
                        onClick={() => execCommand('subscript')}
                        title="Chỉ số dưới"
                    >
                        X<sub>2</sub>
                    </button>
                    <button
                        type="button"
                        style={styles.toolbarButton}
                        onClick={() => execCommand('superscript')}
                        title="Chỉ số trên"
                    >
                        X<sup>2</sup>
                    </button>
                </div>

                {/* Quick subscript numbers */}
                <div style={styles.toolbarGroup}>
                    <span style={{ fontSize: '12px', color: '#6b7280', marginRight: '4px' }}>Chỉ số dưới:</span>
                    {subscriptNumbers.map((num, index) => (
                        <button
                            key={index}
                            type="button"
                            style={styles.numberButton}
                            onClick={() => insertText(num)}
                            title={`Chỉ số dưới ${index}`}
                        >
                            {num}
                        </button>
                    ))}
                </div>

                {/* Quick superscript numbers */}
                <div style={styles.toolbarGroup}>
                    <span style={{ fontSize: '12px', color: '#6b7280', marginRight: '4px' }}>Chỉ số trên:</span>
                    {superscriptNumbers.map((num, index) => (
                        <button
                            key={index}
                            type="button"
                            style={styles.numberButton}
                            onClick={() => insertText(num)}
                            title={`Chỉ số trên ${index}`}
                        >
                            {num}
                        </button>
                    ))}
                </div>

                {/* Undo/Redo */}
                <div style={styles.toolbarGroup}>
                    <button
                        type="button"
                        style={styles.toolbarButton}
                        onClick={() => execCommand('undo')}
                        title="Hoàn tác (Ctrl+Z)"
                    >
                        ↶
                    </button>
                    <button
                        type="button"
                        style={styles.toolbarButton}
                        onClick={() => execCommand('redo')}
                        title="Làm lại (Ctrl+Y)"
                    >
                        ↷
                    </button>
                </div>
            </div>

            {/* Chemical symbols palette */}
            <div style={styles.chemicalPalette}>
                <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '500', marginRight: '8px' }}>
                    Công thức hóa học:
                </span>
                {chemicalSymbols.map((item, index) => (
                    <button
                        key={index}
                        type="button"
                        style={{
                            ...styles.chemicalButton,
                            ':hover': { backgroundColor: '#dbeafe' }
                        }}
                        onClick={() => insertChemicalSymbol(item.symbol)}
                        title={`Chèn ${item.display}`}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#dbeafe'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
                    >
                        {item.display}
                    </button>
                ))}
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                style={styles.editor}
                contentEditable
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                suppressContentEditableWarning={true}
                data-placeholder={placeholder}
            />

            <style>
                {`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    font-style: italic;
                }
                [contenteditable]:focus {
                    outline: none;
                }
                `}
            </style>
        </div>
    );
};

export default RichTextEditor;