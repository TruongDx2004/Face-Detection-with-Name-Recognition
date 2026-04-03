
const AIAssignmentService = require('./src/services/aiAssignmentService');

async function verifyAISystem() {
    try {
        const aiService = new AIAssignmentService();
        await aiService.initialize();
        console.log('✅ AI Assignment System is ready!');
        return true;
    } catch (error) {
        console.error('❌ AI system verification failed:', error.message);
        return false;
    }
}

if (require.main === module) {
    verifyAISystem().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = verifyAISystem;
