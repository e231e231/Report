const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// JWT設定
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 認証サービス
 * JWT認証を実装
 */
class AuthService {
  /**
   * JWTトークンの生成
   * @param {object} employee - 従業員情報
   * @returns {string} JWTトークン
   */
  generateToken(employee) {
    const payload = {
      id: employee.id,
      userName: employee.userName,
      employeeName: employee.employeeName,
      role: employee.role,
      color: employee.color
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * JWTトークンの検証
   * @param {string} token - JWTトークン
   * @returns {object|null} デコードされたペイロード、失敗時はnull
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      logger.warn(`Token verification failed: ${error.message}`);
      return null;
    }
  }

  /**
   * ログイン処理
   * @param {string} userName - ユーザー名
   * @param {string} password - パスワード
   * @returns {object|null} 認証成功時は従業員情報とトークン、失敗時はnull
   */
  async login(userName, password) {
    try {
      // ユーザーの検索
      const employee = await prisma.employee.findFirst({
        where: {
          userName: userName,
          isDeleted: 0
        },
        include: {
          employeeRole: true
        }
      });

      if (!employee) {
        logger.warn(`Login failed: User not found - ${userName}`);
        return null;
      }

      // パスワードの検証
      const isValid = await bcrypt.compare(password, employee.password);
      if (!isValid) {
        logger.warn(`Login failed: Invalid password - ${userName}`);
        return null;
      }

      logger.info(`Login successful: ${userName} (${employee.id})`);

      // パスワードを除外して返す
      const { password: _, ...employeeWithoutPassword } = employee;
      
      // JWTトークンを生成
      const token = this.generateToken(employeeWithoutPassword);
      
      return {
        employee: employeeWithoutPassword,
        token
      };

    } catch (error) {
      logger.error(`Login error: ${error.message}`, { userName });
      throw error;
    }
  }

  /**
   * パスワードのハッシュ化
   * @param {string} plainPassword - 平文パスワード
   * @returns {string} ハッシュ化されたパスワード
   */
  async hashPassword(plainPassword) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(plainPassword, salt);
  }

  /**
   * パスワードの変更
   * @param {string} employeeId - 従業員ID
   * @param {string} newPassword - 新しいパスワード
   */
  async changePassword(employeeId, newPassword) {
    try {
      const hashedPassword = await this.hashPassword(newPassword);

      await prisma.employee.update({
        where: { id: employeeId },
        data: { password: hashedPassword }
      });

      logger.info(`Password changed: ${employeeId}`);
    } catch (error) {
      logger.error(`Password change error: ${error.message}`, { employeeId });
      throw error;
    }
  }

  /**
   * セッション情報の検証
   * @param {string} employeeId - 従業員ID
   * @returns {object|null} 従業員情報
   */
  async validateSession(employeeId) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          userName: true,
          employeeName: true,
          role: true,
          color: true,
          isDeleted: true
        }
      });

      if (!employee || employee.isDeleted === 1) {
        return null;
      }

      return employee;
    } catch (error) {
      logger.error(`Session validation error: ${error.message}`, { employeeId });
      throw error;
    }
  }
}

module.exports = new AuthService();
