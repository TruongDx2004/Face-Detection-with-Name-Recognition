// Test script đơn giản cho Chat API
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Hàm test đơn giản
async function testChatAPI() {
    console.log('🧪 Testing Chat API...\n');

    // Test cases
    const testCases = [
        {
            name: 'Test danh sách sinh viên',
            message: 'Danh sách sinh viên lớp CNTT K20'
        },
        {
            name: 'Test điểm danh',
            message: 'Điểm danh lớp CNTT K20 hôm nay'
        },
        {
            name: 'Test điểm số',
            message: 'Điểm của Nguyễn Văn A'
        },
        {
            name: 'Test bài tập',
            message: 'Ai chưa nộp bài tập tuần 3 lớp CNTT K20'
        },
        {
            name: 'Test câu hỏi chung',
            message: 'Xin chào chatbot'
        }
    ];

    for (const testCase of testCases) {
        console.log(`📝 ${testCase.name}`);
        console.log(`❓ Input: "${testCase.message}"`);
        
        try {
            // Note: Cần có token hợp lệ để test thực tế
            const response = await axios.post(`${BASE_URL}/chat`, {
                message: testCase.message
            }, {
                headers: {
                    'Authorization': 'Bearer YOUR_TOKEN_HERE', // Thay bằng token thật
                    'Content-Type': 'application/json'
                }
            });

            console.log(`✅ Response: ${response.data.data.response.substring(0, 100)}...`);
            console.log(`🎯 Intent: ${response.data.data.intent}`);
            
        } catch (error) {
            if (error.response) {
                console.log(`❌ Error: ${error.response.data.message}`);
            } else {
                console.log(`❌ Network Error: ${error.message}`);
            }
        }
        
        console.log('---');
    }

    console.log('\n🚀 Testing completed!');
}

// Chạy test nếu file được gọi trực tiếp
if (require.main === module) {
    testChatAPI().catch(console.error);
}

module.exports = { testChatAPI };