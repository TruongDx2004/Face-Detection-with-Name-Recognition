// services/chat-service.jsx
import apiService from './api-service';

class ChatService {
    /**
     * Send message to chatbot
     * @param {string} message - User message
     * @returns {Promise<Object>} Chat response
     */
    async sendMessage(message) {
        try {
            const response = await apiService.sendMessage(message);
            console.log('Chat service response:', response);
            return {
                success: true,
                data: response.data,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Chat service error:', error);
            
            // Handle different error types
            if (error.response?.status === 401) {
                return {
                    success: false,
                    error: 'Vui lòng đăng nhập lại để tiếp tục chat',
                    code: 'UNAUTHORIZED'
                };
            }
            
            if (error.response?.status === 403) {
                return {
                    success: false,
                    error: 'Bạn không có quyền sử dụng chatbot',
                    code: 'FORBIDDEN'
                };
            }
            
            if (error.response?.data?.message) {
                return {
                    success: false,
                    error: error.response.data.message,
                    code: 'API_ERROR'
                };
            }
            
            return {
                success: false,
                error: 'Không thể kết nối đến chatbot. Vui lòng thử lại sau.',
                code: 'NETWORK_ERROR'
            };
        }
    }

    /**
     * Get available intents for help
     * @returns {Promise<Object>} Available intents
     */
    async getIntents() {
        try {
            const response = await apiService.get('/chat/intents');
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Get intents error:', error);
            return {
                success: false,
                error: 'Không thể tải danh sách câu hỏi mẫu',
                data: this.getFallbackIntents()
            };
        }
    }

    /**
     * Fallback intents when API is not available
     */
    getFallbackIntents() {
        return [
            {
                intent: 'QUERY_STUDENT_LIST',
                description: 'Xem danh sách sinh viên theo lớp',
                examples: [
                    'Danh sách sinh viên lớp CNTT K20',
                    'Cho tôi xem học sinh lớp 12A1',
                    'DS sinh viên lớp Toán Tin K19'
                ]
            },
            {
                intent: 'QUERY_ATTENDANCE',
                description: 'Kiểm tra thông tin điểm danh',
                examples: [
                    'Điểm danh lớp CNTT K20 hôm nay',
                    'Có bao nhiêu sinh viên vắng hôm qua?',
                    'Tình hình điểm danh lớp 12A1'
                ]
            },
            {
                intent: 'QUERY_GRADES',
                description: 'Xem điểm số học tập',
                examples: [
                    'Điểm của Nguyễn Văn A',
                    'Điểm trung bình của Trần Thị B',
                    'Kết quả học tập của Lê Văn C'
                ]
            },
            {
                intent: 'QUERY_ASSIGNMENTS',
                description: 'Kiểm tra tình hình bài tập',
                examples: [
                    'Ai chưa nộp bài tập tuần 3?',
                    'Bài tập tuần 5 lớp CNTT K20',
                    'Tình hình nộp bài của lớp 12A1'
                ]
            },
            {
                intent: 'QUERY_SCHEDULE',
                description: 'Xem lịch dạy cá nhân',
                examples: [
                    'Lịch dạy hôm nay',
                    'Lịch dạy ngày mai',
                    'Lịch dạy thứ hai tuần này'
                ]
            },
            {
                intent: 'QUERY_TEACHING_LOAD',
                description: 'Kiểm tra tải công việc',
                examples: [
                    'Tải công việc tuần này',
                    'Tải công việc tháng này',
                    'Số giờ dạy tuần tới'
                ]
            },
            {
                intent: 'QUERY_CLASS_SCHEDULE',
                description: 'Xem lịch dạy theo lớp',
                examples: [
                    'Lịch dạy lớp CNTT K20 hôm nay',
                    'Lịch dạy lớp 12A1 ngày mai'
                ]
            },
            {
                intent: 'QUERY_SUBJECT_SCHEDULE',
                description: 'Xem lịch dạy theo môn học',
                examples: [
                    'Môn Java có lịch dạy nào tuần này',
                    'Lịch dạy môn Toán hôm nay'
                ]
            },
            {
                intent: 'QUERY_ROOM_SCHEDULE',
                description: 'Xem lịch sử dụng phòng',
                examples: [
                    'Phòng 301 có lịch gì hôm nay',
                    'Lịch sử dụng phòng A102 ngày mai'
                ]
            }
        ];
    }

    /**
     * Format response for display
     * @param {Object} response - Raw API response
     * @returns {Object} Formatted response
     */
    formatResponse(response) {
        if (!response.success) {
            return {
                text: response.error,
                type: 'error',
                timestamp: new Date()
            };
        }

        const { response: text, intent } = response.data;
        
        return {
            text: text,
            intent: intent,
            type: 'success',
            timestamp: new Date()
        };
    }

    /**
     * Get suggested questions based on context
     */
    getSuggestedQuestions() {
        return [
            'Danh sách sinh viên lớp CNTT K20',
            'Lịch dạy hôm nay',
            'Điểm danh lớp CNTT K20 hôm nay',
            'Tải công việc tuần này',
            'Môn Java có lịch dạy nào tuần này?',
            'Ai chưa nộp bài tập tuần này?',
            'Điểm của Nguyễn Văn A',
            'Phòng 301 có lịch gì hôm nay?',
            'Lịch dạy lớp 12A1 ngày mai'
        ];
    }
}

export default new ChatService();