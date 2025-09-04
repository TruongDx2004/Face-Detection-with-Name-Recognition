const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const faceService = require('../services/faceService');
const db = require('../config/database');

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = file.fieldname === 'video' ? 'uploads/videos' : 'uploads/images';
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'video') {
            if (file.mimetype.startsWith('video/')) {
                cb(null, true);
            } else {
                cb(new Error('Only video files are allowed for video field'));
            }
        } else if (file.fieldname === 'image' || file.fieldname === 'file') {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed for image field'));
            }
        } else {
            cb(new Error('Unknown field'));
        }
    }
});

class FaceController {

    // Upload video để tạo dataset (từ face.js)
    async uploadVideo(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Video file is required' });
            }

            const userId = parseInt(req.body.userId) || req.user.id;
            const videoPath = req.file.path;

            // Create dataset from video
            const result = await faceService.createDatasetFromVideo(videoPath, userId);

            // Update user's face_trained status
            await db.execute(
                'UPDATE users SET face_trained = FALSE WHERE id = ?',
                [userId]
            );

            // Save face images record
            await db.execute(
                'INSERT INTO face_images (user_id, image_path) VALUES (?, ?)',
                [userId, videoPath]
            );

            // Train model ngay sau khi tạo dataset
            const trainResult = await faceService.trainFaceModel();

            // Cập nhật lại trạng thái face_trained sau khi train
            const stats = await faceService.getDatasetStats();
            for (const uid of Object.keys(stats)) {
                await db.execute(
                    'UPDATE users SET face_trained = TRUE WHERE id = ?',
                    [parseInt(uid)]
                );
            }

            res.json({
                message: 'Video uploaded, dataset created and model trained successfully',
                dataset_result: result,
                train_result: trainResult
            });
            
        } catch (error) {
            console.error('Video upload error:', error);
            res.status(500).json({ error: 'Video upload failed: ' + error.message });
        }
    }

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

    // Huấn luyện model (cập nhật từ face.js)
    async trainModel(req, res) {
        try {
            // Check if dataset exists
            const stats = await faceService.getDatasetStats();
            if (Object.keys(stats).length === 0) {
                return res.status(400).json({ error: 'No dataset found. Please upload videos first.' });
            }

            // Train the model
            const result = await faceService.trainFaceModel();

            // Update all users with dataset to face_trained = TRUE
            for (const userId of Object.keys(stats)) {
                await db.execute(
                    'UPDATE users SET face_trained = TRUE WHERE id = ?',
                    [parseInt(userId)]
                );
            }

            res.json({
                message: 'Face recognition model trained successfully',
                stats: stats,
                result: result
            });

        } catch (error) {
            console.error('Model training error:', error);
            res.status(500).json({ error: 'Model training failed: ' + error.message });
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

    // Lấy thống kê dataset (cập nhật từ face.js)
    async getDatasetStats(req, res) {
        try {
            const stats = await faceService.getDatasetStats();

            // Get user names for the stats
            const userIds = Object.keys(stats);
            const userDetails = {};

            if (userIds.length > 0) {
                const placeholders = userIds.map(() => '?').join(',');
                const [users] = await db.execute(
                    `SELECT id, full_name, username FROM users WHERE id IN (${placeholders})`,
                    userIds
                );

                users.forEach(user => {
                    userDetails[user.id] = {
                        full_name: user.full_name,
                        username: user.username,
                        image_count: stats[user.id]
                    };
                });
            }

            res.json({
                message: 'Dataset statistics retrieved successfully',
                stats: userDetails,
                total_users: Object.keys(stats).length,
                total_images: Object.values(stats).reduce((sum, count) => sum + count, 0)
            });

        } catch (error) {
            console.error('Dataset stats error:', error);
            res.status(500).json({ error: 'Failed to get dataset statistics' });
        }
    }

    // Kiểm tra trạng thái model (cập nhật từ face.js)
    async getModelStatus(req, res) {
        try {
            const isModelTrained = await faceService.isModelTrained();
            const stats = await faceService.getDatasetStats();

            res.json({
                model_trained: isModelTrained,
                dataset_available: Object.keys(stats).length > 0,
                dataset_stats: stats
            });

        } catch (error) {
            console.error('Model status error:', error);
            res.status(500).json({ error: 'Failed to get model status' });
        }
    }
}

const faceController = new FaceController();

// Export both the instance and the upload middleware
module.exports = faceController;
module.exports.uploadMiddleware = upload.single('file');