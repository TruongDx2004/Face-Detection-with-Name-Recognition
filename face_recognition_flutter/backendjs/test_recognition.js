const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const TEST_IMAGE_PATH = path.join(__dirname, 'test_face.jpg'); // ảnh test
const API_URL = 'http://localhost:8000/face/recognize'; // đổi nếu backend ở IP khác
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDI0MzA4MCwiZXhwIjoxNzU0MzI5NDgwfQ.RIZQQW8IBC7jJ5amS68JWF4o8MmvoZQKOyRmfnTa1To'; // 🔐 Access token hợp lệ

async function testRecognizeFace() {
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
        console.error('❌ Không tìm thấy ảnh test:', TEST_IMAGE_PATH);
        return;
    }

    const form = new FormData();
    form.append('image', fs.createReadStream(TEST_IMAGE_PATH));

    try {
        const response = await axios.post(API_URL, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${TOKEN}`
            }
        });

        console.log('✅ Kết quả nhận diện khuôn mặt:');
        console.dir(response.data, { depth: null });

    } catch (error) {
        console.error('❌ Lỗi khi gọi API:');
        if (error.response) {
            console.error('📡 Status:', error.response.status);
            console.error('🧾 Data:', error.response.data);
            console.error('📋 Headers:', error.response.headers);
        } else if (error.request) {
            console.error('📤 Request was made but no response received.');
            console.error('🧾 Request:', error.request);
        } else {
            console.error('⚠️ Error message:', error.message);
        }
    }
}

testRecognizeFace();
