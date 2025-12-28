const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const session = require('express-session');
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
const PORT = process.env.PORT || 3000;

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

// 静的ファイル配信（アップロード画像）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 120 * 60 * 1000 // 120分
  }
}));

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
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  // アップロードディレクトリ初期化
  await uploadController.initializeUploadDir();

  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
