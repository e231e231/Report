const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * 従業員サービス
 */
class EmployeeService {
  /**
   * 従業員ID自動採番
   * @returns {string} 新しい従業員ID
   */
  async generateEmployeeId() {
    const count = await prisma.employee.count();
    if (count === 0) {
      return 'EMP0001';
    }
    const maxId = await prisma.employee.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true }
    });
    const maxNum = parseInt(maxId.id.substring(3)) + 1;
    return 'EMP' + maxNum.toString().padStart(4, '0');
  }

  /**
   * 従業員一覧取得（削除済みを除く）
   * @returns {Array} 従業員一覧
   */
  async getAllEmployees() {
    try {
      const employees = await prisma.employee.findMany({
        where: {
          isDeleted: 0
        },
        include: {
          employeeRole: true
        },
        orderBy: { id: 'asc' }
      });

      // パスワードを除外
      const result = employees.map(({ password, ...employee }) => employee);

      logger.info(`Employee list retrieved: ${result.length} employees`);
      return result;

    } catch (error) {
      logger.error(`Get all employees error: ${error.message}`);
      throw error;
    }
  }

  /**
   * 従業員詳細取得
   * @param {string} id - 従業員ID
   * @returns {object} 従業員情報
   */
  async getEmployeeById(id) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: {
          employeeRole: true
        }
      });

      if (!employee) {
        const error = new Error('従業員が見つかりません');
        error.statusCode = 404;
        throw error;
      }

      // パスワードを除外
      const { password, ...employeeWithoutPassword } = employee;
      return employeeWithoutPassword;

    } catch (error) {
      logger.error(`Get employee by ID error: ${error.message}`, { id });
      throw error;
    }
  }

  /**
   * 従業員の登録
   * @param {object} data - 従業員データ
   * @returns {object} 登録された従業員
   */
  async createEmployee(data) {
    try {
      // ユーザー名の重複チェック
      const existing = await prisma.employee.findFirst({
        where: { userName: data.userName }
      });

      if (existing) {
        const error = new Error('このユーザー名は既に使用されています');
        error.statusCode = 400;
        throw error;
      }

      const id = await this.generateEmployeeId();

      // パスワードのハッシュ化
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const employee = await prisma.employee.create({
        data: {
          id,
          userName: data.userName,
          password: hashedPassword,
          employeeName: data.employeeName,
          role: data.role,
          color: '#ffffff',
          isDeleted: 0
        },
        include: {
          employeeRole: true
        }
      });

      logger.info(`Employee created: ${id} (${data.userName})`);

      // パスワードを除外
      const { password, ...employeeWithoutPassword } = employee;
      return employeeWithoutPassword;

    } catch (error) {
      logger.error(`Employee creation error: ${error.message}`, data);
      throw error;
    }
  }

  /**
   * 従業員情報の更新
   * @param {string} id - 従業員ID
   * @param {object} data - 更新データ
   * @returns {object} 更新された従業員
   */
  async updateEmployee(id, data) {
    try {
      // ユーザー名の重複チェック（自分自身は除く）
      if (data.userName) {
        const existing = await prisma.employee.findFirst({
          where: {
            userName: data.userName,
            id: { not: id }
          }
        });

        if (existing) {
          const error = new Error('このユーザー名は既に使用されています');
          error.statusCode = 400;
          throw error;
        }
      }

      const updateData = {};
      if (data.userName) updateData.userName = data.userName;
      if (data.employeeName) updateData.employeeName = data.employeeName;
      if (data.color) updateData.color = data.color;

      const employee = await prisma.employee.update({
        where: { id },
        data: updateData,
        include: {
          employeeRole: true
        }
      });

      logger.info(`Employee updated: ${id}`);

      // パスワードを除外
      const { password, ...employeeWithoutPassword } = employee;
      return employeeWithoutPassword;

    } catch (error) {
      logger.error(`Employee update error: ${error.message}`, { id, data });
      throw error;
    }
  }

  /**
   * 従業員の論理削除
   * @param {string} id - 従業員ID
   */
  async deleteEmployee(id) {
    try {
      await prisma.employee.update({
        where: { id },
        data: { isDeleted: 1 }
      });

      logger.info(`Employee deleted (logical): ${id}`);

    } catch (error) {
      logger.error(`Employee deletion error: ${error.message}`, { id });
      throw error;
    }
  }

  /**
   * ロールの変更
   * @param {string} id - 従業員ID
   * @param {number} role - 新しいロール
   */
  async updateRole(id, role) {
    try {
      await prisma.employee.update({
        where: { id },
        data: { role: parseInt(role) }
      });

      logger.info(`Employee role updated: ${id} to role ${role}`);

    } catch (error) {
      logger.error(`Employee role update error: ${error.message}`, { id, role });
      throw error;
    }
  }

  /**
   * ランダムカラーの生成
   * @returns {string} ランダムな16進数カラーコード
   */
  generateRandomColor() {
    const hex = '0123456789abcdef';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += hex[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  /**
   * ユーザーカラーのランダム変更
   * @param {string} id - 従業員ID
   * @returns {object} 更新された従業員情報
   */
  async updateColorRandom(id) {
    try {
      const color = this.generateRandomColor();

      const employee = await prisma.employee.update({
        where: { id },
        data: { color }
      });

      logger.info(`Employee color updated: ${id} to ${color}`);

      // パスワードを除外
      const { password, ...employeeWithoutPassword } = employee;
      return employeeWithoutPassword;

    } catch (error) {
      logger.error(`Employee color update error: ${error.message}`, { id });
      throw error;
    }
  }

  /**
   * ユーザーカラーの変更（指定）
   * @param {string} id - 従業員ID
   * @param {string} color - カラーコード（#RRGGBB）
   * @returns {object} 更新された従業員情報
   */
  async updateColor(id, color) {
    try {
      const employee = await prisma.employee.update({
        where: { id },
        data: { color }
      });

      logger.info(`Employee color updated: ${id} to ${color}`);

      // パスワードを除外
      const { password, ...employeeWithoutPassword } = employee;
      return employeeWithoutPassword;

    } catch (error) {
      logger.error(`Employee color update error: ${error.message}`, { id, color });
      throw error;
    }
  }
}

module.exports = new EmployeeService();
