// ========================================
// FACE ROUTES - src/routes/face.js
// ========================================

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken, authorize } = require('../middleware/auth');
const faceService = require('../services/faceService');
const db = require('../config/database');

const router = express.Router();

// Configure multer for file uploads
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
        } else if (file.fieldname === 'image') {
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

// Upload video for dataset creation
router.post('/upload-video', authenticateToken, upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Video file is required' });
        }

        const userId = parseInt(req.body.userId);
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
            [userId, videoPath] // hoặc imagePath nếu là ảnh
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
});

// Train face recognition model
router.post('/train-model', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
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
});

// Recognize face from uploaded image
router.post('/recognize', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }

        // Check if model is trained
        const isModelTrained = await faceService.isModelTrained();
        if (!isModelTrained) {
            return res.status(400).json({ error: 'Face recognition model is not trained yet' });
        }

        const imagePath = req.file.path;

        // Recognize face
        const result = await faceService.recognizeFace(imagePath);

        // Clean up uploaded file
        await fs.unlink(imagePath).catch(() => { });

        res.json({
            message: 'Face recognition completed',
            result: result
        });

    } catch (error) {
        console.error('Face recognition error:', error);
        res.status(500).json({ error: 'Face recognition failed: ' + error.message });
    }
});

// Get dataset statistics
router.get('/dataset-stats', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
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
});

// Check model status
router.get('/model-status', authenticateToken, async (req, res) => {
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
});

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Face Recognition
 *   description: Face recognition and training operations
 */

// Upload video for dataset creation
/**
 * @swagger
 * /face/upload-video:
 *   post:
 *     summary: Upload video to create face recognition dataset
 *     tags: [Face Recognition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - video
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file for face dataset creation (max 50MB)
 *     responses:
 *       200:
 *         description: Video uploaded and dataset created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *                   description: Dataset creation results
 *       400:
 *         description: Video file is required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Video upload failed
 */

// Train face recognition model
/**
 * @swagger
 * /face/train-model:
 *   post:
 *     summary: Train the face recognition model
 *     tags: [Face Recognition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Face recognition model trained successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 stats:
 *                   type: object
 *                   description: Dataset statistics used for training
 *                 result:
 *                   type: object
 *                   description: Training results
 *       400:
 *         description: No dataset found. Please upload videos first.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin or teacher role required)
 *       500:
 *         description: Model training failed
 */

// Recognize face from uploaded image
/**
 * @swagger
 * /face/recognize:
 *   post:
 *     summary: Recognize face from uploaded image
 *     tags: [Face Recognition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file for face recognition
 *     responses:
 *       200:
 *         description: Face recognition completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                       description: Recognized user ID
 *                     confidence:
 *                       type: number
 *                       description: Recognition confidence score
 *                     recognized:
 *                       type: boolean
 *                       description: Whether face was successfully recognized
 *       400:
 *         description: Image file is required or model not trained
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Face recognition failed
 */

// Get dataset statistics
/**
 * @swagger
 * /face/dataset-stats:
 *   get:
 *     summary: Get face recognition dataset statistics
 *     tags: [Face Recognition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dataset statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 stats:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       full_name:
 *                         type: string
 *                       username:
 *                         type: string
 *                       image_count:
 *                         type: integer
 *                 total_users:
 *                   type: integer
 *                   description: Total number of users in dataset
 *                 total_images:
 *                   type: integer
 *                   description: Total number of images in dataset
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin or teacher role required)
 *       500:
 *         description: Failed to get dataset statistics
 */

// Check model status
/**
 * @swagger
 * /face/model-status:
 *   get:
 *     summary: Check face recognition model status
 *     tags: [Face Recognition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Model status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 model_trained:
 *                   type: boolean
 *                   description: Whether the model is trained and ready
 *                 dataset_available:
 *                   type: boolean
 *                   description: Whether dataset is available for training
 *                 dataset_stats:
 *                   type: object
 *                   description: Current dataset statistics
 *                   additionalProperties:
 *                     type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to get model status
 */