const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * 認証サービス
 * 優先度「緊急」のパスワードハッシュ化を実装
 */
class AuthService {
  /**
   * ログイン処理
   * @param {string} userName - ユーザー名
   * @param {string} password - パスワード
   * @returns {object|null} 認証成功時は従業員情報、失敗時はnull
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
      return employeeWithoutPassword;

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
