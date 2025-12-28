const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * リアクションサービス
 * 優先度「高」のN+1問題を解決した実装
 */
class ReactionService {
  /**
   * リアクションID自動採番
   * @returns {string} 新しいリアクションID
   */
  async generateReactionId() {
    const count = await prisma.reaction.count();
    if (count === 0) {
      return 'REA00001';
    }
    const maxId = await prisma.reaction.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true }
    });
    const maxNum = parseInt(maxId.id.substring(3)) + 1;
    return 'REA' + maxNum.toString().padStart(5, '0');
  }

  /**
   * 複数の対象に対するリアクション情報を一括取得（N+1問題の解決）
   * @param {Array<string>} targetIds - 対象ID（日報IDまたはフィードバックID）のリスト
   * @param {string} currentEmployeeId - 現在のログインユーザーID
   * @param {boolean} isFeedback - フィードバックに対するリアクションかどうか
   * @returns {object} 対象IDをキーとしたリアクション情報のマップ
   */
  async getReactionsByTargetIds(targetIds, currentEmployeeId, isFeedback = false) {
    try {
      if (!targetIds || targetIds.length === 0) {
        return {};
      }

      // リアクションを一括取得
      const whereClause = isFeedback
        ? { feedbackId: { in: targetIds } }
        : { dailyReportId: { in: targetIds } };

      const reactions = await prisma.reaction.findMany({
        where: whereClause,
        include: {
          employee: {
            select: {
              id: true,
              employeeName: true,
              color: true
            }
          },
          emoji: {
            select: {
              id: true,
              emojiContent: true
            }
          }
        }
      });

      // データを整形
      const result = {};

      targetIds.forEach(targetId => {
        const targetReactions = reactions.filter(r =>
          isFeedback ? r.feedbackId === targetId : r.dailyReportId === targetId
        );

        // 絵文字IDごとにグループ化
        const emojiGroups = {
          EMJ00001: [], EMJ00002: [], EMJ00003: [],
          EMJ00004: [], EMJ00005: [], EMJ00006: []
        };

        targetReactions.forEach(reaction => {
          if (emojiGroups[reaction.emojiId]) {
            emojiGroups[reaction.emojiId].push(reaction.employee);
          }
        });

        result[targetId] = {
          emj1: emojiGroups.EMJ00001.length,
          emj2: emojiGroups.EMJ00002.length,
          emj3: emojiGroups.EMJ00003.length,
          emj4: emojiGroups.EMJ00004.length,
          emj5: emojiGroups.EMJ00005.length,
          emj6: emojiGroups.EMJ00006.length,
          emj1Users: emojiGroups.EMJ00001,
          emj2Users: emojiGroups.EMJ00002,
          emj3Users: emojiGroups.EMJ00003,
          emj4Users: emojiGroups.EMJ00004,
          emj5Users: emojiGroups.EMJ00005,
          emj6Users: emojiGroups.EMJ00006,
          emj1Check: emojiGroups.EMJ00001.some(e => e.id === currentEmployeeId),
          emj2Check: emojiGroups.EMJ00002.some(e => e.id === currentEmployeeId),
          emj3Check: emojiGroups.EMJ00003.some(e => e.id === currentEmployeeId),
          emj4Check: emojiGroups.EMJ00004.some(e => e.id === currentEmployeeId),
          emj5Check: emojiGroups.EMJ00005.some(e => e.id === currentEmployeeId),
          emj6Check: emojiGroups.EMJ00006.some(e => e.id === currentEmployeeId)
        };
      });

      return result;

    } catch (error) {
      logger.error(`Get reactions by target IDs error: ${error.message}`, { targetIds });
      throw error;
    }
  }

  /**
   * リアクションの追加/削除（トグル動作）
   * @param {object} data - リアクションデータ
   * @returns {object} 処理結果
   */
  async toggleReaction(data) {
    try {
      const { employeeId, targetId, emojiId, isFeedback } = data;

      // 既存のリアクションを検索
      const whereClause = {
        employeeId,
        emojiId,
        ...(isFeedback ? { feedbackId: targetId } : { dailyReportId: targetId })
      };

      const existing = await prisma.reaction.findFirst({
        where: whereClause
      });

      if (existing) {
        // 既にリアクションがある場合は削除
        await prisma.reaction.delete({
          where: { id: existing.id }
        });
        logger.info(`Reaction removed: ${existing.id}`);
        return { action: 'removed', reactionId: existing.id };

      } else {
        // リアクションを追加
        const id = await this.generateReactionId();
        const newReaction = await prisma.reaction.create({
          data: {
            id,
            employeeId,
            emojiId,
            ...(isFeedback ? { feedbackId: targetId } : { dailyReportId: targetId })
          }
        });
        logger.info(`Reaction added: ${id}`);
        return { action: 'added', reactionId: id };
      }

    } catch (error) {
      logger.error(`Toggle reaction error: ${error.message}`, data);
      throw error;
    }
  }

  /**
   * 特定のリアクションを押したユーザーリストを取得
   * @param {string} targetId - 対象ID
   * @param {string} emojiId - 絵文字ID
   * @param {boolean} isFeedback - フィードバックに対するリアクションかどうか
   * @returns {Array} ユーザーリスト
   */
  async getReactionUsers(targetId, emojiId, isFeedback = false) {
    try {
      const whereClause = {
        emojiId,
        ...(isFeedback ? { feedbackId: targetId } : { dailyReportId: targetId })
      };

      const reactions = await prisma.reaction.findMany({
        where: whereClause,
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

      return reactions.map(r => r.employee);

    } catch (error) {
      logger.error(`Get reaction users error: ${error.message}`, { targetId, emojiId });
      throw error;
    }
  }
}

module.exports = new ReactionService();
