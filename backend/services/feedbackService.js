const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * フィードバックサービス
 */
class FeedbackService {
  /**
   * フィードバックID自動採番
   * @returns {string} 新しいフィードバックID
   */
  async generateFeedbackId() {
    const count = await prisma.feedback.count();
    if (count === 0) {
      return 'FB00001';
    }
    const maxId = await prisma.feedback.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true }
    });
    const maxNum = parseInt(maxId.id.substring(2)) + 1;
    return 'FB' + maxNum.toString().padStart(5, '0');
  }

  /**
   * フィードバックの登録
   * @param {object} data - フィードバックデータ
   * @returns {object} 登録されたフィードバック
   */
  async createFeedback(data) {
    try {
      const id = await this.generateFeedbackId();

      const feedback = await prisma.feedback.create({
        data: {
          id,
          dailyReportId: data.dailyReportId,
          employeeId: data.employeeId,
          content: data.content,
          toReplyFbid: data.toReplyFbid || null,
          editCheck: 0
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeName: true,
              color: true
            }
          }
        }
      });

      logger.info(`Feedback created: ${id} on daily report ${data.dailyReportId}`);
      return feedback;

    } catch (error) {
      logger.error(`Feedback creation error: ${error.message}`, data);
      throw error;
    }
  }

  /**
   * フィードバックの更新
   * @param {string} id - フィードバックID
   * @param {object} data - 更新データ
   * @param {string} employeeId - 更新者のID
   * @returns {object} 更新されたフィードバック
   */
  async updateFeedback(id, data, employeeId) {
    try {
      // 権限チェック
      const existing = await prisma.feedback.findUnique({
        where: { id }
      });

      if (!existing) {
        const error = new Error('フィードバックが見つかりません');
        error.statusCode = 404;
        throw error;
      }

      if (existing.employeeId !== employeeId) {
        const error = new Error('編集権限がありません');
        error.statusCode = 403;
        throw error;
      }

      const updatedFeedback = await prisma.feedback.update({
        where: { id },
        data: {
          content: data.content,
          editCheck: 1,
          date: new Date()
        }
      });

      logger.info(`Feedback updated: ${id} by ${employeeId}`);
      return updatedFeedback;

    } catch (error) {
      logger.error(`Feedback update error: ${error.message}`, { id, employeeId });
      throw error;
    }
  }

  /**
   * メンション一覧を取得
   * @param {string} employeeId - 従業員ID
   * @returns {Array} 自分宛てのコメントと返信のリスト
   */
  async getMentionList(employeeId) {
    try {
      // 自分の日報に対するコメント（自分自身のコメントは除外）
      const myReportComments = await prisma.feedback.findMany({
        where: {
          dailyReport: {
            employeeId: employeeId
          },
          employeeId: {
            not: employeeId
          }
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeName: true,
              color: true
            }
          },
          dailyReport: {
            select: {
              id: true,
              calendar: true,
              employee: {
                select: {
                  employeeName: true
                }
              }
            }
          }
        },
        orderBy: { date: 'desc' }
      });

      // 自分のコメントに対する返信（自分自身の返信は除外）
      const myCommentReplies = await prisma.feedback.findMany({
        where: {
          replyTo: {
            employeeId: employeeId
          },
          employeeId: {
            not: employeeId
          }
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeName: true,
              color: true
            }
          },
          replyTo: {
            select: {
              id: true,
              date: true
            }
          },
          dailyReport: {
            select: {
              id: true,
              calendar: true,
              employee: {
                select: {
                  employeeName: true
                }
              }
            }
          }
        },
        orderBy: { date: 'desc' }
      });

      // 統一フォーマットに変換
      const formattedComments = myReportComments.map(comment => ({
        id: comment.id,
        dailyReportId: comment.dailyReport.id,
        dailyReportDate: comment.dailyReport.calendar,
        dailyReportEmployeeName: comment.dailyReport.employee.employeeName,
        feedbackEmployeeName: comment.employee.employeeName,
        feedbackEmployeeColor: comment.employee.color,
        feedbackContent: comment.content,
        feedbackDate: comment.date,
        type: 'comment'
      }));

      const formattedReplies = myCommentReplies.map(reply => ({
        id: reply.id,
        dailyReportId: reply.dailyReport.id,
        dailyReportDate: reply.dailyReport.calendar,
        dailyReportEmployeeName: reply.dailyReport.employee.employeeName,
        feedbackEmployeeName: reply.employee.employeeName,
        feedbackEmployeeColor: reply.employee.color,
        feedbackContent: reply.content,
        feedbackDate: reply.date,
        type: 'reply'
      }));

      // 結合してソート
      const allMentions = [...formattedComments, ...formattedReplies];
      allMentions.sort((a, b) => new Date(b.feedbackDate) - new Date(a.feedbackDate));

      logger.info(`Mention list retrieved for employee: ${employeeId}, count: ${allMentions.length}`);

      return allMentions;

    } catch (error) {
      logger.error(`Get mention list error: ${error.message}`, { employeeId });
      throw error;
    }
  }

  /**
   * 最近のメンションを取得（上位N件）
   * @param {string} employeeId - 従業員ID
   * @param {number} limit - 取得件数（デフォルト5件）
   * @returns {Array} 最近のメンション一覧
   */
  async getRecentMentions(employeeId, limit = 5) {
    try {
      // 自分の日報に対するコメント（自分自身のコメントは除外）
      const myReportComments = await prisma.feedback.findMany({
        where: {
          dailyReport: {
            employeeId: employeeId
          },
          employeeId: {
            not: employeeId
          }
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeName: true,
              color: true
            }
          },
          dailyReport: {
            select: {
              id: true,
              calendar: true,
              content: true
            }
          }
        },
        orderBy: { date: 'desc' },
        take: limit
      });

      logger.info(`Recent mentions retrieved for employee: ${employeeId}, count: ${myReportComments.length}`);

      return myReportComments;

    } catch (error) {
      logger.error(`Get recent mentions error: ${error.message}`, { employeeId, limit });
      throw error;
    }
  }
}

module.exports = new FeedbackService();
