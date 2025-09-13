import React, { useState } from 'react';
import mammoth from 'mammoth';

const styles = {
    importSection: {
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
    },
    uploadArea: {
        border: '2px dashed #cbd5e0',
        borderRadius: '8px',
        padding: '40px 20px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    uploadAreaHover: {
        borderColor: '#3b82f6',
        backgroundColor: '#f0f9ff'
    },
    uploadIcon: {
        fontSize: '48px',
        color: '#64748b',
        marginBottom: '16px'
    },
    uploadText: {
        fontSize: '16px',
        color: '#374151',
        marginBottom: '8px',
        fontWeight: '500'
    },
    uploadSubtext: {
        fontSize: '14px',
        color: '#64748b'
    },
    fileInput: {
        display: 'none'
    },
    button: {
        padding: '10px 20px',
        borderRadius: '6px',
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
    previewSection: {
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px'
    },
    questionPreview: {
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: '#f8fafc',
        borderRadius: '6px',
        border: '1px solid #e2e8f0'
    },
    questionText: {
        fontWeight: '500',
        marginBottom: '8px',
        color: '#374151'
    },
    optionsList: {
        listStyle: 'none',
        padding: 0,
        margin: 0
    },
    optionItem: {
        padding: '4px 0',
        fontSize: '14px',
        color: '#4b5563'
    },
    correctOption: {
        fontWeight: '600',
        color: '#059669',
        backgroundColor: '#d1fae5',
        padding: '2px 6px',
        borderRadius: '4px'
    },
    errorMessage: {
        color: '#ef4444',
        fontSize: '14px',
        padding: '12px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '6px',
        marginTop: '12px'
    },
    instructionsBox: {
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '6px',
        padding: '16px',
        marginBottom: '20px'
    },
    instructionTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1e40af',
        marginBottom: '12px'
    },
    instructionText: {
        fontSize: '14px',
        color: '#1e40af',
        lineHeight: '1.5',
        marginBottom: '8px'
    },
    exampleBox: {
        backgroundColor: '#f9fafb',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        padding: '12px',
        fontSize: '13px',
        fontFamily: 'monospace',
        marginTop: '8px'
    }
};

const WordQuestionImporter = ({ onQuestionsImported, onClose }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewQuestions, setPreviewQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dragOver, setDragOver] = useState(false);

    const handleFileSelect = (file) => {
        if (!file) return;
        
        if (!file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.doc')) {
            setError('Vui lòng chọn file Word (.doc hoặc .docx)');
            return;
        }

        setSelectedFile(file);
        setError('');
        parseWordFile(file);
    };

    const parseWordFile = async (file) => {
        setLoading(true);
        try {
            const arrayBuffer = await readFileAsArrayBuffer(file);
            
            // Extract HTML to preserve formatting like bold text
            const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
            const htmlContent = htmlResult.value;
            
            // Also extract plain text for fallback
            const textResult = await mammoth.extractRawText({ arrayBuffer });
            const plainText = textResult.value;
            
            if (htmlResult.messages && htmlResult.messages.length > 0) {
                console.warn('Mammoth parsing warnings:', htmlResult.messages);
            }
            
            const questions = parseQuestionsFromHTML(htmlContent, plainText);
            if (questions.length === 0) {
                setError('Không tìm thấy câu hỏi nào trong file. Vui lòng kiểm tra định dạng file theo hướng dẫn.');
                return;
            }
            
            setPreviewQuestions(questions);
        } catch (err) {
            setError('Không thể đọc file Word. Vui lòng kiểm tra định dạng file hoặc thử lại.');
            console.error('Error parsing Word file:', err);
        } finally {
            setLoading(false);
        }
    };

    const readFileAsArrayBuffer = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    const parseQuestionsFromHTML = (htmlContent, plainText) => {
        const questions = [];
        
        // Create a temporary div to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // Get all paragraphs from HTML
        const paragraphs = tempDiv.querySelectorAll('p');
        const htmlLines = Array.from(paragraphs).map(p => ({
            text: p.textContent.trim(),
            html: p.innerHTML,
            isBold: p.querySelector('strong, b') !== null
        })).filter(line => line.text.length > 0);
        
        // Fallback to plain text if HTML parsing fails
        if (htmlLines.length === 0) {
            return parseQuestionsFromText(plainText);
        }
        
        let currentQuestion = null;
        let questionNumber = 0;

        for (let i = 0; i < htmlLines.length; i++) {
            const lineData = htmlLines[i];
            const line = lineData.text;
            
            // Detect question start with various patterns
            const questionMatch = line.match(/^(?:câu|question|c[aâ]u)\s*(\d+)[:.)\-]?\s*(.*)/i);
            
            if (questionMatch) {
                // Save previous question if exists and is valid
                if (currentQuestion && currentQuestion.question_text && currentQuestion.options.length >= 2) {
                    // Set first option as correct answer if none was detected
                    if (!currentQuestion.correct_answer && currentQuestion.options.length > 0) {
                        currentQuestion.correct_answer = currentQuestion.options[0];
                    }
                    questions.push(currentQuestion);
                }
                
                questionNumber++;
                currentQuestion = {
                    id: Date.now() + questionNumber,
                    question_text: questionMatch[2] || '',
                    question_type: 'multiple_choice',
                    points: 1,
                    question_order: questionNumber,
                    options: [],
                    correct_answer: ''
                };
            } else if (currentQuestion) {
                // Check if this is an option with various patterns
                const optionMatch = line.match(/^([A-Da-d])[.)\-]?\s*(.*)/i);
                
                if (optionMatch) {
                    const optionText = optionMatch[2].trim();
                    
                    if (optionText) {
                        currentQuestion.options.push(optionText);
                        
                        // Check if this option contains bold text (correct answer)
                        if (containsBoldText(lineData.html, optionText)) {
                            currentQuestion.correct_answer = optionText;
                        }
                    }
                } else if (line && !line.match(/^[A-Da-d][.)\-]/i)) {
                    // Continue question text if it doesn't look like an option
                    if (currentQuestion.question_text) {
                        currentQuestion.question_text += ' ' + line;
                    } else {
                        currentQuestion.question_text = line;
                    }
                }
            }
        }
        
        // Add last question if valid
        if (currentQuestion && currentQuestion.question_text && currentQuestion.options.length >= 2) {
            // Set first option as correct answer if none was detected
            if (!currentQuestion.correct_answer && currentQuestion.options.length > 0) {
                currentQuestion.correct_answer = currentQuestion.options[0];
            }
            questions.push(currentQuestion);
        }
        
        return questions;
    };

    const parseQuestionsFromText = (text) => {
        const questions = [];
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        let currentQuestion = null;
        let questionNumber = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Detect question start with various patterns
            const questionMatch = line.match(/^(?:câu|question|c[aâ]u)\s*(\d+)[:.)\-]?\s*(.*)/i);
            
            if (questionMatch) {
                // Save previous question if exists and is valid
                if (currentQuestion && currentQuestion.question_text && currentQuestion.options.length >= 2) {
                    // Set first option as correct answer if none was detected
                    if (!currentQuestion.correct_answer && currentQuestion.options.length > 0) {
                        currentQuestion.correct_answer = currentQuestion.options[0];
                    }
                    questions.push(currentQuestion);
                }
                
                questionNumber++;
                currentQuestion = {
                    id: Date.now() + questionNumber,
                    question_text: questionMatch[2] || '',
                    question_type: 'multiple_choice',
                    points: 1,
                    question_order: questionNumber,
                    options: [],
                    correct_answer: ''
                };
            } else if (currentQuestion) {
                // Check if this is an option with various patterns
                const optionMatch = line.match(/^([A-Da-d])[.)\-]?\s*(.*)/i);
                
                if (optionMatch) {
                    const optionText = optionMatch[2].trim();
                    
                    if (optionText) {
                        currentQuestion.options.push(optionText);
                        // For plain text, we can't detect bold, so no correct answer detection
                    }
                } else if (line && !line.match(/^[A-Da-d][.)\-]/i)) {
                    // Continue question text if it doesn't look like an option
                    if (currentQuestion.question_text) {
                        currentQuestion.question_text += ' ' + line;
                    } else {
                        currentQuestion.question_text = line;
                    }
                }
            }
        }
        
        // Add last question if valid
        if (currentQuestion && currentQuestion.question_text && currentQuestion.options.length >= 2) {
            // Set first option as correct answer if none was detected
            if (!currentQuestion.correct_answer && currentQuestion.options.length > 0) {
                currentQuestion.correct_answer = currentQuestion.options[0];
            }
            questions.push(currentQuestion);
        }
        
        return questions;
    };

    const containsBoldText = (htmlContent, optionText) => {
        // Check if the HTML contains bold tags with the option text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // Look for strong or b tags
        const boldElements = tempDiv.querySelectorAll('strong, b');
        
        for (let boldElement of boldElements) {
            const boldText = boldElement.textContent.trim();
            // Check if the bold text matches or contains the option text
            if (boldText === optionText || 
                boldText.includes(optionText) || 
                optionText.includes(boldText)) {
                return true;
            }
        }
        
        // Also check if the entire line is wrapped in bold tags
        const strongMatch = htmlContent.match(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi);
        if (strongMatch) {
            for (let match of strongMatch) {
                const textContent = match.replace(/<[^>]*>/g, '').trim();
                if (textContent === optionText || 
                    textContent.includes(optionText) || 
                    optionText.includes(textContent)) {
                    return true;
                }
            }
        }
        
        return false;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleImport = () => {
        if (previewQuestions.length > 0) {
            onQuestionsImported(previewQuestions);
            onClose();
        }
    };

    return (
        <div style={styles.importSection}>
            <h3>Import câu hỏi từ file Word</h3>
            
            {/* Instructions */}
            <div style={styles.instructionsBox}>
                <div style={styles.instructionTitle}>Hướng dẫn định dạng file Word:</div>
                <div style={styles.instructionText}>
                    • Mỗi câu hỏi bắt đầu bằng "Câu 1:", "Câu 2:", "Question 1:", v.v.
                </div>
                <div style={styles.instructionText}>
                    • Các đáp án được đánh số A., B., C., D. (hoặc a., b., c., d.)
                </div>
                <div style={styles.instructionText}>
                    • Đáp án đúng phải được <strong>in đậm</strong> (Bold) trong Word
                </div>
                <div style={styles.instructionText}>
                    • Mỗi câu hỏi phải có ít nhất 2 đáp án
                </div>
                <div style={styles.exampleBox}>
                    <strong>Ví dụ định dạng:</strong><br/>
                    Câu 1: Thủ đô của Việt Nam là?<br/>
                    A. Hồ Chí Minh<br/>
                    B. <strong>Hà Nội</strong> ← Đáp án đúng (in đậm)<br/>
                    C. Đà Nẵng<br/>
                    D. Cần Thơ<br/><br/>
                    
                    Question 2: What is 2 + 2?<br/>
                    a. 3<br/>
                    b. <strong>4</strong> ← Correct answer (bold)<br/>
                    c. 5<br/>
                    d. 6
                </div>
            </div>

            {/* File Upload */}
            <div
                style={{
                    ...styles.uploadArea,
                    ...(dragOver ? styles.uploadAreaHover : {})
                }}
                onClick={() => document.getElementById('wordFileInput').click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <div style={styles.uploadIcon}>📄</div>
                <div style={styles.uploadText}>
                    {selectedFile ? selectedFile.name : 'Chọn file Word hoặc kéo thả vào đây'}
                </div>
                <div style={styles.uploadSubtext}>
                    Hỗ trợ file .doc và .docx
                </div>
            </div>

            <input
                id="wordFileInput"
                type="file"
                accept=".doc,.docx"
                style={styles.fileInput}
                onChange={(e) => handleFileSelect(e.target.files[0])}
            />

            {error && (
                <div style={styles.errorMessage}>
                    {error}
                </div>
            )}

            {loading && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div>⏳ Đang xử lý file...</div>
                </div>
            )}

            {/* Preview Questions */}
            {previewQuestions.length > 0 && (
                <div style={styles.previewSection}>
                    <h4>Xem trước câu hỏi ({previewQuestions.length} câu)</h4>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {previewQuestions.slice(0, 3).map((question, index) => (
                            <div key={question.id} style={styles.questionPreview}>
                                <div style={styles.questionText}>
                                    Câu {index + 1}: {question.question_text}
                                </div>
                                <ul style={styles.optionsList}>
                                    {question.options.map((option, optIndex) => (
                                        <li 
                                            key={optIndex} 
                                            style={{
                                                ...styles.optionItem,
                                                ...(option === question.correct_answer ? styles.correctOption : {})
                                            }}
                                        >
                                            {String.fromCharCode(65 + optIndex)}. {option}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                        {previewQuestions.length > 3 && (
                            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                                ... và {previewQuestions.length - 3} câu hỏi khác
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                    style={{...styles.button, ...styles.buttonSecondary}}
                    onClick={onClose}
                >
                    Hủy
                </button>
                <button
                    style={{...styles.button, ...styles.buttonPrimary}}
                    onClick={handleImport}
                    disabled={previewQuestions.length === 0}
                >
                    Import {previewQuestions.length} câu hỏi
                </button>
            </div>
        </div>
    );
};

export default WordQuestionImporter;