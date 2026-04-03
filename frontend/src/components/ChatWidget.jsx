// components/ChatWidget.jsx
import React, { useState, useRef, useEffect } from 'react';
import chatService from '../services/chat-service';

const ChatWidget = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Initialize chat with welcome message
    useEffect(() => {
        if (messages.length === 0) {
            const welcomeMessage = {
                id: 'welcome',
                text: `👋 Xin chào ${user?.full_name || 'Giáo viên'}!\n\nTôi là trợ lý AI giúp bạn:\n📚 Quản lý thông tin sinh viên\n📊 Kiểm tra điểm danh\n📈 Xem điểm số\n📝 Theo dõi bài tập\n\nHãy thử hỏi tôi một câu hỏi!`,
                type: 'bot',
                timestamp: new Date()
            };
            setMessages([welcomeMessage]);
        }
    }, [user]);

    const handleSendMessage = async () => {
        const message = inputValue.trim();
        if (!message) return;

        // Add user message
        const userMessage = {
            id: Date.now(),
            text: message,
            type: 'user',
            timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setShowSuggestions(false);

        try {
            // Call chat service
            const response = await chatService.sendMessage(message);
            const formattedResponse = chatService.formatResponse(response);
            
            // Add bot response
            const botMessage = {
                id: Date.now() + 1,
                text: formattedResponse.text,
                type: formattedResponse.type === 'error' ? 'error' : 'bot',
                intent: formattedResponse.intent,
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, botMessage]);
            
        } catch (error) {
            console.error('Send message error:', error);
            const errorMessage = {
                id: Date.now() + 1,
                text: 'Xin lỗi, đã xảy ra lỗi khi xử lý tin nhắn. Vui lòng thử lại.',
                type: 'error',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setInputValue(suggestion);
        setShowSuggestions(false);
        setTimeout(() => handleSendMessage(), 100);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
        setShowSuggestions(true);
        setTimeout(() => {
            const welcomeMessage = {
                id: 'welcome',
                text: `👋 Chat đã được làm mới!\n\nTôi sẵn sàng giúp bạn với:\n📚 Thông tin sinh viên\n📊 Điểm danh\n📈 Điểm số\n📝 Bài tập\n\nHãy hỏi tôi nhé!`,
                type: 'bot',
                timestamp: new Date()
            };
            setMessages([welcomeMessage]);
        }, 100);
    };

    const suggestions = chatService.getSuggestedQuestions();

    const styles = {
        // Chat icon floating button
        chatButton: {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            backgroundColor: '#007bff',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: 'white',
            boxShadow: '0 4px 20px rgba(0,123,255,0.4)',
            transition: 'all 0.3s ease',
            zIndex: 1000,
            outline: 'none'
        },
        chatButtonHover: {
            backgroundColor: '#0056b3',
            transform: 'scale(1.1)',
            boxShadow: '0 6px 25px rgba(0,123,255,0.6)'
        },

        // Chat window
        chatWindow: {
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '380px',
            height: '500px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            border: '1px solid #e1e5e9',
            display: isOpen ? 'flex' : 'none',
            flexDirection: 'column',
            zIndex: 1001,
            overflow: 'hidden',
            // Mobile responsive
            '@media (max-width: 480px)': {
                width: 'calc(100vw - 40px)',
                height: '70vh',
                left: '20px',
                right: '20px',
                bottom: '90px'
            }
        },

        // Chat header
        chatHeader: {
            backgroundColor: '#007bff',
            color: 'white',
            padding: '15px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '16px',
            fontWeight: '600'
        },
        headerActions: {
            display: 'flex',
            gap: '10px'
        },
        headerButton: {
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
        },

        // Messages area
        messagesContainer: {
            flex: 1,
            padding: '15px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: '#f8f9fa'
        },

        // Message bubbles
        message: {
            maxWidth: '85%',
            padding: '10px 15px',
            borderRadius: '18px',
            fontSize: '14px',
            lineHeight: '1.4',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap'
        },
        userMessage: {
            backgroundColor: '#007bff',
            color: 'white',
            alignSelf: 'flex-end',
            borderBottomRightRadius: '6px'
        },
        botMessage: {
            backgroundColor: 'white',
            color: '#333',
            alignSelf: 'flex-start',
            border: '1px solid #e1e5e9',
            borderBottomLeftRadius: '6px'
        },
        errorMessage: {
            backgroundColor: '#f8d7da',
            color: '#721c24',
            alignSelf: 'flex-start',
            border: '1px solid #f5c6cb',
            borderBottomLeftRadius: '6px'
        },
        messageTime: {
            fontSize: '11px',
            opacity: 0.7,
            marginTop: '4px'
        },

        // Suggestions
        suggestionsContainer: {
            padding: '0 15px 10px',
            backgroundColor: '#f8f9fa'
        },
        suggestionsTitle: {
            fontSize: '12px',
            color: '#666',
            marginBottom: '8px',
            fontWeight: '500'
        },
        suggestion: {
            display: 'block',
            width: '100%',
            backgroundColor: 'white',
            border: '1px solid #dee2e6',
            borderRadius: '16px',
            padding: '8px 12px',
            marginBottom: '6px',
            fontSize: '13px',
            color: '#495057',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'left'
        },

        // Input area
        inputContainer: {
            padding: '15px',
            backgroundColor: 'white',
            borderTop: '1px solid #e1e5e9',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-end'
        },
        messageInput: {
            flex: 1,
            border: '1px solid #dee2e6',
            borderRadius: '20px',
            padding: '10px 15px',
            fontSize: '14px',
            outline: 'none',
            resize: 'none',
            minHeight: '20px',
            maxHeight: '80px',
            lineHeight: '1.4'
        },
        sendButton: {
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
            fontSize: '16px'
        },

        // Loading
        loadingDots: {
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            padding: '10px 15px'
        },
        dot: {
            width: '8px',
            height: '8px',
            backgroundColor: '#007bff',
            borderRadius: '50%',
            animation: 'bounce 1.4s infinite ease-in-out'
        }
    };

    // CSS Animation for loading dots
    const bounceAnimation = `
        @keyframes bounce {
            0%, 80%, 100% {
                transform: scale(0);
            } 40% {
                transform: scale(1);
            }
        }
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        .dot:nth-child(3) { animation-delay: 0s; }
    `;

    return (
        <>
            <style>{bounceAnimation}</style>
            
            {/* Floating Chat Button */}
            <button
                className="chat-button"
                style={{
                    ...styles.chatButton,
                    ...(isOpen ? styles.chatButtonHover : {})
                }}
                onClick={() => setIsOpen(!isOpen)}
                title="Trợ lý AI"
            >
                {isOpen ? '✕' : '💬'}
            </button>

            {/* Chat Window */}
            <div className="chat-window" style={styles.chatWindow}>
                {/* Header */}
                <div style={styles.chatHeader}>
                    <span>🤖 Trợ lý AI giáo viên</span>
                    <div style={styles.headerActions}>
                        <button
                            style={styles.headerButton}
                            onClick={clearChat}
                            title="Làm mới chat"
                        >
                            🔄
                        </button>
                        <button
                            style={styles.headerButton}
                            onClick={() => setIsOpen(false)}
                            title="Đóng"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="messages-container" style={styles.messagesContainer}>
                    {messages.map((message) => (
                        <div key={message.id}>
                            <div
                                className="message"
                                style={{
                                    ...styles.message,
                                    ...(message.type === 'user' ? styles.userMessage :
                                        message.type === 'error' ? styles.errorMessage :
                                        styles.botMessage)
                                }}
                            >
                                {message.text}
                                <div style={styles.messageTime}>
                                    {message.timestamp.toLocaleTimeString('vi-VN', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div style={styles.loadingDots}>
                            <div className="loading-dot"></div>
                            <div className="loading-dot"></div>
                            <div className="loading-dot"></div>
                            <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                                Đang suy nghĩ...
                            </span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Suggestions */}
                {showSuggestions && messages.length <= 1 && (
                    <div style={styles.suggestionsContainer}>
                        <div style={styles.suggestionsTitle}>💡 Gợi ý câu hỏi:</div>
                        {suggestions.slice(0, 3).map((suggestion, index) => (
                            <button
                                key={index}
                                style={styles.suggestion}
                                onClick={() => handleSuggestionClick(suggestion)}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#e9ecef';
                                    e.target.style.borderColor = '#007bff';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'white';
                                    e.target.style.borderColor = '#dee2e6';
                                }}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div style={styles.inputContainer}>
                    <textarea
                        ref={inputRef}
                        style={styles.messageInput}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Hỏi tôi về lớp học, sinh viên, điểm danh..."
                        disabled={isLoading}
                        rows={1}
                    />
                    <button
                        style={{
                            ...styles.sendButton,
                            opacity: inputValue.trim() ? 1 : 0.5
                        }}
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        title="Gửi tin nhắn"
                        onMouseEnter={(e) => {
                            if (!e.target.disabled) {
                                e.target.style.backgroundColor = '#0056b3';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!e.target.disabled) {
                                e.target.style.backgroundColor = '#007bff';
                            }
                        }}
                    >
                        📤
                    </button>
                </div>
            </div>
        </>
    );
};

export default ChatWidget;