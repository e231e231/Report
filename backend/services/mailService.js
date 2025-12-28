const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * 管理者連絡サービス
 */
class MailService {
  /**
   * メールID自動採番
   * @returns {string} 新しいメールID
   */
  async generateMailId() {
    const count = await prisma.mail.count();
    if (count === 0) {
      return 'MAIL00001';
    }
    const maxId = await prisma.mail.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true }
    });
    const maxNum = parseInt(maxId.id.substring(4)) + 1;
    return 'MAIL' + maxNum.toString().padStart(5, '0');
  }

  /**
   * メール一覧取得（管理者用）
   * @returns {Array} メール一覧
   */
  async getAllMails() {
    try {
      const mails = await prisma.mail.findMany({
        include: {
          employee: {
            select: {
              id: true,
              employeeName: true
            }
          }
        },
        orderBy: { date: 'desc' }
      });

      logger.info(`Mail list retrieved: ${mails.length} mails`);
      return mails;

    } catch (error) {
      logger.error(`Get all mails error: ${error.message}`);
      throw error;
    }
  }

  /**
   * メール送信（一般ユーザーから管理者へ）
   * @param {object} data - メールデータ
   * @returns {object} 送信されたメール
   */
  async sendMail(data) {
    try {
      const id = await this.generateMailId();

      const mail = await prisma.mail.create({
        data: {
          id,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          content: data.content,
          state: 0 // 未読
        }
      });

      logger.info(`Mail sent: ${id} from ${data.employeeId}`);
      return mail;

    } catch (error) {
      logger.error(`Mail send error: ${error.message}`, data);
      throw error;
    }
  }

  /**
   * メール既読化
   * @param {string} id - メールID
   */
  async markAsRead(id) {
    try {
      await prisma.mail.update({
        where: { id },
        data: { state: 1 }
      });

      logger.info(`Mail marked as read: ${id}`);

    } catch (error) {
      logger.error(`Mark mail as read error: ${error.message}`, { id });
      throw error;
    }
  }
}

module.exports = new MailService();
