import React, { useState, useEffect } from 'react';
import AdvancedRichTextEditor from './AdvancedRichTextEditor';

const QuestionEditor = ({ 
    question, 
    questionIndex, 
    onQuestionUpdate, 
    onDeleteQuestion, 
    canDelete = true 
}) => {
    const [activeTab, setActiveTab] = useState('content');
    
    // Initialize correct answer index immediately
    const getCorrectAnswerIndex = () => {
        if (question.question_type === 'multiple_choice' && question.options && question.correct_answer) {
            return question.options.findIndex(option => option === question.correct_answer);
        }
        return -1;
    };
    
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState(getCorrectAnswerIndex);

    // Debug logging
    useEffect(() => {
        console.log(`🔍 QuestionEditor ${questionIndex}:`, {
            question_type: question.question_type,
            correct_answer: question.correct_answer,
            options: question.options,
            correctAnswerIndex: correctAnswerIndex,
            calculated: getCorrectAnswerIndex()
        });
    }, [question]);

    // Sync correct answer index when question changes
    useEffect(() => {
        const newIndex = getCorrectAnswerIndex();
        if (newIndex !== correctAnswerIndex) {
            console.log(`📝 Updating correctAnswerIndex from ${correctAnswerIndex} to ${newIndex}`);
            setCorrectAnswerIndex(newIndex);
        }
    }, [question.correct_answer, question.options, question.question_type]);

    const updateQuestion = (field, value) => {
        onQuestionUpdate(questionIndex, field, value);
    };

    const updateOption = (optionIndex, value) => {
        const newOptions = [...question.options];
        newOptions[optionIndex] = value;
        updateQuestion('options', newOptions);
    };

    const addOption = () => {
        if (question.options.length < 6) {
            updateQuestion('options', [...question.options, '']);
        }
    };

    const removeOption = (optionIndex) => {
        if (question.options.length > 2) {
            const newOptions = question.options.filter((_, i) => i !== optionIndex);
            updateQuestion('options', newOptions);
            
            // Reset correct answer if it was the deleted option
            if (correctAnswerIndex === optionIndex) {
                setCorrectAnswerIndex(-1);
                updateQuestion('correct_answer', '');
            } else if (correctAnswerIndex > optionIndex) {
                // Adjust index if correct answer is after deleted option
                setCorrectAnswerIndex(correctAnswerIndex - 1);
            }
        }
    };

    const setCorrectAnswer = (answer) => {
        updateQuestion('correct_answer', answer);
    };

    const setCorrectAnswerByIndex = (index) => {
        if (question.options && question.options[index]) {
            setCorrectAnswerIndex(index);
            updateQuestion('correct_answer', question.options[index]);
        }
    };

    // Styles
    const styles = {
        container: {
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '20px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        },
        header: {
            backgroundColor: '#f8fafc',
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        headerTitle: {
            fontSize: '16px',
            fontWeight: '600',
            color: '#1e293b'
        },
        headerActions: {
            display: 'flex',
            gap: '8px'
        },
        tabs: {
            display: 'flex',
            backgroundColor: '#f1f5f9',
            borderBottom: '1px solid #e2e8f0'
        },
        tab: {
            padding: '12px 20px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            borderBottom: '2px solid transparent'
        },
        tabActive: {
            backgroundColor: '#ffffff',
            color: '#3b82f6',
            borderBottomColor: '#3b82f6'
        },
        tabInactive: {
            color: '#64748b'
        },
        content: {
            padding: '20px'
        },
        formGroup: {
            marginBottom: '20px'
        },
        label: {
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
        },
        select: {
            width: '100%',
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            backgroundColor: '#ffffff'
        },
        input: {
            width: '100%',
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '14px'
        },
        optionContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
        },
        optionContainerCorrect: {
            backgroundColor: '#f0fdf4',
            borderColor: '#16a34a'
        },
        radioButton: {
            width: '18px',
            height: '18px',
            cursor: 'pointer'
        },
        optionEditor: {
            flex: 1
        },
        button: {
            padding: '8px 12px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
        },
        buttonPrimary: {
            backgroundColor: '#3b82f6',
            color: '#ffffff'
        },
        buttonDanger: {
            backgroundColor: '#ef4444',
            color: '#ffffff'
        },
        buttonSecondary: {
            backgroundColor: '#f1f5f9',
            color: '#374151',
            border: '1px solid #e2e8f0'
        },
        addOptionButton: {
            width: '100%',
            padding: '12px',
            border: '2px dashed #d1d5db',
            borderRadius: '8px',
            backgroundColor: '#f9fafb',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
        },
        pointsDisplay: {
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            color: '#0369a1',
            fontWeight: '500'
        }
    };

    const tabs = [
        { id: 'content', label: 'Nội dung', icon: '📝' },
        { id: 'options', label: 'Đáp án', icon: '✅' },
        { id: 'settings', label: 'Cài đặt', icon: '⚙️' }
    ];

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerTitle}>
                    📋 Câu hỏi {questionIndex + 1}
                    <span style={styles.pointsDisplay}>
                        {question.points || 1} điểm
                    </span>
                </div>
                <div style={styles.headerActions}>
                    {canDelete && (
                        <button
                            type="button"
                            onClick={() => onDeleteQuestion(questionIndex)}
                            style={{ ...styles.button, ...styles.buttonDanger }}
                        >
                            🗑️ Xóa
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={styles.tabs}>
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        style={{
                            ...styles.tab,
                            ...(activeTab === tab.id ? styles.tabActive : styles.tabInactive)
                        }}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon} {tab.label}
                    </div>
                ))}
            </div>

            {/* Content */}
            <div style={styles.content}>
                {activeTab === 'content' && (
                    <div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>
                                Nội dung câu hỏi *
                            </label>
                            <AdvancedRichTextEditor
                                value={question.question_text || ''}
                                onChange={(value) => updateQuestion('question_text', value)}
                                placeholder="Nhập nội dung câu hỏi. Sử dụng thanh công cụ để định dạng văn bản, chèn công thức toán học và hóa học..."
                                height="120px"
                            />
                        </div>

                        {question.question_type === 'essay' && (
                            <div style={styles.formGroup}>
                                <label style={styles.label}>
                                    Hướng dẫn chấm điểm
                                </label>
                                <AdvancedRichTextEditor
                                    value={question.grading_notes || ''}
                                    onChange={(value) => updateQuestion('grading_notes', value)}
                                    placeholder="Nhập hướng dẫn chấm điểm cho câu tự luận..."
                                    height="80px"
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'options' && (
                    <div>
                        {question.question_type === 'multiple_choice' && (
                            <div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Các đáp án (Click radio button để chọn đáp án đúng)
                                    </label>
                                    
                                    {question.options?.map((option, optionIndex) => (
                                        <div 
                                            key={optionIndex} 
                                            style={{
                                                ...styles.optionContainer,
                                                ...(correctAnswerIndex === optionIndex ? styles.optionContainerCorrect : {})
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name={`correct-${question.id || questionIndex}`}
                                                checked={correctAnswerIndex === optionIndex}
                                                onChange={() => setCorrectAnswerByIndex(optionIndex)}
                                                style={styles.radioButton}
                                            />
                                            
                                            <div style={styles.optionEditor}>
                                                <AdvancedRichTextEditor
                                                    value={option || ''}
                                                    onChange={(value) => updateOption(optionIndex, value)}
                                                    placeholder={`Đáp án ${String.fromCharCode(65 + optionIndex)} - Sử dụng định dạng rich text...`}
                                                    height="60px"
                                                    showToolbar={true}
                                                />
                                            </div>
                                            
                                            {question.options.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeOption(optionIndex)}
                                                    style={{ ...styles.button, ...styles.buttonDanger }}
                                                >
                                                    ❌
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {question.options?.length < 6 && (
                                        <button
                                            type="button"
                                            onClick={addOption}
                                            style={styles.addOptionButton}
                                            onMouseOver={(e) => {
                                                e.target.style.backgroundColor = '#f0f9ff';
                                                e.target.style.borderColor = '#3b82f6';
                                            }}
                                            onMouseOut={(e) => {
                                                e.target.style.backgroundColor = '#f9fafb';
                                                e.target.style.borderColor = '#d1d5db';
                                            }}
                                        >
                                            ➕ Thêm đáp án ({question.options?.length}/6)
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {question.question_type === 'true_false' && (
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Đáp án đúng</label>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name={`tf-${question.id || questionIndex}`}
                                            value="true"
                                            checked={question.correct_answer === 'true'}
                                            onChange={(e) => setCorrectAnswer(e.target.value)}
                                        />
                                        Đúng
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name={`tf-${question.id || questionIndex}`}
                                            value="false"
                                            checked={question.correct_answer === 'false'}
                                            onChange={(e) => setCorrectAnswer(e.target.value)}
                                        />
                                        Sai
                                    </label>
                                </div>
                            </div>
                        )}

                        {(question.question_type === 'short_answer' || question.question_type === 'essay') && (
                            <div style={styles.formGroup}>
                                <label style={styles.label}>
                                    {question.question_type === 'essay' ? 'Đáp án mẫu' : 'Đáp án đúng'}
                                </label>
                                <AdvancedRichTextEditor
                                    value={question.correct_answer || ''}
                                    onChange={(value) => setCorrectAnswer(value)}
                                    placeholder={question.question_type === 'essay' 
                                        ? "Nhập đáp án mẫu cho câu tự luận..." 
                                        : "Nhập đáp án đúng..."
                                    }
                                    height="80px"
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Loại câu hỏi</label>
                                <select
                                    value={question.question_type || 'multiple_choice'}
                                    onChange={(e) => updateQuestion('question_type', e.target.value)}
                                    style={styles.select}
                                >
                                    <option value="multiple_choice">Trắc nghiệm</option>
                                    <option value="true_false">Đúng/Sai</option>
                                    <option value="short_answer">Trả lời ngắn</option>
                                    <option value="essay">Tự luận</option>
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Điểm số</label>
                                <input
                                    type="number"
                                    value={question.points || 1}
                                    onChange={(e) => updateQuestion('points', parseFloat(e.target.value) || 1)}
                                    min="0.1"
                                    step="0.1"
                                    style={styles.input}
                                />
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Giải thích (tùy chọn)</label>
                            <AdvancedRichTextEditor
                                value={question.explanation || ''}
                                onChange={(value) => updateQuestion('explanation', value)}
                                placeholder="Nhập giải thích cho câu hỏi (sẽ hiển thị sau khi học sinh hoàn thành bài thi)..."
                                height="80px"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionEditor;