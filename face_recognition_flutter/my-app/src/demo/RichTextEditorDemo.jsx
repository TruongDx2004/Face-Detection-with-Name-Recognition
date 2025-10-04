import React, { useState } from 'react';
import RichTextEditor from '../components/RichTextEditor';
import RichTextInput from '../components/RichTextInput';

const RichTextEditorDemo = () => {
    const [questionContent, setQuestionContent] = useState('');
    const [answerA, setAnswerA] = useState('');
    const [answerB, setAnswerB] = useState('');
    const [answerC, setAnswerC] = useState('');
    const [answerD, setAnswerD] = useState('');

    const demoStyle = {
        maxWidth: '1000px',
        margin: '20px auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
    };

    const sectionStyle = {
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '8px'
    };

    const previewStyle = {
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        padding: '12px',
        marginTop: '10px',
        fontSize: '14px'
    };

    return (
        <div style={demoStyle}>
            <h1>Demo Rich Text Editor cho ExamForm</h1>
            <p>Thử nghiệm các tính năng định dạng văn bản và công thức hóa học:</p>

            <div style={sectionStyle}>
                <h3>Nhập nội dung câu hỏi</h3>
                <label style={labelStyle}>Nội dung câu hỏi (RichTextEditor)</label>
                <RichTextEditor
                    value={questionContent}
                    onChange={setQuestionContent}
                    placeholder="Nhập câu hỏi hóa học - Ví dụ: Phản ứng giữa H₂SO₄ và NaOH tạo ra sản phẩm gì?"
                    height="150px"
                />
                
                {questionContent && (
                    <div style={previewStyle}>
                        <strong>Preview:</strong>
                        <div dangerouslySetInnerHTML={{ __html: questionContent }} />
                    </div>
                )}
            </div>

            <div style={sectionStyle}>
                <h3>Nhập các đáp án (RichTextInput)</h3>
                
                <div style={{ marginBottom: '15px' }}>
                    <label style={labelStyle}>Đáp án A</label>
                    <RichTextInput
                        value={answerA}
                        onChange={setAnswerA}
                        placeholder="Đáp án A - Ví dụ: Na₂SO₄ + H₂O"
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={labelStyle}>Đáp án B</label>
                    <RichTextInput
                        value={answerB}
                        onChange={setAnswerB}
                        placeholder="Đáp án B - Ví dụ: NaCl + H₂O"
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={labelStyle}>Đáp án C</label>
                    <RichTextInput
                        value={answerC}
                        onChange={setAnswerC}
                        placeholder="Đáp án C - Ví dụ: CO₂ + H₂O"
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={labelStyle}>Đáp án D</label>
                    <RichTextInput
                        value={answerD}
                        onChange={setAnswerD}
                        placeholder="Đáp án D - Ví dụ: NH₃ + H₂O"
                    />
                </div>
            </div>

            <div style={sectionStyle}>
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li><strong>Định dạng văn bản:</strong> Sử dụng các nút B (đậm), I (nghiêng), U (gạch chân)</li>
                    <li><strong>Chỉ số:</strong> Sử dụng nút X₂ (chỉ số dưới) và X² (chỉ số trên)</li>
                    <li><strong>Công thức hóa học:</strong> Click vào các công thức có sẵn để chèn nhanh</li>
                    <li><strong>Chỉ số nhanh:</strong> Click vào các số chỉ số dưới (₀₁₂₃...) hoặc chỉ số trên (⁰¹²³...)</li>
                    <li><strong>Phím tắt:</strong> Ctrl+B (đậm), Ctrl+I (nghiêng), Ctrl+U (gạch chân), Ctrl+Z (hoàn tác)</li>
                </ul>

                <h4>Ví dụ công thức hóa học phổ biến:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {['H₂O', 'CO₂', 'H₂SO₄', 'CaCO₃', 'NaCl', 'NH₃', 'CH₄', 'O₂', 'N₂', 'H₂', 'Al₂O₃', 'Fe₂O₃'].map(formula => (
                        <span key={formula} style={{
                            padding: '4px 8px',
                            backgroundColor: '#e0f2fe',
                            border: '1px solid #0284c7',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            color: '#0369a1'
                        }}>
                            {formula}
                        </span>
                    ))}
                </div>
            </div>

            {(questionContent || answerA || answerB || answerC || answerD) && (
                <div style={sectionStyle}>
                    <h3>Kết quả cuối cùng</h3>
                    <div style={previewStyle}>
                        <strong>Câu hỏi:</strong>
                        <div dangerouslySetInnerHTML={{ __html: questionContent || 'Chưa nhập' }} />
                        
                        <br />
                        <strong>Các đáp án:</strong>
                        <div>A. <span dangerouslySetInnerHTML={{ __html: answerA || 'Chưa nhập' }} /></div>
                        <div>B. <span dangerouslySetInnerHTML={{ __html: answerB || 'Chưa nhập' }} /></div>
                        <div>C. <span dangerouslySetInnerHTML={{ __html: answerC || 'Chưa nhập' }} /></div>
                        <div>D. <span dangerouslySetInnerHTML={{ __html: answerD || 'Chưa nhập' }} /></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RichTextEditorDemo;