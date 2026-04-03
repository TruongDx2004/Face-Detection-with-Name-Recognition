const ALLOWED = [
    'QUERY_STUDENT_LIST',
    'QUERY_ATTENDANCE',
    'QUERY_GRADES',
    'QUERY_ASSIGNMENTS',
    'GENERAL_QUESTION'
];

module.exports = function validateIntent(intent) {
    if (!intent || !ALLOWED.includes(intent.type)) {
        return { type: 'GENERAL_QUESTION' };
    }
    return intent;
};
