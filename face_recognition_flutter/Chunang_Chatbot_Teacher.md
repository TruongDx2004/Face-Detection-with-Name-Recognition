1️⃣ Chat hỏi đáp = làm những gì?

Ở giai đoạn này, chatbot chỉ cần làm 3 việc cốt lõi:

Nhận câu hỏi tiếng Việt từ giáo viên

Hiểu ý định (intent)

Trả lời bằng dữ liệu thật (từ DB / API) hoặc text thông minh

❌ Chưa cần:

Voice

AI phức tạp

Dashboard

2️⃣ Các loại câu hỏi nên hỗ trợ (MVP)
🔎 Nhóm truy vấn dữ liệu

“Danh sách sinh viên lớp CNTT K20”

“Ai chưa nộp bài tập tuần 3?”

“Điểm trung bình của Nguyễn Văn A”

“Có bao nhiêu sinh viên vắng hôm nay?”

🧠 Nhóm hỏi kiến thức / hỗ trợ

“Gợi ý câu hỏi trắc nghiệm về OOP”

“Tóm tắt bài học về mảng trong C”

👉 MVP: ưu tiên nhóm truy vấn dữ liệu

3️⃣ Luồng xử lý Chat hỏi đáp (rất quan trọng)
User hỏi
   ↓
Chat API
   ↓
AI phân tích intent + entity
   ↓
Map intent → hàm xử lý
   ↓
Query DB / xử lý logic
   ↓
Trả lời người dùng

4️⃣ Định nghĩa INTENT (nên làm thủ công trước)

Ví dụ các intent cơ bản:

QUERY_STUDENT_LIST
QUERY_STUDENT_SCORE
QUERY_MISSING_ASSIGNMENT
QUERY_ATTENDANCE
GENERAL_QUESTION

5️⃣ Ví dụ prompt AI để phân tích câu hỏi
Bạn là hệ thống phân tích câu hỏi cho chatbot giáo dục.

Nhiệm vụ:
- Xác định intent
- Trích xuất entity
- Trả về JSON, KHÔNG giải thích

Danh sách intent:
- QUERY_STUDENT_LIST
- QUERY_STUDENT_SCORE
- QUERY_MISSING_ASSIGNMENT
- GENERAL_QUESTION

Câu hỏi:
"Cho tôi danh sách sinh viên chưa nộp bài tập tuần 3 lớp CNTT K20"

🔽 Kết quả AI mong muốn
{
  "intent": "QUERY_MISSING_ASSIGNMENT",
  "class": "CNTT K20",
  "week": 3
}

6️⃣ Ví dụ xử lý backend (Node.js – Express)
📌 API chat
POST /chat
{
  "message": "Danh sách sinh viên lớp CNTT K20"
}

📌 Controller
const result = await aiParse(message);

switch (result.intent) {
  case "QUERY_STUDENT_LIST":
    return getStudentsByClass(result.class);

  case "QUERY_MISSING_ASSIGNMENT":
    return getMissingAssignments(result.class, result.week);

  default:
    return "Tôi chưa hiểu câu hỏi.";
}

7️⃣ Ví dụ truy vấn DB
SELECT name, student_code
FROM students
WHERE class_name = 'CNTT K20';

8️⃣ Format trả lời cho đẹp (rất quan trọng)

❌ Không nên trả raw JSON
✅ Nên trả kiểu hội thoại:

📚 Lớp CNTT K20 có 35 sinh viên:

1. Nguyễn Văn A
2. Trần Thị B
3. Lê Văn C

9️⃣ MVP hoàn chỉnh cần những file gì?
/chat
 ├── chat.controller.ts
 ├── chat.service.ts
 ├── intent.map.ts
 ├── ai.service.ts
 └── db.service.ts

🔥 Gợi ý nâng cấp sau khi chạy được

Cache câu hỏi lặp (Redis)

Lưu lịch sử chat

Phân quyền theo giáo viên

Thêm “Bạn muốn xem chi tiết không?”