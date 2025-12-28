const logger = require('../utils/logger');
const multer = require('multer');

/**
 * グローバルエラーハンドラー
 */
const errorHandler = (err, req, res, next) => {
  // エラーログを記録
  logger.error(`Error: ${err.message}`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.session?.employeeId,
    stack: err.stack
  });

  // エラーレスポンスのデフォルト値
  let statusCode = err.statusCode || 500;
  let message = err.message || 'サーバーエラーが発生しました';

  // Prismaエラーのハンドリング
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        statusCode = 400;
        message = '既に登録されているデータです';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'データが見つかりません';
        break;
      case 'P2003':
        statusCode = 400;
        message = '関連するデータが存在しません';
        break;
      default:
        statusCode = 500;
        message = 'データベースエラーが発生しました';
    }
  }

  // バリデーションエラー
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // JWT認証エラー
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '認証に失敗しました。再度ログインしてください。';
  }

  // Multerエラー
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'ファイルサイズが大きすぎます（最大5MB）';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'アップロードできるファイルは1つまでです';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = '予期しないフィールド名です';
        break;
      default:
        message = 'ファイルアップロードエラーが発生しました';
    }
  }

  // 本番環境ではスタックトレースを含めない
  const response = {
    success: false,
    error: message
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 404エラーハンドラー
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = errorHandler;
module.exports.notFound = notFound;
