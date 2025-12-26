const OpenAI = require('openai');

const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1'
});

class AIService {

    async parseIntent(message) {
        try {
            const completion = await client.chat.completions.create({
                model: 'mistralai/mistral-7b-instruct',
                temperature: 0,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: `
You are an intent parser for an education chatbot.
Return ONLY valid JSON. No explanation.

Available intents and their parameters:

1. QUERY_STUDENT_LIST: {"type": "QUERY_STUDENT_LIST", "params": {"class": "class name"}}
2. QUERY_ATTENDANCE: {"type": "QUERY_ATTENDANCE", "params": {"class": "class name", "date": "today|yesterday|date"}}
3. QUERY_GRADES: {"type": "QUERY_GRADES", "params": {"studentName": "student name"}}
4. QUERY_ASSIGNMENTS: {"type": "QUERY_ASSIGNMENTS", "params": {"class": "class name", "week": number}}
5. QUERY_SCHEDULE: {"type": "QUERY_SCHEDULE", "params": {"date": "today|tomorrow|monday|tuesday", "subject": "subject name"}}
6. QUERY_TEACHING_LOAD: {"type": "QUERY_TEACHING_LOAD", "params": {"week": "this week|next week", "month": "this month"}}
7. QUERY_CLASS_SCHEDULE: {"type": "QUERY_CLASS_SCHEDULE", "params": {"class": "class name", "date": "today|tomorrow"}}
8. QUERY_SUBJECT_SCHEDULE: {"type": "QUERY_SUBJECT_SCHEDULE", "params": {"subject": "subject name", "date": "today|this week"}}
9. QUERY_ROOM_SCHEDULE: {"type": "QUERY_ROOM_SCHEDULE", "params": {"room": "room name", "date": "today|tomorrow"}}
10. GENERAL_QUESTION: {"type": "GENERAL_QUESTION", "params": {}}

Examples:
- "Danh sách sinh viên lớp CNTT K20" → {"type": "QUERY_STUDENT_LIST", "params": {"class": "CNTT K20"}}
- "Điểm danh lớp 12A1 hôm nay" → {"type": "QUERY_ATTENDANCE", "params": {"class": "12A1", "date": "today"}}
- "Điểm của Nguyễn Văn A" → {"type": "QUERY_GRADES", "params": {"studentName": "Nguyễn Văn A"}}
- "Ai chưa nộp bài tập tuần 3 lớp CNTT K20" → {"type": "QUERY_ASSIGNMENTS", "params": {"class": "CNTT K20", "week": 3}}
- "Lịch dạy hôm nay" → {"type": "QUERY_SCHEDULE", "params": {"date": "today"}}
- "Lịch dạy thứ 4" → {"type": "QUERY_SCHEDULE", "params": {"date": "wednesday"}}
- "Môn Java có lịch dạy nào tuần này" → {"type": "QUERY_SUBJECT_SCHEDULE", "params": {"subject": "Java", "date": "this week"}}
- "Lịch dạy lớp CNTT K20 ngày mai" → {"type": "QUERY_CLASS_SCHEDULE", "params": {"class": "CNTT K20", "date": "tomorrow"}}
- "Tải công việc tuần này" → {"type": "QUERY_TEACHING_LOAD", "params": {"week": "this week"}}
- "Phòng 301 có lịch gì hôm nay" → {"type": "QUERY_ROOM_SCHEDULE", "params": {"room": "301", "date": "today"}}
`
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ]
            });

            const aiText = completion?.choices?.[0]?.message?.content;

            console.log('AI intent response:', aiText);

            if (!aiText) {
                return {
                    type: 'GENERAL_QUESTION',
                    params: {}
                };
            }

            // Vì response_format=json_object → chắc chắn là JSON
            return JSON.parse(aiText);

        } catch (error) {
            console.error('AI parseIntent error:', error.message);
            return {
                type: 'GENERAL_QUESTION',
                params: {}
            };
        }
    }
}

module.exports = new AIService();
