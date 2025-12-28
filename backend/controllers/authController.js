const authService = require('../services/authService');
const { sanitizeText } = require('../utils/sanitizer');
const logger = require('../utils/logger');

/**
 * 認証コントローラー
 */
class AuthController {
  /**
   * ログイン
   */
  async login(req, res, next) {
    try {
      const { userName, password } = req.body;

      // バリデーション
      if (!userName || !password) {
        return res.status(400).json({
          success: false,
          error: 'ユーザー名とパスワードを入力してください'
        });
      }

      // サニタイズ
      const sanitizedUserName = sanitizeText(userName);

      // 認証
      const employee = await authService.login(sanitizedUserName, password);

      if (!employee) {
        return res.status(401).json({
          success: false,
          error: 'ユーザー名またはパスワードが正しくありません'
        });
      }

      // セッションに保存
      req.session.employeeId = employee.id;
      req.session.loginId = employee.userName;
      req.session.employeeName = employee.employeeName;
      req.session.role = employee.role;
      req.session.color = employee.color;

      res.json({
        success: true,
        data: {
          id: employee.id,
          userName: employee.userName,
          employeeName: employee.employeeName,
          role: employee.role,
          roleName: employee.employeeRole?.roleName,
          color: employee.color
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * ログアウト
   */
  async logout(req, res, next) {
    try {
      const employeeId = req.session?.employeeId;

      req.session.destroy((err) => {
        if (err) {
          logger.error(`Session destroy error: ${err.message}`, { employeeId });
          return next(err);
        }

        res.clearCookie('connect.sid');
        logger.info(`Logout successful: ${employeeId}`);

        res.json({
          success: true,
          message: 'ログアウトしました'
        });
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * セッション確認
   */
  async checkSession(req, res, next) {
    try {
      if (!req.session || !req.session.employeeId) {
        return res.json({
          success: true,
          authenticated: false
        });
      }

      const employee = await authService.validateSession(req.session.employeeId);

      if (!employee) {
        req.session.destroy();
        return res.json({
          success: true,
          authenticated: false
        });
      }

      res.json({
        success: true,
        authenticated: true,
        data: {
          id: employee.id,
          userName: employee.userName,
          employeeName: employee.employeeName,
          role: employee.role,
          color: employee.color
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * パスワード変更
   */
  async changePassword(req, res, next) {
    try {
      const { newPassword, confirmPassword } = req.body;
      const employeeId = req.session.employeeId;

      // バリデーション
      if (!newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          error: '新しいパスワードを入力してください'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: 'パスワードが一致しません'
        });
      }

      if (newPassword.length > 20) {
        return res.status(400).json({
          success: false,
          error: 'パスワードは20文字以内で入力してください'
        });
      }

      await authService.changePassword(employeeId, newPassword);

      res.json({
        success: true,
        message: 'パスワードを変更しました'
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
