/**
 * Model Initializer Middleware
 * 
 * Initialize and inject models into controllers that need them
 */

const NotificationEvent = require('../models/NotificationEvent');
const EventRegistration = require('../models/EventRegistration');
const NotificationView = require('../models/NotificationView');
const PushNotificationLog = require('../models/PushNotificationLog');

// Mock models structure (since we're using raw SQL)
// This will be replaced when migrating to Sequelize
const models = {
    NotificationEvent: {
        // Mock Sequelize-like interface for raw SQL
        findAndCountAll: async (options) => {
            // This would be implemented with raw SQL queries
            // For now, return mock structure
            return { count: 0, rows: [] };
        },
        findByPk: async (id, options) => {
            // Mock implementation
            return null;
        },
        create: async (data) => {
            // Mock implementation
            return data;
        },
        findOne: async (options) => {
            // Mock implementation
            return null;
        },
        count: async (options) => {
            // Mock implementation
            return 0;
        },
        findAll: async (options) => {
            // Mock implementation
            return [];
        }
    },
    EventRegistration: {
        findAndCountAll: async (options) => ({ count: 0, rows: [] }),
        findByPk: async (id) => null,
        create: async (data) => data,
        findOne: async (options) => null,
        count: async (options) => 0,
        findAll: async (options) => []
    },
    NotificationView: {
        findOne: async (options) => null,
        create: async (data) => data,
        count: async (options) => 0
    },
    PushNotificationLog: {
        findAll: async (options) => [],
        create: async (data) => data
    },
    User: {
        findByPk: async (id) => null,
        findOne: async (options) => null,
        findAll: async (options) => []
    },
    // Sequelize mock
    sequelize: {
        fn: (func, col) => `${func}(${col})`,
        col: (column) => column,
        Op: {
            gt: '$gt',
            gte: '$gte',
            lt: '$lt',
            lte: '$lte',
            like: '$like',
            in: '$in',
            or: '$or',
            and: '$and',
            jsonContains: '$jsonContains'
        }
    }
};

/**
 * Initialize models for notification system
 * This uses the real SQL service implementation
 */
const initializeNotificationModels = () => {
    // Replace the NotificationService with RawSqlNotificationService
    const RawSqlNotificationService = require('../services/RawSqlNotificationService');
    const notificationController = require('../controllers/NotificationController');
    
    // Override the service initialization
    notificationController.notificationService = new RawSqlNotificationService();
    
    console.log('✅ Notification models initialized with SQL service');
    
    // Return models for any controllers that might need them
    return models;
};

/**
 * Middleware to ensure models are available
 */
const ensureModelsInitialized = (req, res, next) => {
    if (!req.models) {
        req.models = models;
    }
    next();
};

module.exports = {
    models,
    initializeNotificationModels,
    ensureModelsInitialized
};