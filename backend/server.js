// ローカル開発用サーバー
// Lambda環境では lambda.js が使用されます

const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('This is for local development only. For Lambda, use lambda.js');
});
