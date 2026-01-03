const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
require('dotenv').config();

// Middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth');
const dailyReportRoutes = require('./routes/dailyReport');
const feedbackRoutes = require('./routes/feedback');
const reactionRoutes = require('./routes/reaction');
const employeeRoutes = require('./routes/employee');
const informationRoutes = require('./routes/information');
const mailRoutes = require('./routes/mail');
const uploadRoutes = require('./routes/upload');

// Controllers
const uploadController = require('./controllers/uploadController');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 静的ファイル配信（ローカル開発時のみ。Lambda環境ではS3を使用）
if (process.env.NODE_ENV !== 'production' || !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/daily-reports', dailyReportRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/information', informationRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    isLambda: !!process.env.AWS_LAMBDA_FUNCTION_NAME
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize upload directory (ローカル開発時のみ)
if (process.env.NODE_ENV !== 'production' || !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  uploadController.initializeUploadDir().catch(err => {
    logger.error('Failed to initialize upload directory:', err);
  });
}

module.exports = app;
