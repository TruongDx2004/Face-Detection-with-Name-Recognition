import React, { useRef, useEffect } from 'react';

const RichTextInput = ({ value, onChange, placeholder = "Nhập nội dung...", onClick, style = {} }) => {
    const editorRef = useRef(null);

    // Chemistry symbols for quick access
    const quickSymbols = ['H₂O', 'CO₂', 'O₂', 'H₂', 'N₂', 'NH₃', 'CH₄', 'H₂SO₄'];

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

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    };

    const insertSymbol = (symbol, e) => {
        e.stopPropagation();
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
        editorRef.current.focus();
    };

    const execCommand = (command, e) => {
        e.stopPropagation();
        document.execCommand(command, false, null);
        editorRef.current.focus();
        handleInput();
    };

    const handleKeyDown = (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    execCommand('bold', e);
                    break;
                case 'i':
                    e.preventDefault();
                    execCommand('italic', e);
                    break;
                case 'u':
                    e.preventDefault();
                    execCommand('underline', e);
                    break;
            }
        }
    };

    const defaultStyle = {
        position: 'relative',
        width: '100%',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        backgroundColor: '#ffffff',
        cursor: 'text',
        ...style
    };

    const toolbarStyle = {
        display: 'flex',
        gap: '4px',
        padding: '4px 8px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        borderRadius: '6px 6px 0 0',
        flexWrap: 'wrap',
        alignItems: 'center'
    };

    const buttonStyle = {
        padding: '2px 6px',
        border: 'none',
        borderRadius: '3px',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontSize: '12px',
        color: '#374151',
        minWidth: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    const symbolButtonStyle = {
        padding: '2px 4px',
        border: '1px solid #bae6fd',
        borderRadius: '3px',
        backgroundColor: '#ffffff',
        cursor: 'pointer',
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#1e40af',
        marginLeft: '2px'
    };

    const editorStyle = {
        minHeight: '32px',
        maxHeight: '80px',
        padding: '8px',
        outline: 'none',
        fontSize: '14px',
        lineHeight: '1.4',
        color: '#374151',
        overflow: 'auto'
    };

    return (
        <div style={defaultStyle} onClick={handleClick}>
            {/* Mini toolbar */}
            <div style={toolbarStyle}>
                <button
                    type="button"
                    style={buttonStyle}
                    onClick={(e) => execCommand('bold', e)}
                    title="Đậm (Ctrl+B)"
                >
                    <strong>B</strong>
                </button>
                <button
                    type="button"
                    style={buttonStyle}
                    onClick={(e) => execCommand('italic', e)}
                    title="Nghiêng (Ctrl+I)"
                >
                    <em>I</em>
                </button>
                <button
                    type="button"
                    style={buttonStyle}
                    onClick={(e) => execCommand('subscript', e)}
                    title="Chỉ số dưới"
                >
                    X₂
                </button>
                <button
                    type="button"
                    style={buttonStyle}
                    onClick={(e) => execCommand('superscript', e)}
                    title="Chỉ số trên"
                >
                    X²
                </button>
                
                <div style={{ width: '1px', height: '16px', backgroundColor: '#d1d5db', margin: '0 4px' }} />
                
                {quickSymbols.map((symbol, index) => (
                    <button
                        key={index}
                        type="button"
                        style={symbolButtonStyle}
                        onClick={(e) => insertSymbol(symbol, e)}
                        title={`Chèn ${symbol}`}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#dbeafe'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
                    >
                        {symbol}
                    </button>
                ))}
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                style={editorStyle}
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

export default RichTextInput;