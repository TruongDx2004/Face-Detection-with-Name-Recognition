const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const faceService = require('../services/faceService');
const db = require('../config/database');

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|mp4|avi|mov/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed'));
        }
    }
});

class FaceController {

    // Đăng ký khuôn mặt từ video
    async registerFaceFromVideo(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const userId = req.user.id;
            const videoPath = req.file.path;

            // Tạo dataset từ video
            const result = await faceService.createDatasetFromVideo(videoPath, userId);

            // Cập nhật trạng thái face_trained cho user
            await db.execute(
                'UPDATE users SET face_trained = TRUE WHERE id = ?',
                [userId]
            );

            // Xóa file video sau khi xử lý
            await fs.unlink(videoPath);

            res.json({
                message: 'Face registration successful',
                result: result.output
            });
        } catch (error) {
            console.error('Face registration error:', error);
            
            // Xóa file nếu có lỗi
            if (req.file) {
                try {
                    await fs.unlink(req.file.path);
                } catch (unlinkError) {
                    console.error('Error deleting file:', unlinkError);
                }
            }

            res.status(500).json({ 
                error: 'Face registration failed',
                message: error.message 
            });
        }
    }

    // Đăng ký khuôn mặt từ ảnh
    async registerFaceFromImage(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const userId = req.user.id;
            const imagePath = req.file.path;

            // Tạo thư mục dataset cho user nếu chưa có
            const userDatasetDir = `dataset/User.${userId}`;
            await fs.mkdir(userDatasetDir, { recursive: true });

            // Copy ảnh vào thư mục dataset
            const timestamp = Date.now();
            const datasetImagePath = `${userDatasetDir}/User.${userId}.${timestamp}.jpg`;
            await fs.copyFile(imagePath, datasetImagePath);

            // Xóa file upload tạm
            await fs.unlink(imagePath);

            res.json({
                message: 'Face image registered successfully',
                imagePath: datasetImagePath
            });
        } catch (error) {
            console.error('Face image registration error:', error);
            
            if (req.file) {
                try {
                    await fs.unlink(req.file.path);
                } catch (unlinkError) {
                    console.error('Error deleting file:', unlinkError);
                }
            }

            res.status(500).json({ 
                error: 'Face image registration failed',
                message: error.message 
            });
        }
    }

    // Huấn luyện model
    async trainModel(req, res) {
        try {
            const result = await faceService.trainFaceModel();

            res.json({
                message: 'Model training completed successfully',
                result: result.output
            });
        } catch (error) {
            console.error('Model training error:', error);
            res.status(500).json({ 
                error: 'Model training failed',
                message: error.message 
            });
        }
    }

    // Nhận diện khuôn mặt
    async recognizeFace(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const imagePath = req.file.path;

            // Kiểm tra model đã được huấn luyện chưa
            const isModelTrained = await faceService.isModelTrained();
            if (!isModelTrained) {
                await fs.unlink(imagePath);
                return res.status(400).json({ error: 'Model not trained yet' });
            }

            // Nhận diện khuôn mặt
            const result = await faceService.recognizeFace(imagePath);

            // Xóa file ảnh sau khi xử lý
            await fs.unlink(imagePath);

            res.json({
                message: 'Face recognition completed',
                result
            });
        } catch (error) {
            console.error('Face recognition error:', error);
            
            if (req.file) {
                try {
                    await fs.unlink(req.file.path);
                } catch (unlinkError) {
                    console.error('Error deleting file:', unlinkError);
                }
            }

            res.status(500).json({ 
                error: 'Face recognition failed',
                message: error.message 
            });
        }
    }

    // Lấy thống kê dataset
    async getDatasetStats(req, res) {
        try {
            const stats = await faceService.getDatasetStats();
            
            // Lấy thông tin user tương ứng
            const userIds = Object.keys(stats);
            if (userIds.length > 0) {
                const placeholders = userIds.map(() => '?').join(',');
                const [users] = await db.execute(
                    `SELECT id, username, full_name FROM users WHERE id IN (${placeholders})`,
                    userIds
                );

                const userMap = {};
                users.forEach(user => {
                    userMap[user.id] = user;
                });

                const detailedStats = {};
                Object.keys(stats).forEach(userId => {
                    detailedStats[userId] = {
                        imageCount: stats[userId],
                        user: userMap[userId] || null
                    };
                });

                res.json({
                    stats: detailedStats,
                    totalUsers: Object.keys(stats).length,
                    totalImages: Object.values(stats).reduce((sum, count) => sum + count, 0)
                });
            } else {
                res.json({
                    stats: {},
                    totalUsers: 0,
                    totalImages: 0
                });
            }
        } catch (error) {
            console.error('Get dataset stats error:', error);
            res.status(500).json({ 
                error: 'Failed to get dataset statistics',
                message: error.message 
            });
        }
    }

    // Kiểm tra trạng thái model
    async getModelStatus(req, res) {
        try {
            const isModelTrained = await faceService.isModelTrained();
            const stats = await faceService.getDatasetStats();
            
            res.json({
                isModelTrained,
                datasetStats: stats,
                totalUsers: Object.keys(stats).length,
                totalImages: Object.values(stats).reduce((sum, count) => sum + count, 0)
            });
        } catch (error) {
            console.error('Get model status error:', error);
            res.status(500).json({ 
                error: 'Failed to get model status',
                message: error.message 
            });
        }
    }
}

const faceController = new FaceController();

// Export both the instance and the upload middleware
module.exports = faceController;
module.exports.uploadMiddleware = upload.single('file');