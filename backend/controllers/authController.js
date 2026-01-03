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
      const result = await authService.login(sanitizedUserName, password);

      if (!result) {
        return res.status(401).json({
          success: false,
          error: 'ユーザー名またはパスワードが正しくありません'
        });
      }

      const { employee, token } = result;

      res.json({
        success: true,
        data: {
          id: employee.id,
          userName: employee.userName,
          employeeName: employee.employeeName,
          role: employee.role,
          roleName: employee.employeeRole?.roleName,
          color: employee.color,
          token: token // JWTトークンを返す
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
      const employeeId = req.user?.employeeId;

      // JWT認証ではサーバー側でトークンを無効化しない
      // クライアント側でトークンを削除する
      logger.info(`Logout successful: ${employeeId}`);

      res.json({
        success: true,
        message: 'ログアウトしました'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * トークン確認（セッション確認の代わり）
   */
  async checkAuth(req, res, next) {
    try {
      // requireAuthミドルウェアを通過していればreq.userが設定されている
      if (!req.user) {
        return res.json({
          success: true,
          authenticated: false
        });
      }

      const employee = await authService.validateSession(req.user.employeeId);

      if (!employee) {
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
      const employeeId = req.user.employeeId; // JWTから取得

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
