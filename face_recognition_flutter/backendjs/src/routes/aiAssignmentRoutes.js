const express = require('express');
const { controller, uploadMiddleware } = require('../controllers/AIAssignmentController');
const { authenticateToken } = require('../middleware/auth');
const { validateAIGeneration } = require('../validators/aiAssignmentValidator');

const router = express.Router();

/**
 * AI Assignment Generation Routes
 */

// Generate assignment template from document
router.post('/generate-assignment', 
    authenticateToken,
    uploadMiddleware,
    validateAIGeneration,
    controller.generateAssignment.bind(controller)
);

// Preview questions before creating full template
router.post('/preview-questions',
    authenticateToken, 
    uploadMiddleware,
    controller.previewQuestions.bind(controller)
);

// Get AI capabilities and supported formats
router.get('/capabilities',
    authenticateToken,
    controller.getCapabilities.bind(controller)
);

// Get generation status
router.get('/generation-status/:generationId',
    authenticateToken,
    controller.getGenerationStatus.bind(controller)
);

// Get AI generation statistics
router.get('/stats',
    authenticateToken,
    controller.getAIStats.bind(controller)
);

module.exports = router;