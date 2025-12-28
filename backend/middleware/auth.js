const logger = require('../utils/logger');

/**
 * 認証チェックミドルウェア
 */
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.employeeId) {
    logger.warn(`Unauthorized access attempt: ${req.method} ${req.url}`, {
      ip: req.ip
    });
    return res.status(401).json({
      success: false,
      error: 'ログインが必要です'
    });
  }
  next();
};

/**
 * ロール別アクセス制御
 * @param {Array<number>} allowedRoles - 許可するロール番号の配列
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.employeeId) {
      return res.status(401).json({
        success: false,
        error: 'ログインが必要です'
      });
    }

    const userRole = req.session.role;
    if (!allowedRoles.includes(userRole)) {
      logger.warn(`Forbidden access attempt by role ${userRole}: ${req.method} ${req.url}`, {
        userId: req.session.employeeId,
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
