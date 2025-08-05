const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            role: user.role 
        },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );
};

// Verify JWT token middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Gán user vào req
    req.user = decoded;

    const [rows] = await db.execute(`SELECT * FROM users WHERE id = ?`, [decoded.id]);

    if (rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

    req.user = rows[0];    

    // Nếu là học sinh thì truy vấn class_name và student_code
    if (decoded.role === 'student') {
      const [rows] = await db.execute(
        `SELECT c.name AS class_name, cs.student_code
         FROM class_students cs
         JOIN classes c ON cs.class_id = c.id
         WHERE cs.student_id = ? LIMIT 1`,
        [decoded.id]
      );

      if (rows.length > 0) {
        req.user.class_name = rows[0].class_name;
        req.user.student_code = rows[0].student_code;
      } else {
        req.user.class_name = null;
        req.user.student_code = null;
      }
    }

    next();
  } catch (err) {
    console.error('JWT verify failed:', err);
    return res.sendStatus(403);
  }
}

// Role-based authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

module.exports = {
    generateToken,
    authenticateToken,
    authorize
};
