import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import styles from './styles'; // Assuming you have a styles.js file for your styles

const ImportModal = ({ isOpen, onClose, onImport, isLoading }) => {
    const [file, setFile] = useState(null);
    const [importErrors, setImportErrors] = useState([]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setImportErrors([]);
    };

    const handleImport = () => {
        if (!file) {
            setImportErrors(['Vui lòng chọn một tệp Excel để nhập.']);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Assuming the first row is the header
                const headers = jsonData[0].map(h => h.toLowerCase().trim().replace(/\s/g, '_'));
                const usersToImport = [];

                // Skip header row
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row.length === 0 || row.every(cell => cell === null || cell === '')) continue;

                    const user = {};
                    headers.forEach((header, index) => {
                        user[header] = row[index] || '';
                    });
                    usersToImport.push(user);
                }

                // Call the parent function with the processed data
                onImport(usersToImport);

            } catch (error) {
                console.error("Error reading Excel file:", error);
                setImportErrors(['Lỗi khi đọc tệp Excel. Vui lòng đảm bảo tệp đúng định dạng.']);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div style={styles.modal} onClick={onClose}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                    <h3 style={styles.modalTitle}>Nhập dữ liệu từ Excel</h3>
                    <button style={styles.modalClose} onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div style={styles.modalBody}>
                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>
                            Chọn tệp Excel (*.xlsx, *.xls)
                        </label>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            style={{ padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                        />
                    </div>
                    {file && (
                        <div style={{ marginTop: '1rem', color: '#4b5563' }}>
                            Đã chọn: **{file.name}**
                        </div>
                    )}
                    {importErrors.length > 0 && (
                        <div style={{ marginTop: '1rem', color: '#dc2626' }}>
                            {importErrors.map((err, index) => (
                                <p key={index}>{err}</p>
                            ))}
                        </div>
                    )}
                </div>
                <div style={styles.modalFooter}>
                    <button
                        style={{ ...styles.btn, ...styles.btnOutline }}
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Hủy
                    </button>
                    <button
                        style={{ ...styles.btn, ...styles.btnPrimary }}
                        onClick={handleImport}
                        disabled={isLoading || !file}
                    >
                        {isLoading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Đang nhập...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-file-import"></i>
                                Bắt đầu nhập
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportModal;