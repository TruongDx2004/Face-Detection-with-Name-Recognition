import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import '../styles/ImportModal.css';
import apiService from '../services/api-service';

const ImportModal = ({ 
    isOpen, 
    onClose, 
    onImport, 
    isLoading,
    type = 'users', // 'users', 'subjects', 'schedules'
    title,
    templateData,
    apiEndpoint
}) => {
    const [file, setFile] = useState(null);
    const [importErrors, setImportErrors] = useState([]);
    const [data, setData] = useState([]);
    const [preview, setPreview] = useState([]);
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Results
    const [importResults, setImportResults] = useState(null);
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);

    if (!isOpen) return null;

    const resetModal = () => {
        setFile(null);
        setData([]);
        setPreview([]);
        setImportErrors([]);
        setImportResults(null);
        setStep(1);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    const downloadTemplate = async () => {
        try {
            setLoading(true);
            
            // Fetch fresh template data if not available
            let templateToUse = templateData;
            if (!templateToUse && apiEndpoint) {
                const templateEndpoint = getTemplateEndpoint();
                if (templateEndpoint) {
                    const response = await apiService.get(templateEndpoint);
                    templateToUse = response.data;
                }
            }
            
            if (!templateToUse) {
                setImportErrors(['Không thể tải template. Vui lòng thử lại.']);
                return;
            }
            
            const ws = XLSX.utils.json_to_sheet(templateToUse.template);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Template');
            
            // Add instructions sheet
            if (templateToUse.instructions) {
                const instructionsData = [
                    ['HƯỚNG DẪN SỬ DỤNG'],
                    [''],
                    ['Các trường bắt buộc:', ...(templateToUse.instructions.required_fields || [])],
                    [''],
                    ['Ghi chú:'],
                    ...(templateToUse.instructions.notes || []).map(note => [note])
                ];
                
                if (templateToUse.instructions.field_descriptions) {
                    instructionsData.push([''], ['Mô tả các trường:']);
                    Object.entries(templateToUse.instructions.field_descriptions).forEach(([field, desc]) => {
                        instructionsData.push([field, desc]);
                    });
                }
                
                const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
                XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Hướng dẫn');
            }
            
            const fileName = `${type}_template.xlsx`;
            XLSX.writeFile(wb, fileName);
        } catch (error) {
            console.error('Error downloading template:', error);
            setImportErrors(['Lỗi khi tải template. Vui lòng thử lại.']);
        } finally {
            setLoading(false);
        }
    };

    const getTemplateEndpoint = () => {
        switch(type) {
            case 'users': return '/admin/users/import';
            case 'subjects': return '/subjects/template';
            case 'schedules': return '/subjects/schedules/template';
            case 'classes': return '/classes/import'; // Cần tạo endpoint này
            default: return null;
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
            setImportErrors(['Vui lòng chọn file Excel (.xlsx hoặc .xls)']);
            return;
        }

        setFile(selectedFile);
        setImportErrors([]);
        parseExcelFile(selectedFile);
    };

    const parseExcelFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length === 0) {
                    setImportErrors(['File Excel trống hoặc không có dữ liệu hợp lệ']);
                    return;
                }

                setData(jsonData);
                setPreview(jsonData.slice(0, 10)); // Show first 10 rows
                setStep(2);
            } catch (error) {
                console.error("Error parsing Excel file:", error);
                setImportErrors(['Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng file.']);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImport = async () => {
        try {
            setLoading(true);
            
            if (apiEndpoint) {
                // Use apiService for API calls
                const result = await apiService.post(apiEndpoint, data);
                setImportResults(result.data);
                setStep(3);
                
                if (onImport) {
                    onImport(result.data);
                }
            } else {
                // Use legacy callback method
                onImport(data);
                handleClose();
            }
        } catch (error) {
            console.error('Import error:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Lỗi khi import dữ liệu. Vui lòng thử lại.';
            setImportErrors([errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const validateData = () => {
        if (!templateData || !data.length) return { isValid: true, errors: [] };

        const errors = [];
        const requiredFields = templateData.instructions?.required_fields || [];
        const usedUsernames = new Set();
        const usedEmails = new Set();
        const usedStudentCodes = new Set();

        data.forEach((row, index) => {
            const rowNumber = index + 2;

            // Check required fields
            requiredFields.forEach(field => {
                if (!row[field] || row[field].toString().trim() === '') {
                    errors.push(`Dòng ${rowNumber}: Thiếu trường bắt buộc '${field}'`);
                }
            });

            // Validate for users type
            if (type === 'users') {
                // Check unique username
                if (row.username) {
                    const username = row.username.toString().trim();
                    if (usedUsernames.has(username)) {
                        errors.push(`Dòng ${rowNumber}: Username '${username}' bị trùng lặp trong file`);
                    } else {
                        usedUsernames.add(username);
                    }
                }

                // Check unique email
                if (row.email) {
                    const email = row.email.toString().trim();
                    if (usedEmails.has(email)) {
                        errors.push(`Dòng ${rowNumber}: Email '${email}' bị trùng lặp trong file`);
                    } else {
                        usedEmails.add(email);
                    }
                }

                // Validate role
                if (row.role) {
                    const role = row.role.toString().trim().toLowerCase();
                    if (!['student', 'teacher', 'admin'].includes(role)) {
                        errors.push(`Dòng ${rowNumber}: Role '${row.role}' không hợp lệ. Chỉ chấp nhận: student, teacher, admin`);
                    }

                    // Validate student-specific fields
                    if (role === 'student') {
                        if (row.class_name && row.student_code) {
                            const studentCode = row.student_code.toString().trim();
                            if (usedStudentCodes.has(studentCode)) {
                                errors.push(`Dòng ${rowNumber}: Mã sinh viên '${studentCode}' bị trùng lặp trong file`);
                            } else {
                                usedStudentCodes.add(studentCode);
                            }
                        } else if (row.class_name && !row.student_code) {
                            errors.push(`Dòng ${rowNumber}: Sinh viên có class_name nhưng thiếu student_code`);
                        } else if (!row.class_name && row.student_code) {
                            errors.push(`Dòng ${rowNumber}: Sinh viên có student_code nhưng thiếu class_name`);
                        }
                    } else {
                        // For teacher and admin, class_name and student_code should be empty
                        if (row.class_name && row.class_name.toString().trim() !== '') {
                            errors.push(`Dòng ${rowNumber}: ${role} không được có class_name`);
                        }
                        if (row.student_code && row.student_code.toString().trim() !== '') {
                            errors.push(`Dòng ${rowNumber}: ${role} không được có student_code`);
                        }
                    }
                }

                // Validate email format
                if (row.email) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(row.email.toString().trim())) {
                        errors.push(`Dòng ${rowNumber}: Email '${row.email}' không đúng định dạng`);
                    }
                }
            }

            // Validate for subjects type
            if (type === 'subjects') {
                if (row.name) {
                    const name = row.name.toString().trim();
                    if (name.length < 2) {
                        errors.push(`Dòng ${rowNumber}: Tên môn học phải có ít nhất 2 ký tự`);
                    }
                }
            }

            // Validate for schedules type
            if (type === 'schedules') {
                if (row.weekday !== undefined) {
                    const weekday = parseInt(row.weekday);
                    if (isNaN(weekday) || weekday < 0 || weekday > 6) {
                        errors.push(`Dòng ${rowNumber}: Weekday phải là số từ 0 (Chủ nhật) đến 6 (Thứ bảy)`);
                    }
                }

                // Validate time format
                const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
                if (row.start_time && !timeRegex.test(row.start_time.toString().trim())) {
                    errors.push(`Dòng ${rowNumber}: start_time phải có định dạng HH:MM:SS`);
                }
                if (row.end_time && !timeRegex.test(row.end_time.toString().trim())) {
                    errors.push(`Dòng ${rowNumber}: end_time phải có định dạng HH:MM:SS`);
                }

                // Validate time logic
                if (row.start_time && row.end_time) {
                    const startTime = row.start_time.toString().trim();
                    const endTime = row.end_time.toString().trim();
                    if (startTime >= endTime) {
                        errors.push(`Dòng ${rowNumber}: start_time phải nhỏ hơn end_time`);
                    }
                }
            }
        });

        return { isValid: errors.length === 0, errors };
    };

    const validation = validateData();

    const getStepTitle = () => {
        switch(type) {
            case 'users': return title || '👥 Import Người dùng từ Excel';
            case 'subjects': return title || '📚 Import Môn học từ Excel';
            case 'schedules': return title || '📅 Import Lịch học từ Excel';
            default: return title || '📥 Import dữ liệu từ Excel';
        }
    };

    return (
        <div className="import-modal-overlay" onClick={handleClose}>
            <div className="import-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{getStepTitle()}</h2>
                    <button className="close-btn" onClick={handleClose}>×</button>
                </div>

                <div className="modal-body">
                    {/* Step Indicator */}
                    <div className="step-indicator">
                        <div className={`step ${step >= 1 ? 'active' : ''}`}>
                            <span className="step-number">1</span>
                            <span className="step-label">Tải file</span>
                        </div>
                        <div className={`step ${step >= 2 ? 'active' : ''}`}>
                            <span className="step-number">2</span>
                            <span className="step-label">Xem trước</span>
                        </div>
                        <div className={`step ${step >= 3 ? 'active' : ''}`}>
                            <span className="step-number">3</span>
                            <span className="step-label">Kết quả</span>
                        </div>
                    </div>

                    {/* Step 1: Upload */}
                    {step === 1 && (
                        <div className="upload-section">
                            {templateData && (
                                <div className="template-section">
                                    <h3>📋 Tải Template</h3>
                                    <p>Tải template Excel để đảm bảo định dạng đúng</p>
                                    <button 
                                        className="btn btn-secondary"
                                        onClick={downloadTemplate}
                                    >
                                        📥 Tải Template
                                    </button>
                                </div>
                            )}

                            <div className="divider"></div>

                            <div className="file-upload-section">
                                <h3>📁 Tải file Excel</h3>
                                <div className="file-drop-zone">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".xlsx,.xls"
                                        className="file-input"
                                    />
                                    <div className="file-drop-content">
                                        <div className="upload-icon">📄</div>
                                        <p>Nhấp để chọn file Excel hoặc kéo thả</p>
                                        <small>Hỗ trợ file .xlsx và .xls</small>
                                    </div>
                                </div>
                            </div>

                            {templateData?.instructions && (
                                <div className="instructions-section">
                                    <h3>📝 Hướng dẫn</h3>
                                    <div className="instructions-content">
                                        <div className="required-fields">
                                            <strong>Các trường bắt buộc:</strong>
                                            <ul>
                                                {templateData.instructions.required_fields?.map((field, index) => (
                                                    <li key={index}>{field}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        {templateData.instructions.notes && (
                                            <div className="notes">
                                                <strong>Ghi chú:</strong>
                                                <ul>
                                                    {templateData.instructions.notes.map((note, index) => (
                                                        <li key={index}>{note}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Preview */}
                    {step === 2 && (
                        <div className="preview-section">
                            <div className="preview-header">
                                <h3>📊 Xem trước dữ liệu</h3>
                                <p>Tìm thấy {data.length} dòng. Hiển thị {Math.min(10, data.length)} dòng đầu:</p>
                            </div>

                            {!validation.isValid && (
                                <div className="validation-errors">
                                    <h4>⚠️ Lỗi xác thực:</h4>
                                    <ul>
                                        {validation.errors.slice(0, 10).map((error, index) => (
                                            <li key={index} className="error-item">{error}</li>
                                        ))}
                                    </ul>
                                    {validation.errors.length > 10 && (
                                        <p>... và {validation.errors.length - 10} lỗi khác</p>
                                    )}
                                </div>
                            )}

                            <div className="preview-table-container">
                                <table className="preview-table">
                                    <thead>
                                        <tr>
                                            {Object.keys(preview[0] || {}).map(key => (
                                                <th key={key}>{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, index) => (
                                            <tr key={index}>
                                                {Object.values(row).map((value, cellIndex) => (
                                                    <td key={cellIndex}>{value}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="preview-actions">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => setStep(1)}
                                >
                                    ← Quay lại
                                </button>
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleImport}
                                    disabled={isLoading || !validation.isValid}
                                >
                                    {isLoading ? 'Đang import...' : `Import ${data.length} bản ghi`}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Results */}
                    {step === 3 && importResults && (
                        <div className="results-section">
                            <div className="results-summary">
                                <h3>📈 Kết quả Import</h3>
                                <div className="summary-cards">
                                    <div className="summary-card success">
                                        <div className="card-number">{importResults.summary?.success || 0}</div>
                                        <div className="card-label">Thành công</div>
                                    </div>
                                    <div className="summary-card error">
                                        <div className="card-number">{importResults.summary?.failure || 0}</div>
                                        <div className="card-label">Thất bại</div>
                                    </div>
                                    <div className="summary-card total">
                                        <div className="card-number">{importResults.summary?.total || 0}</div>
                                        <div className="card-label">Tổng cộng</div>
                                    </div>
                                </div>
                            </div>

                            {importResults.results?.some(r => r.status === 'failure') && (
                                <div className="failed-records">
                                    <h4>❌ Bản ghi lỗi:</h4>
                                    <div className="failed-records-list">
                                        {importResults.results
                                            .filter(r => r.status === 'failure')
                                            .slice(0, 20)
                                            .map((result, index) => (
                                                <div key={index} className="failed-record">
                                                    <span className="row-number">Dòng {result.row}:</span>
                                                    <span className="error-message">{result.message}</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            <div className="results-actions">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={resetModal}
                                >
                                    Import thêm
                                </button>
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleClose}
                                >
                                    Hoàn thành
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error Messages */}
                    {importErrors.length > 0 && (
                        <div className="error-messages">
                            {importErrors.map((error, index) => (
                                <div key={index} className="error-message">{error}</div>
                            ))}
                        </div>
                    )}
                </div>

                {isLoading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <p>Đang xử lý...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImportModal;