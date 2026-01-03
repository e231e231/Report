const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';

/**
 * 認証チェックミドルウェア (JWT)
 */
const requireAuth = (req, res, next) => {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`Unauthorized access attempt: No token provided - ${req.method} ${req.url}`, {
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        error: 'ログインが必要です'
      });
    }

    const token = authHeader.substring(7); // "Bearer " を削除

    // トークンを検証
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // リクエストオブジェクトにユーザー情報を追加
    req.user = {
      employeeId: decoded.id,
      userName: decoded.userName,
      employeeName: decoded.employeeName,
      role: decoded.role,
      color: decoded.color
    };
    
    next();
  } catch (error) {
    logger.warn(`Token verification failed: ${error.message}`, {
      ip: req.ip
    });
    return res.status(401).json({
      success: false,
      error: 'トークンが無効です'
    });
  }
};

/**
 * ロール別アクセス制御
 * @param {Array<number>} allowedRoles - 許可するロール番号の配列
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.employeeId) {
      return res.status(401).json({
        success: false,
        error: 'ログインが必要です'
      });
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      logger.warn(`Forbidden access attempt by role ${userRole}: ${req.method} ${req.url}`, {
        userId: req.user.employeeId,
        ip: req.ip
      });
      return res.status(403).json({
        success: false,
        error: 'このリソースへのアクセス権限がありません'
      });
    }
    next();
  };
};

/**
 * 管理者のみアクセス可能
 */
const requireAdmin = requireRole([0]);

/**
 * 管理者以外がアクセス可能
 */
const requireNonAdmin = requireRole([1, 2, 3, 4]);

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin,
  requireNonAdmin
};
