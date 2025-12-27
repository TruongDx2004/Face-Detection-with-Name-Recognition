# 🤖 Hướng Dẫn Cài Đặt Hệ Thống AI Tạo Bài Tập Tự Động với Phi-3

## 📋 Tổng Quan
Hệ thống AI này sử dụng mô hình Phi-3 của Microsoft để tự động tạo bài tập từ tài liệu được upload. Pipeline hoạt động theo luồng:

**[Teacher Upload] → [File Parser] → [Text Preprocessing] → [AI Question Generator] → [Post Processing] → [Database]**

## 🚀 Cài Đặt Từng Bước

### Bước 1: Chuẩn Bị Môi Trường
```bash
# Kiểm tra Node.js version (cần >= 16)
node --version

# Kiểm tra npm
npm --version

# Đảm bảo có đủ dung lượng đĩa (ít nhất 3GB)
df -h
```

### Bước 2: Chạy Script Thiết Lập Phi-3
```bash
cd backendjs
node setup_phi3.js
```

### Bước 3: Cài Đặt Hệ Thống AI
```bash
# Chạy script cài đặt tự động
node install_ai_system.js
```

### Bước 4: Cấu Hình Database
```bash
# Chạy migration để tạo các bảng AI
mysql -u your_username -p your_database < migrations/add_ai_assignment_features.sql
```

### Bước 5: Khởi Động Server
```bash
# Restart server để load các module mới
npm start

# Hoặc với PM2
pm2 restart all
```

### Bước 6: Kiểm Tra Hệ Thống
```bash
# Chạy script kiểm tra
node verify_ai_system.js

# Kiểm tra API endpoints
curl http://localhost:3000/api/ai/capabilities
```

## ⚙️ Cấu Hình Chi Tiết

### Cấu Hình Phi-3 Model
Chỉnh sửa `src/ai/config.json`:
```json
{
  "phi3": {
    "model": "microsoft/Phi-3-mini-4k-instruct",
    "maxTokens": 2048,
    "temperature": 0.7,
    "topP": 0.9,
    "device": "auto"
  },
  "generation": {
    "maxQuestions": 20,
    "questionTypes": ["multiple_choice", "short_answer", "essay", "true_false"],
    "difficultyLevels": ["easy", "medium", "hard"],
    "language": "vietnamese"
  }
}
```

### Cấu Hình File Parser
Các định dạng được hỗ trợ:
- **PDF**: Sử dụng pdf-parse
- **DOCX**: Sử dụng mammoth
- **TXT**: Đọc trực tiếp
- **XLSX**: Sử dụng xlsx library

### Cấu Hình Text Preprocessing
- **Chunk Size**: 1000 ký tự mặc định
- **Overlap**: 100 ký tự
- **Stop Words**: Tiếng Việt và Tiếng Anh
- **Keyword Extraction**: Sử dụng natural và compromise

## 📁 Cấu Trúc Files Được Tạo

```
backendjs/
├── src/ai/
│   ├── config.json                          # Cấu hình AI
│   ├── parsers/
│   │   └── DocumentParser.js               # Parse tài liệu
│   ├── processors/
│   │   ├── TextPreprocessor.js             # Xử lý văn bản
│   │   └── QuestionPostProcessor.js        # Xử lý câu hỏi
│   └── models/
│       └── Phi3QuestionGenerator.js        # AI tạo câu hỏi
├── src/services/
│   └── aiAssignmentService.js              # Service chính
├── src/controllers/
│   └── AIAssignmentController.js           # API controllers
├── src/routes/
│   └── aiAssignmentRoutes.js              # API routes
├── src/validators/
│   └── aiAssignmentValidator.js           # Validation
├── migrations/
│   └── add_ai_assignment_features.sql     # Database schema
├── setup_phi3.js                         # Script thiết lập
├── install_ai_system.js                  # Script cài đặt
└── verify_ai_system.js                   # Script kiểm tra
```

```
my-app/
└── src/pages/teacher/
    └── AIAssignmentGenerator.jsx           # Frontend interface
```

## 🔗 API Endpoints

### POST `/api/ai/generate-assignment`
Tạo template bài tập hoàn chỉnh từ tài liệu
```bash
curl -X POST http://localhost:3000/api/ai/generate-assignment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@sample.pdf" \
  -F "title=Bài tập AI" \
  -F "question_count=10" \
  -F "question_types=multiple_choice,short_answer" \
  -F "difficulty=medium"
```

### POST `/api/ai/preview-questions`
Xem trước 5 câu hỏi mẫu
```bash
curl -X POST http://localhost:3000/api/ai/preview-questions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@sample.pdf" \
  -F "question_count=5"
```

### GET `/api/ai/capabilities`
Lấy thông tin khả năng hệ thống
```bash
curl -X GET http://localhost:3000/api/ai/capabilities \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET `/api/ai/stats`
Thống kê sử dụng AI của giáo viên
```bash
curl -X GET http://localhost:3000/api/ai/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 Cách Sử Dụng

### 1. Qua Giao Diện Web
1. Đăng nhập với tài khoản teacher
2. Vào **Teacher Dashboard** → **AI Assignment Generator**
3. Upload tài liệu (PDF, DOCX, TXT, XLSX)
4. Cấu hình các tùy chọn:
   - Số lượng câu hỏi (1-20)
   - Loại câu hỏi (trắc nghiệm, tự luận, đúng/sai, essay)
   - Độ khó (dễ, trung bình, khó)
   - Ngôn ngữ (Tiếng Việt, Tiếng Anh)
5. Preview câu hỏi (tùy chọn)
6. Tạo template bài tập hoàn chỉnh

### 2. Qua API
Sử dụng các endpoint được mô tả ở trên để tích hợp vào ứng dụng khác.

## 🔍 Pipeline Chi Tiết

### 1. Document Parsing
- **Input**: File upload (PDF/DOCX/TXT/XLSX)
- **Process**: Trích xuất text và metadata
- **Output**: Plain text + metadata (pages, format, etc.)

### 2. Text Preprocessing  
- **Input**: Raw text
- **Process**: 
  - Làm sạch và chuẩn hóa text
  - Chia thành chunks nhỏ
  - Trích xuất keywords và entities
  - Phân tích cấu trúc tài liệu
- **Output**: Processed data với chunks, keywords, topics

### 3. AI Question Generation
- **Input**: Processed text data + generation settings
- **Process**:
  - Sử dụng Phi-3 để tạo câu hỏi
  - Rule-based fallback khi AI không khả dụng
  - Tạo đa dạng loại câu hỏi
- **Output**: Array of generated questions

### 4. Post Processing
- **Input**: Raw generated questions
- **Process**:
  - Validation và làm sạch
  - Loại bỏ trùng lặp
  - Tính điểm complexity và estimated time
  - Format cho database
- **Output**: Clean, validated questions

### 5. Database Storage
- **Input**: Processed questions + metadata
- **Process**: 
  - Tạo assignment template
  - Lưu questions vào database
  - Log generation history
- **Output**: Saved template with ID

## 🛠️ Troubleshooting

### Lỗi Cài Đặt Dependencies
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install

# Cài từng package riêng lẻ nếu lỗi
npm install @huggingface/transformers
npm install mammoth pdf-parse xlsx natural compromise
```

### Lỗi Database
```bash
# Kiểm tra kết nối database
mysql -u username -p database_name -e "SELECT 1;"

# Chạy lại migration
mysql -u username -p database_name < migrations/add_ai_assignment_features.sql
```

### Lỗi File Upload
```bash
# Tạo thư mục uploads
mkdir -p uploads/documents uploads/ai-temp

# Set permissions
chmod 755 uploads/documents uploads/ai-temp
```

### Lỗi Memory/Performance
```bash
# Tăng memory limit cho Node.js
export NODE_OPTIONS="--max_old_space_size=4096"
npm start
```

### Kiểm Tra Logs
```bash
# Logs AI generation
tail -f logs/ai-generation/generation.log

# Logs server
tail -f logs/server.log

# Check AI service status
node -e "
const AIService = require('./src/services/aiAssignmentService');
new AIService().initialize().then(() => console.log('✅ OK')).catch(console.error);
"
```

## 📊 Monitoring & Analytics

### Database Queries Hữu Ích
```sql
-- Thống kê generation gần đây
SELECT * FROM ai_generation_summary LIMIT 10;

-- Top teachers sử dụng AI
SELECT teacher_name, COUNT(*) as generations 
FROM ai_generation_summary 
GROUP BY teacher_id, teacher_name 
ORDER BY generations DESC;

-- Performance metrics
SELECT 
    AVG(generation_time_ms) as avg_time,
    AVG(success_rate) as avg_success_rate,
    COUNT(*) as total_generations
FROM ai_generation_logs 
WHERE created_at >= CURDATE() - INTERVAL 7 DAY;

-- Question type distribution
SELECT question_type, COUNT(*) as count
FROM ai_template_questions 
GROUP BY question_type;
```

### Update Statistics
```sql
-- Update daily stats (chạy qua cron job)
CALL UpdateAIStats(CURDATE());
```

## 🔐 Bảo Mật

### File Upload Security
- Giới hạn kích thước file: 10MB
- Whitelist file types: PDF, DOCX, TXT, XLSX
- Scan malware (nên implement)
- Tự động xóa file sau xử lý

### API Security
- JWT authentication required
- Rate limiting
- Input validation
- CORS configuration

### Data Privacy
- Tự động xóa temp files
- Không log sensitive content
- Database encryption (khuyến nghị)

## 🚀 Production Deployment

### Environment Variables
```bash
# .env additions
AI_ENABLED=true
PHI3_MODEL_PATH=/path/to/models
AI_TEMP_DIR=/path/to/ai-temp
AI_LOG_LEVEL=info
MAX_CONCURRENT_GENERATIONS=3
```

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'face-attendance-ai',
    script: 'src/server.js',
    env: {
      NODE_ENV: 'production',
      AI_ENABLED: 'true'
    },
    max_memory_restart: '2G',
    instances: 1 // AI generation should not be clustered
  }]
}
```

### Nginx Configuration
```nginx
# Increase file upload limits for AI documents
client_max_body_size 10M;
client_body_timeout 60s;

# Longer timeout for AI generation
location /api/ai/ {
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
    proxy_pass http://backend;
}
```

## 📈 Performance Optimization

### Model Caching
- Phi-3 model được cache sau lần đầu load
- Text preprocessing cache cho documents tương tự
- Question templates cache

### Async Processing
- Generation chạy async không block server
- Queue system cho multiple requests
- Progress tracking

### Resource Management
- Memory cleanup sau mỗi generation
- Temp file cleanup
- Connection pooling

## 🎯 Next Steps

### Tính Năng Mở Rộng
1. **Multi-language support**: Thêm nhiều ngôn ngữ khác
2. **Custom prompts**: Cho phép teacher tùy chỉnh prompts
3. **Question bank integration**: Tích hợp với ngân hàng câu hỏi có sẵn
4. **Batch processing**: Xử lý nhiều documents cùng lúc
5. **Question review workflow**: Review và approve questions trước khi publish

### AI Model Improvements
1. **Fine-tuning**: Fine-tune Phi-3 cho education domain
2. **Multiple models**: Thử nghiệm các model khác nhau
3. **Ensemble methods**: Kết hợp nhiều model để tăng quality
4. **Feedback learning**: Học từ feedback của teachers

### Integration
1. **LMS integration**: Tích hợp với Moodle, Canvas
2. **Mobile app**: Thêm vào Flutter app
3. **Export formats**: Export ra Word, PDF, QTI
4. **API webhooks**: Notify khi generation complete

Chúc bạn triển khai thành công hệ thống AI! 🎉📚