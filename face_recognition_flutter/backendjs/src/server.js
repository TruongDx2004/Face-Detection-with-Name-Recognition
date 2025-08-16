const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();


const authRoutes = require('./routes/auth');
const faceRoutes = require('./routes/face');
const classRoutes = require('./routes/class');
const subjectRoutes = require('./routes/subject');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');

const { swaggerUi, swaggerSpec } = require('./swagger');


const app = express();
const PORT = process.env.PORT || 8000;

// CORS
app.use(cors({
    origin: function (origin, callback) {
        if (
            !origin ||
            origin.startsWith('http://localhost') ||
            origin.startsWith('http://127.0.0.1')
        ) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);


// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Static files
app.use('/uploads', express.static('uploads'));

// Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Face Attendance API Server',
        version: '1.0.0',
        status: 'running'
    });
});

app.use('/auth', authRoutes);
app.use('/face', faceRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/admin', adminRoutes);
app.use('/classes', classRoutes);
app.use('/subjects', subjectRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});


// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});



app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
});

module.exports = app;
