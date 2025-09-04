const express = require('express');
const multer = require('multer');
const FaceController = require('../controllers/FaceController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');

const router = express.Router();

// Middleware: Yêu cầu authentication cho tất cả routes
router.use(authenticateToken);

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
 *               userId:
 *                 type: integer
 *                 description: User ID for dataset creation
 *     responses:
 *       200:
 *         description: Video uploaded and dataset created successfully
 *       400:
 *         description: Video file is required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Video upload failed
 */
router.post('/upload-video', multer({ dest: 'uploads/videos/' }).single('video'), FaceController.uploadVideo);

/**
 * @swagger
 * /face/register-video:
 *   post:
 *     summary: Register face from video
 *     tags: [Face Recognition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Video file for face registration
 *     responses:
 *       200:
 *         description: Face registration successful
 *       400:
 *         description: No file uploaded or invalid file
 */
router.post('/register-video', FaceController.uploadMiddleware, FaceController.registerFaceFromVideo);

/**
 * @swagger
 * /face/register-image:
 *   post:
 *     summary: Register face from image
 *     tags: [Face Recognition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file for face registration
 *     responses:
 *       200:
 *         description: Face image registered successfully
 */
router.post('/register-image', FaceController.uploadMiddleware, FaceController.registerFaceFromImage);

/**
 * @swagger
 * /face/train:
 *   post:
 *     summary: Train face recognition model (Admin/Teacher only)
 *     tags: [Face Recognition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Model training completed successfully
 *       403:
 *         description: Insufficient permissions
 */
router.post('/train', authorize(USER_ROLES.ADMIN, USER_ROLES.TEACHER), FaceController.trainModel);

/**
 * @swagger
 * /face/train-model:
 *   post:
 *     summary: Train the face recognition model (Admin/Teacher only)
 *     tags: [Face Recognition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Face recognition model trained successfully
 *       400:
 *         description: No dataset found. Please upload videos first.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin or teacher role required)
 *       500:
 *         description: Model training failed
 */
router.post('/train-model', authorize(USER_ROLES.ADMIN, USER_ROLES.TEACHER), FaceController.trainModel);

/**
 * @swagger
 * /face/recognize:
 *   post:
 *     summary: Recognize face from image
 *     tags: [Face Recognition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file for face recognition
 *     responses:
 *       200:
 *         description: Face recognition completed
 *       400:
 *         description: Model not trained or face not recognized
 */
router.post('/recognize', FaceController.uploadMiddleware, FaceController.recognizeFace);

/**
 * @swagger
 * /face/dataset-stats:
 *   get:
 *     summary: Get dataset statistics (Admin/Teacher only)
 *     tags: [Face Recognition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dataset statistics retrieved successfully
 */
router.get('/dataset-stats', authorize(USER_ROLES.ADMIN, USER_ROLES.TEACHER), FaceController.getDatasetStats);

/**
 * @swagger
 * /face/model-status:
 *   get:
 *     summary: Get model training status
 *     tags: [Face Recognition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Model status retrieved successfully
 */
router.get('/model-status', FaceController.getModelStatus);

module.exports = router;