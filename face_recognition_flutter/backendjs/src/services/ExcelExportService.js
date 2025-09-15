const ExcelJS = require('exceljs');
const db = require('../config/database');

class ExcelExportService {
    static async exportGradebook(courseSectionId) {
        try {
            // Tạo workbook mới
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Bảng Điểm');

            // Lấy thông tin course section
            const [courseSectionInfo] = await db.execute(`
                SELECT cs.*, c.name as class_name, s.name as subject_name, s.credits,
                       u.full_name as teacher_name
                FROM course_sections cs
                JOIN classes c ON cs.class_id = c.id
                JOIN subjects s ON cs.subject_id = s.id
                JOIN users u ON cs.teacher_id = u.id
                WHERE cs.id = ?
            `, [courseSectionId]);

            if (courseSectionInfo.length === 0) {
                throw new Error('Course section not found');
            }

            const courseSection = courseSectionInfo[0];

            // Lấy cấu hình điểm
            const [gradeConfig] = await db.execute(`
                SELECT * FROM grade_configurations WHERE course_section_id = ?
            `, [courseSectionId]);

            const config = gradeConfig[0] || {
                assignment_weight: 30,
                exam_weight: 60,
                attendance_weight: 10,
                passing_score: 5.0
            };

            // Lấy danh sách bài tập đang hoạt động
            const [assignments] = await db.execute(`
                SELECT a.id, a.title, a.max_score, a.due_date
                FROM assignments a
                WHERE a.course_section_id = ? AND a.is_active = TRUE
                ORDER BY a.due_date ASC
            `, [courseSectionId]);

            // Lấy danh sách bài kiểm tra đang hoạt động
            const [exams] = await db.execute(`
                SELECT e.id, e.title, e.max_score, e.exam_date
                FROM exams e
                WHERE e.course_section_id = ? AND e.is_active = TRUE
                ORDER BY e.exam_date ASC
            `, [courseSectionId]);

            // Lấy danh sách sinh viên và điểm
            const [students] = await db.execute(`
                SELECT DISTINCT u.id, u.full_name, cs_student.student_code,
                       g.assignment_avg, g.exam_avg, g.attendance_score,
                       g.final_score, g.letter_grade, g.is_passed
                FROM users u 
                JOIN class_students cs_student ON u.id = cs_student.student_id 
                JOIN course_sections course ON cs_student.class_id = course.class_id
                LEFT JOIN gradebook g ON u.id = g.student_id AND g.course_section_id = course.id
                WHERE course.id = ? AND u.role = 'student'
                ORDER BY cs_student.student_code ASC
            `, [courseSectionId]);

            // Lấy điểm bài tập cho tất cả sinh viên (bao gồm cả điểm 0 cho bài chưa nộp)
            const assignmentScores = {};
            for (const assignment of assignments) {
                const [scores] = await db.execute(`
                    SELECT asub.student_id, asub.score
                    FROM assignment_submissions asub
                    WHERE asub.assignment_id = ?
                `, [assignment.id]);
                
                assignmentScores[assignment.id] = {};
                
                // Khởi tạo điểm 0 cho tất cả sinh viên
                students.forEach(student => {
                    assignmentScores[assignment.id][student.id] = 0;
                });
                
                // Cập nhật điểm thực tế cho những sinh viên đã nộp bài
                scores.forEach(score => {
                    if (score.score !== null) {
                        assignmentScores[assignment.id][score.student_id] = score.score;
                    }
                });
            }

            // Lấy điểm kiểm tra cho tất cả sinh viên (bao gồm cả điểm 0 cho bài chưa thi)
            const examScores = {};
            for (const exam of exams) {
                const [scores] = await db.execute(`
                    SELECT er.student_id, er.score
                    FROM exam_results er
                    WHERE er.exam_id = ?
                `, [exam.id]);
                
                examScores[exam.id] = {};
                
                // Khởi tạo điểm 0 cho tất cả sinh viên
                students.forEach(student => {
                    examScores[exam.id][student.id] = 0;
                });
                
                // Cập nhật điểm thực tế cho những sinh viên đã thi
                scores.forEach(score => {
                    if (score.score !== null) {
                        examScores[exam.id][score.student_id] = score.score;
                    }
                });
            }

            // Thiết lập header thông tin
            await this.setupWorksheetHeader(worksheet, courseSection, config);

            // Thiết lập bảng điểm
            await this.setupGradebookTable(worksheet, students, assignments, exams, assignmentScores, examScores, config);

            // Thiết lập footer
            await this.setupWorksheetFooter(worksheet, students.length, courseSection);

            return workbook;

        } catch (error) {
            console.error('Export gradebook error:', error);
            throw error;
        }
    }

    static async setupWorksheetHeader(worksheet, courseSection, config) {
        // Thiết lập chiều rộng cột
        worksheet.columns = [
            { width: 5 },   // STT
            { width: 12 },  // Mã SV
            { width: 25 },  // Họ tên
            { width: 10 },  // Cột điểm
            { width: 10 },  // Cột điểm
        ];

        // Header chính
        worksheet.mergeCells('A1:H1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'BẢNG ĐIỂM';
        titleCell.font = { name: 'Times New Roman', size: 18, bold: true };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        titleCell.font.color = { argb: 'FFFFFFFF' };

        // Thông tin môn học
        let currentRow = 3;
        
        worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
        const subjectCell = worksheet.getCell(`A${currentRow}`);
        subjectCell.value = `Môn học: ${courseSection.subject_name} - ${courseSection.name}`;
        subjectCell.font = { name: 'Times New Roman', size: 14, bold: true };
        subjectCell.alignment = { horizontal: 'center' };

        currentRow++;
        worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = `Lớp: ${courseSection.class_name}`;
        worksheet.getCell(`A${currentRow}`).font = { name: 'Times New Roman', size: 12 };

        worksheet.mergeCells(`E${currentRow}:H${currentRow}`);
        worksheet.getCell(`E${currentRow}`).value = `Học kỳ: ${courseSection.semester} - ${courseSection.academic_year}`;
        worksheet.getCell(`E${currentRow}`).font = { name: 'Times New Roman', size: 12 };

        currentRow++;
        worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = `Giảng viên: ${courseSection.teacher_name}`;
        worksheet.getCell(`A${currentRow}`).font = { name: 'Times New Roman', size: 12 };

        worksheet.mergeCells(`E${currentRow}:H${currentRow}`);
        worksheet.getCell(`E${currentRow}`).value = `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
        worksheet.getCell(`E${currentRow}`).font = { name: 'Times New Roman', size: 12 };

        // Cấu hình điểm
        currentRow += 2;
        worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
        const configCell = worksheet.getCell(`A${currentRow}`);
        configCell.value = `Cấu hình điểm: Bài tập (${config.assignment_weight}%) + Kiểm tra (${config.exam_weight}%) + Chuyên cần (${config.attendance_weight}%) | Điểm đậu: ${config.passing_score}`;
        configCell.font = { name: 'Times New Roman', size: 11, italic: true };
        configCell.alignment = { horizontal: 'center' };
        configCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
        };

        return currentRow + 2; // Trả về dòng để bắt đầu bảng
    }

    static async setupGradebookTable(worksheet, students, assignments, exams, assignmentScores, examScores, config) {
        const startRow = 8;
        let currentCol = 1;

        // Header bảng điểm
        const headerStyle = {
            font: { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } },
            alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
            border: {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            }
        };

        // Cột STT
        worksheet.getCell(startRow, currentCol).value = 'STT';
        worksheet.getCell(startRow, currentCol).style = headerStyle;
        currentCol++;

        // Cột Mã SV
        worksheet.getCell(startRow, currentCol).value = 'Mã SV';
        worksheet.getCell(startRow, currentCol).style = headerStyle;
        currentCol++;

        // Cột Họ tên
        worksheet.getCell(startRow, currentCol).value = 'Họ và tên';
        worksheet.getCell(startRow, currentCol).style = headerStyle;
        currentCol++;

        // Cột điểm bài tập
        assignments.forEach((assignment, index) => {
            worksheet.getCell(startRow, currentCol).value = `BT${index + 1}\n(${assignment.max_score}đ)`;
            worksheet.getCell(startRow, currentCol).style = headerStyle;
            worksheet.getColumn(currentCol).width = 8;
            currentCol++;
        });

        // Cột điểm kiểm tra
        exams.forEach((exam, index) => {
            worksheet.getCell(startRow, currentCol).value = `KT${index + 1}\n(${exam.max_score}đ)`;
            worksheet.getCell(startRow, currentCol).style = headerStyle;
            worksheet.getColumn(currentCol).width = 8;
            currentCol++;
        });

        // Cột tổng kết
        const summaryHeaders = ['TB BT', 'TB KT', 'Chuyên cần', 'Điểm cuối', 'Xếp loại', 'Kết quả'];
        summaryHeaders.forEach(header => {
            worksheet.getCell(startRow, currentCol).value = header;
            worksheet.getCell(startRow, currentCol).style = headerStyle;
            worksheet.getColumn(currentCol).width = 10;
            currentCol++;
        });

        // Thiết lập chiều cao cho header
        worksheet.getRow(startRow).height = 40;

        // Dữ liệu sinh viên
        students.forEach((student, studentIndex) => {
            const row = startRow + 1 + studentIndex;
            let col = 1;

            const cellStyle = {
                font: { name: 'Times New Roman', size: 10 },
                alignment: { horizontal: 'center', vertical: 'middle' },
                border: {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                }
            };

            // STT
            worksheet.getCell(row, col).value = studentIndex + 1;
            worksheet.getCell(row, col).style = cellStyle;
            col++;

            // Mã SV
            worksheet.getCell(row, col).value = student.student_code;
            worksheet.getCell(row, col).style = { ...cellStyle, alignment: { horizontal: 'left', vertical: 'middle' } };
            col++;

            // Họ tên
            worksheet.getCell(row, col).value = student.full_name;
            worksheet.getCell(row, col).style = { ...cellStyle, alignment: { horizontal: 'left', vertical: 'middle' } };
            col++;

            // Điểm bài tập
            assignments.forEach(assignment => {
                const score = assignmentScores[assignment.id]?.[student.id];
                worksheet.getCell(row, col).value = score !== undefined ? score : 0;
                worksheet.getCell(row, col).style = cellStyle;
                
                // Tô màu theo điểm (bao gồm cả điểm 0)
                const actualScore = score !== undefined ? score : 0;
                if (actualScore >= 8) {
                    worksheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD5EDDA' } };
                } else if (actualScore >= 5) {
                    worksheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF7CD' } };
                } else {
                    worksheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
                }
                col++;
            });

            // Điểm kiểm tra
            exams.forEach(exam => {
                const score = examScores[exam.id]?.[student.id];
                worksheet.getCell(row, col).value = score !== undefined ? score : 0;
                worksheet.getCell(row, col).style = cellStyle;
                
                // Tô màu theo điểm (bao gồm cả điểm 0)
                const actualScore = score !== undefined ? score : 0;
                if (actualScore >= 8) {
                    worksheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD5EDDA' } };
                } else if (actualScore >= 5) {
                    worksheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF7CD' } };
                } else {
                    worksheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
                }
                col++;
            });

            // Điểm tổng kết
            const summaryStyle = { ...cellStyle, font: { name: 'Times New Roman', size: 10, bold: true } };

            // TB BT
            worksheet.getCell(row, col).value = student.assignment_avg ? parseFloat(student.assignment_avg).toFixed(1) : '';
            worksheet.getCell(row, col).style = summaryStyle;
            col++;

            // TB KT
            worksheet.getCell(row, col).value = student.exam_avg ? parseFloat(student.exam_avg).toFixed(1) : '';
            worksheet.getCell(row, col).style = summaryStyle;
            col++;

            // Chuyên cần
            worksheet.getCell(row, col).value = student.attendance_score ? parseFloat(student.attendance_score).toFixed(1) : '';
            worksheet.getCell(row, col).style = summaryStyle;
            col++;

            // Điểm cuối
            const finalScore = student.final_score ? parseFloat(student.final_score) : 0;
            worksheet.getCell(row, col).value = finalScore ? finalScore.toFixed(1) : '';
            worksheet.getCell(row, col).style = {
                ...summaryStyle,
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: finalScore >= config.passing_score ? 'FFD5EDDA' : 'FFF8D7DA' }
                }
            };
            col++;

            // Xếp loại
            worksheet.getCell(row, col).value = student.letter_grade || '';
            worksheet.getCell(row, col).style = summaryStyle;
            col++;

            // Kết quả
            const result = student.is_passed ? 'Đậu' : 'Rớt';
            worksheet.getCell(row, col).value = result;
            worksheet.getCell(row, col).style = {
                ...summaryStyle,
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: student.is_passed ? 'FFD5EDDA' : 'FFF8D7DA' }
                }
            };
        });
    }

    static async setupWorksheetFooter(worksheet, studentCount, courseSection) {
        const lastRow = worksheet.rowCount + 2;

        // Thống kê
        worksheet.mergeCells(`A${lastRow}:C${lastRow}`);
        const statsCell = worksheet.getCell(`A${lastRow}`);
        statsCell.value = `Tổng số sinh viên: ${studentCount}`;
        statsCell.font = { name: 'Times New Roman', size: 11, bold: true };

        // Chữ ký
        const signatureRow = lastRow + 3;
        worksheet.mergeCells(`A${signatureRow}:C${signatureRow}`);
        worksheet.getCell(`A${signatureRow}`).value = 'GIẢNG VIÊN';
        worksheet.getCell(`A${signatureRow}`).font = { name: 'Times New Roman', size: 12, bold: true };
        worksheet.getCell(`A${signatureRow}`).alignment = { horizontal: 'center' };

        worksheet.mergeCells(`E${signatureRow}:H${signatureRow}`);
        worksheet.getCell(`E${signatureRow}`).value = 'TRƯỞNG KHOA';
        worksheet.getCell(`E${signatureRow}`).font = { name: 'Times New Roman', size: 12, bold: true };
        worksheet.getCell(`E${signatureRow}`).alignment = { horizontal: 'center' };

        // Tên giảng viên
        const nameRow = signatureRow + 4;
        worksheet.mergeCells(`A${nameRow}:C${nameRow}`);
        worksheet.getCell(`A${nameRow}`).value = courseSection.teacher_name;
        worksheet.getCell(`A${nameRow}`).font = { name: 'Times New Roman', size: 11 };
        worksheet.getCell(`A${nameRow}`).alignment = { horizontal: 'center' };
    }
}

module.exports = ExcelExportService;