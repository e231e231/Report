const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Lambda環境かどうかをチェック
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

// ログフォーマットの定義
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level}]: ${message}`;
  })
);

// Loggerの作成
const transports = [];

if (isLambda) {
  // Lambda環境ではコンソールに出力（CloudWatch Logsに自動転送される）
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.json() // CloudWatchでパースしやすいJSON形式
      )
    })
  );
} else {
  // ローカル開発環境ではファイルとコンソールに出力
  
  // ログディレクトリの作成
  const logDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  transports.push(
    // エラーログファイル
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // 統合ログファイル
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  );

  // 開発環境ではコンソールにも出力
  if (process.env.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    );
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: transports
});

// Morganストリーム（HTTPリクエストログ用）
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
