const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * お知らせサービス
 */
class InformationService {
  /**
   * お知らせID自動採番
   * @returns {string} 新しいお知らせID
   */
  async generateInformationId() {
    const count = await prisma.information.count();
    if (count === 0) {
      return 'INF00001';
    }
    const maxId = await prisma.information.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true }
    });
    const maxNum = parseInt(maxId.id.substring(3)) + 1;
    return 'INF' + maxNum.toString().padStart(5, '0');
  }

  /**
   * お知らせ一覧取得
   * @param {number} limit - 取得件数制限（オプション）
   * @returns {Array} お知らせ一覧
   */
  async getAllInformation(limit = null) {
    try {
      const query = {
        orderBy: { date: 'desc' }
      };

      if (limit) {
        query.take = limit;
      }

      const information = await prisma.information.findMany(query);

      logger.info(`Information list retrieved: ${information.length} items`);
      return information;

    } catch (error) {
      logger.error(`Get all information error: ${error.message}`);
      throw error;
    }
  }

  /**
   * お知らせ詳細取得
   * @param {string} id - お知らせID
   * @returns {object} お知らせ情報
   */
  async getInformationById(id) {
    try {
      const information = await prisma.information.findUnique({
        where: { id }
      });

      if (!information) {
        const error = new Error('お知らせが見つかりません');
        error.statusCode = 404;
        throw error;
      }

      logger.info(`Information detail retrieved: ${id}`);
      return information;

    } catch (error) {
      logger.error(`Get information by ID error: ${error.message}`, { id });
      throw error;
    }
  }

  /**
   * お知らせの登録
   * @param {object} data - お知らせデータ
   * @returns {object} 登録されたお知らせ
   */
  async createInformation(data) {
    try {
      const id = await this.generateInformationId();

      const information = await prisma.information.create({
        data: {
          id,
          title: data.title,
          content: data.content
        }
      });

      logger.info(`Information created: ${id}`);
      return information;

    } catch (error) {
      logger.error(`Information creation error: ${error.message}`, data);
      throw error;
    }
  }

  /**
   * お知らせの更新
   * @param {string} id - お知らせID
   * @param {object} data - 更新データ
   * @returns {object} 更新されたお知らせ
   */
  async updateInformation(id, data) {
    try {
      const existing = await prisma.information.findUnique({
        where: { id }
      });

      if (!existing) {
        const error = new Error('お知らせが見つかりません');
        error.statusCode = 404;
        throw error;
      }

      const information = await prisma.information.update({
        where: { id },
        data: {
          title: data.title,
          content: data.content,
          date: new Date()
        }
      });

      logger.info(`Information updated: ${id}`);
      return information;

    } catch (error) {
      logger.error(`Information update error: ${error.message}`, { id });
      throw error;
    }
  }

  /**
   * お知らせの削除
   * @param {string} id - お知らせID
   * @returns {object} 削除結果
   */
  async deleteInformation(id) {
    try {
      const information = await prisma.information.findUnique({
        where: { id }
      });

      if (!information) {
        const error = new Error('お知らせが見つかりません');
        error.statusCode = 404;
        throw error;
      }

      await prisma.information.delete({
        where: { id }
      });

      logger.info(`Information deleted: ${id}`);
      return { message: 'お知らせを削除しました' };

    } catch (error) {
      logger.error(`Information deletion error: ${error.message}`, { id });
      throw error;
    }
  }
}

module.exports = new InformationService();
