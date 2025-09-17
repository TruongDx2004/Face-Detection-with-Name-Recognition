const db = require('../config/database');

/**
 * Tự động tạo các phiên điểm danh dựa trên lịch học
 * @param {number} scheduleId - ID của lịch học
 * @param {number} courseSectionId - ID của course section
 * @param {number} weekday - Thứ trong tuần (1=Monday, 7=Sunday)
 * @param {string} startDate - Ngày bắt đầu (YYYY-MM-DD)
 * @param {number} totalSessions - Tổng số buổi học
 * @param {string} startTime - Giờ bắt đầu (HH:MM:SS)
 * @param {string} endTime - Giờ kết thúc (HH:MM:SS)
 */
async function generateAttendanceSessions(scheduleId, courseSectionId, weekday, startDate, totalSessions, startTime, endTime) {
    try {
        console.log('Generating attendance sessions for schedule:', {
            scheduleId,
            courseSectionId,
            weekday,
            startDate,
            totalSessions,
            startTime,
            endTime
        });

        const sessions = [];
        const start = new Date(startDate);
        
        // Đảm bảo ngày bắt đầu là đúng thứ trong tuần
        // JavaScript getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
        // Database weekday: 1=Monday, 2=Tuesday, ..., 7=Sunday
        const jsWeekday = weekday === 7 ? 0 : weekday; // Convert 7 (Sunday) to 0
        const dayDiff = jsWeekday - start.getDay();
        if (dayDiff !== 0) {
            if (dayDiff > 0) {
                start.setDate(start.getDate() + dayDiff);
            } else {
                start.setDate(start.getDate() + (7 + dayDiff));
            }
        }

        // Tạo các phiên điểm danh cho mỗi tuần
        for (let i = 0; i < totalSessions; i++) {
            const sessionDate = new Date(start);
            sessionDate.setDate(start.getDate() + (i * 7)); // Cách nhau 1 tuần
            
            const sessionDateStr = sessionDate.toISOString().split('T')[0];
            const sessionName = `Buổi ${i + 1} - ${sessionDateStr}`;
            
            sessions.push({
                course_section_id: courseSectionId,
                session_date: sessionDateStr,
                start_time: startTime,
                end_time: endTime,
                session_name: sessionName,
                schedule_id: scheduleId
            });
        }

        // Insert tất cả sessions vào database
        const insertPromises = sessions.map(async (session) => {
            // Kiểm tra session đã tồn tại chưa
            const [existing] = await db.execute(
                'SELECT id FROM attendance_sessions WHERE course_section_id = ? AND session_date = ? AND schedule_id = ?',
                [session.course_section_id, session.session_date, session.schedule_id]
            );

            if (existing.length === 0) {
                const [result] = await db.execute(
                    `INSERT INTO attendance_sessions 
                    (course_section_id, session_date, start_time, end_time, session_name, schedule_id, is_active) 
                    VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
                    [
                        session.course_section_id,
                        session.session_date,
                        session.start_time,
                        session.end_time,
                        session.session_name,
                        session.schedule_id
                    ]
                );
                return { ...session, id: result.insertId, created: true };
            } else {
                return { ...session, id: existing[0].id, created: false };
            }
        });

        const results = await Promise.all(insertPromises);
        
        console.log(`Generated ${results.length} attendance sessions, ${results.filter(r => r.created).length} new sessions created`);
        
        return {
            success: true,
            sessions: results,
            total: results.length,
            created: results.filter(r => r.created).length
        };

    } catch (error) {
        console.error('Error generating attendance sessions:', error);
        throw new Error(`Failed to generate attendance sessions: ${error.message}`);
    }
}

/**
 * Cập nhật các phiên điểm danh khi lịch học thay đổi
 * @param {number} scheduleId - ID của lịch học
 * @param {object} updateData - Dữ liệu cập nhật
 */
async function updateAttendanceSessions(scheduleId, updateData) {
    try {
        // Lấy thông tin schedule hiện tại
        const [schedules] = await db.execute(
            'SELECT * FROM schedules WHERE id = ?',
            [scheduleId]
        );

        if (schedules.length === 0) {
            throw new Error('Schedule not found');
        }

        const schedule = schedules[0];

        // Nếu có thay đổi về thời gian hoặc ngày, cập nhật các sessions
        if (updateData.start_time || updateData.end_time || updateData.start_date || updateData.total_sessions) {
            // Xóa các sessions chưa diễn ra (ngày trong tương lai)
            await db.execute(
                'DELETE FROM attendance_sessions WHERE schedule_id = ? AND session_date > CURDATE()',
                [scheduleId]
            );

            // Tạo lại các sessions mới
            const newStartDate = updateData.start_date || schedule.start_date;
            const newTotalSessions = updateData.total_sessions || schedule.total_sessions;
            const newStartTime = updateData.start_time || schedule.start_time;
            const newEndTime = updateData.end_time || schedule.end_time;

            return await generateAttendanceSessions(
                scheduleId,
                schedule.course_section_id,
                schedule.weekday,
                newStartDate,
                newTotalSessions,
                newStartTime,
                newEndTime
            );
        }

        return { success: true, message: 'No attendance sessions update needed' };

    } catch (error) {
        console.error('Error updating attendance sessions:', error);
        throw new Error(`Failed to update attendance sessions: ${error.message}`);
    }
}

/**
 * Xóa tất cả phiên điểm danh liên quan đến một lịch học
 * @param {number} scheduleId - ID của lịch học
 */
async function deleteAttendanceSessions(scheduleId) {
    try {
        // Chỉ xóa các sessions chưa diễn ra hoặc chưa có attendance records
        const [result] = await db.execute(`
            DELETE ats FROM attendance_sessions ats
            LEFT JOIN attendances a ON ats.id = a.session_id
            WHERE ats.schedule_id = ? AND (ats.session_date > CURDATE() OR a.id IS NULL)
        `, [scheduleId]);

        return {
            success: true,
            deletedCount: result.affectedRows
        };

    } catch (error) {
        console.error('Error deleting attendance sessions:', error);
        throw new Error(`Failed to delete attendance sessions: ${error.message}`);
    }
}

module.exports = {
    generateAttendanceSessions,
    updateAttendanceSessions,
    deleteAttendanceSessions
};