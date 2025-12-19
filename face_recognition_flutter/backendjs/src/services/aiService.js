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
2. QUERY_ATTENDANCE: {"type": "QUERY_ATTENDANCE", "params": {"class": "class name", "date": "today|yesterday"}}
3. QUERY_GRADES: {"type": "QUERY_GRADES", "params": {"studentName": "student name"}}
4. QUERY_ASSIGNMENTS: {"type": "QUERY_ASSIGNMENTS", "params": {"class": "class name", "week": number}}
5. GENERAL_QUESTION: {"type": "GENERAL_QUESTION", "params": {}}

Examples:
- "Danh sách sinh viên lớp CNTT K20" → {"type": "QUERY_STUDENT_LIST", "params": {"class": "CNTT K20"}}
- "Điểm danh lớp 12A1 hôm nay" → {"type": "QUERY_ATTENDANCE", "params": {"class": "12A1", "date": "today"}}
- "Điểm của Nguyễn Văn A" → {"type": "QUERY_GRADES", "params": {"studentName": "Nguyễn Văn A"}}
- "Ai chưa nộp bài tập tuần 3 lớp CNTT K20" → {"type": "QUERY_ASSIGNMENTS", "params": {"class": "CNTT K20", "week": 3}}
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
