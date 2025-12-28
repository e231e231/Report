const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const reactionService = require('./reactionService');
const iconv = require('iconv-lite');

const prisma = new PrismaClient();

/**
 * 日報サービス
 */
class DailyReportService {
  /**
   * 日報ID自動採番
   * @returns {string} 新しい日報ID
   */
  async generateDailyReportId() {
    const count = await prisma.dailyReport.count();
    if (count === 0) {
      return 'DAY00001';
    }
    const maxId = await prisma.dailyReport.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true }
    });
    const maxNum = parseInt(maxId.id.substring(3)) + 1;
    return 'DAY' + maxNum.toString().padStart(5, '0');
  }

  /**
   * 日報の登録
   * @param {object} data - 日報データ
   * @returns {object} 登録された日報
   */
  async createDailyReport(data) {
    try {
      const id = await this.generateDailyReportId();

      // 年度計算
      const calendar = new Date(data.calendar);
      const year = calendar.getMonth() >= 6 ? calendar.getFullYear() : calendar.getFullYear() + 1;

      // 同日同従業員の日報チェック
      const existing = await prisma.dailyReport.findFirst({
        where: {
          employeeId: data.employeeId,
          calendar: calendar
        }
      });

      if (existing) {
        const error = new Error('すでに日報が登録されています');
        error.statusCode = 400;
        throw error;
      }

      const dailyReport = await prisma.dailyReport.create({
        data: {
          id,
          employeeId: data.employeeId,
          content: data.content,
          calendar: calendar,
          year: year,
          editCheck: 0,
          weekFlag: 0
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

      logger.info(`Daily report created: ${id} by ${data.employeeId}`);
      return dailyReport;

    } catch (error) {
      logger.error(`Daily report creation error: ${error.message}`, data);
      throw error;
    }
  }

  /**
   * 日報一覧取得（N+1問題を解決）
   * @param {Date} date - 対象日
   * @param {string} roleFilter - ロールフィルター（新入社員/先輩社員/All）
   * @param {string} currentEmployeeId - 現在のログインユーザーID
   * @returns {Array} 日報一覧
   */
  async getDailyReportList(date, roleFilter = 'All', currentEmployeeId) {
    try {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      // ロールフィルター条件
      let roleCondition = {};
      if (roleFilter === '新入社員') {
        roleCondition = { employee: { role: 1 } };
      } else if (roleFilter === '先輩社員') {
        roleCondition = { employee: { role: { not: 1 } } };
      }

      // 日報取得
      const dailyReports = await prisma.dailyReport.findMany({
        where: {
          calendar: targetDate,
          ...roleCondition
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeName: true,
              color: true,
              role: true
            }
          }
        },
        orderBy: { date: 'desc' }
      });

      if (dailyReports.length === 0) {
        return [];
      }

      // 日報IDリストを取得
      const reportIds = dailyReports.map(r => r.id);

      // リアクション情報を一括取得（N+1問題の解決）
      const reactionsData = await reactionService.getReactionsByTargetIds(reportIds, currentEmployeeId);

      // フィードバック数を一括取得
      const feedbackCounts = await prisma.feedback.groupBy({
        by: ['dailyReportId'],
        where: {
          dailyReportId: { in: reportIds }
        },
        _count: {
          id: true
        }
      });

      const feedbackCountMap = {};
      feedbackCounts.forEach(fc => {
        feedbackCountMap[fc.dailyReportId] = fc._count.id;
      });

      // 結果を結合
      const result = dailyReports.map(report => ({
        ...report,
        reactions: reactionsData[report.id] || {
          emj1: 0, emj2: 0, emj3: 0, emj4: 0, emj5: 0, emj6: 0,
          emj1Users: [], emj2Users: [], emj3Users: [],
          emj4Users: [], emj5Users: [], emj6Users: [],
          emj1Check: false, emj2Check: false, emj3Check: false,
          emj4Check: false, emj5Check: false, emj6Check: false
        },
        feedbackCount: feedbackCountMap[report.id] || 0
      }));

      logger.info(`Daily report list retrieved: ${result.length} reports for ${targetDate.toISOString()}`);
      return result;

    } catch (error) {
      logger.error(`Daily report list error: ${error.message}`, { date, roleFilter });
      throw error;
    }
  }

  /**
   * 日報詳細取得
   * @param {string} id - 日報ID
   * @param {string} currentEmployeeId - 現在のログインユーザーID
   * @returns {object} 日報詳細
   */
  async getDailyReportDetail(id, currentEmployeeId) {
    try {
      const dailyReport = await prisma.dailyReport.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              id: true,
              employeeName: true,
              color: true
            }
          },
          feedbacks: {
            include: {
              employee: {
                select: {
                  id: true,
                  employeeName: true,
                  color: true
                }
              },
              replyTo: {
                include: {
                  employee: {
                    select: {
                      employeeName: true
                    }
                  }
                }
              }
            },
            orderBy: { date: 'asc' }
          }
        }
      });

      if (!dailyReport) {
        const error = new Error('日報が見つかりません');
        error.statusCode = 404;
        throw error;
      }

      // 日報自体のリアクション情報を取得
      const reportReactions = await reactionService.getReactionsByTargetIds([id], currentEmployeeId, false);
      dailyReport.reactions = reportReactions[id] || {
        emj1: 0, emj2: 0, emj3: 0, emj4: 0, emj5: 0, emj6: 0,
        emj1Users: [], emj2Users: [], emj3Users: [],
        emj4Users: [], emj5Users: [], emj6Users: [],
        emj1Check: false, emj2Check: false, emj3Check: false,
        emj4Check: false, emj5Check: false, emj6Check: false
      };

      // フィードバックのリアクション情報を一括取得
      if (dailyReport.feedbacks.length > 0) {
        const feedbackIds = dailyReport.feedbacks.map(f => f.id);
        const feedbackReactions = await reactionService.getReactionsByTargetIds(feedbackIds, currentEmployeeId, true);

        dailyReport.feedbacks = dailyReport.feedbacks.map(feedback => ({
          ...feedback,
          reactions: feedbackReactions[feedback.id] || {
            emj1: 0, emj2: 0, emj3: 0, emj4: 0, emj5: 0, emj6: 0,
            emj1Users: [], emj2Users: [], emj3Users: [],
            emj4Users: [], emj5Users: [], emj6Users: [],
            emj1Check: false, emj2Check: false, emj3Check: false,
            emj4Check: false, emj5Check: false, emj6Check: false
          }
        }));
      }

      logger.info(`Daily report detail retrieved: ${id}`);
      logger.info(dailyReport);
      return dailyReport;

    } catch (error) {
      logger.error(`Daily report detail error: ${error.message}`, { id });
      throw error;
    }
  }

  /**
   * 日報の更新
   * @param {string} id - 日報ID
   * @param {object} data - 更新データ
   * @param {string} employeeId - 更新者のID
   * @returns {object} 更新された日報
   */
  async updateDailyReport(id, data, employeeId) {
    try {
      // 権限チェック
      const existing = await prisma.dailyReport.findUnique({
        where: { id }
      });

      if (!existing) {
        const error = new Error('日報が見つかりません');
        error.statusCode = 404;
        throw error;
      }

      if (existing.employeeId !== employeeId) {
        const error = new Error('編集権限がありません');
        error.statusCode = 403;
        throw error;
      }

      const updatedReport = await prisma.dailyReport.update({
        where: { id },
        data: {
          content: data.content,
          editCheck: 1,
          date: new Date()
        }
      });

      logger.info(`Daily report updated: ${id} by ${employeeId}`);
      return updatedReport;

    } catch (error) {
      logger.error(`Daily report update error: ${error.message}`, { id, employeeId });
      throw error;
    }
  }

  /**
   * 年度別日報検索
   * @param {number} year - 年度
   * @returns {Array} 日報一覧
   */
  async searchByYear(year) {
    try {
      const reports = await prisma.dailyReport.findMany({
        where: { year: parseInt(year) },
        include: {
          employee: {
            select: {
              id: true,
              employeeName: true
            }
          }
        },
        orderBy: { calendar: 'desc' }
      });

      logger.info(`Daily report search by year: ${year}, found ${reports.length} reports`);
      return reports;

    } catch (error) {
      logger.error(`Daily report search error: ${error.message}`, { year });
      throw error;
    }
  }

  /**
   * 年度別日報削除
   * @param {number} year - 年度
   */
  async deleteByYear(year) {
    try {
      const result = await prisma.dailyReport.deleteMany({
        where: { year: parseInt(year) }
      });

      logger.info(`Daily reports deleted: ${result.count} reports for year ${year}`);
      return result;

    } catch (error) {
      logger.error(`Daily report deletion error: ${error.message}`, { year });
      throw error;
    }
  }

  /**
   * カレンダー用日付リスト取得
   * @returns {Array<string>} 日報が存在する日付のリスト
   */
  async getReportDates() {
    try {
      const reports = await prisma.dailyReport.findMany({
        select: { calendar: true },
        orderBy: { calendar: 'desc' }
      });

      // 日付のみを抽出して重複を削除
      const dates = [...new Set(reports.map(r => r.calendar.toISOString().split('T')[0]))];

      return dates;
    } catch (error) {
      logger.error(`Get report dates error: ${error.message}`);
      throw error;
    }
  }

  /**
   * 前の日報がある日付を取得
   * @param {string} currentDate - 現在の日付 (YYYY-MM-DD)
   * @returns {string|null} 前の日報がある日付
   */
  async getPrevReportDate(currentDate) {
    try {
      const date = new Date(currentDate);
      date.setHours(0, 0, 0, 0);

      const report = await prisma.dailyReport.findFirst({
        where: {
          calendar: { lt: date }
        },
        orderBy: { calendar: 'desc' },
        select: { calendar: true }
      });

      if (!report) {
        return null;
      }

      const resultDate = report.calendar.toISOString().split('T')[0];
      logger.info(`Previous report date found: ${resultDate} from ${currentDate}`);
      return resultDate;

    } catch (error) {
      logger.error(`Get prev report date error: ${error.message}`, { currentDate });
      throw error;
    }
  }

  /**
   * 次の日報がある日付を取得
   * @param {string} currentDate - 現在の日付 (YYYY-MM-DD)
   * @returns {string|null} 次の日報がある日付
   */
  async getNextReportDate(currentDate) {
    try {
      const date = new Date(currentDate);
      date.setHours(0, 0, 0, 0);

      const report = await prisma.dailyReport.findFirst({
        where: {
          calendar: { gt: date }
        },
        orderBy: { calendar: 'asc' },
        select: { calendar: true }
      });

      if (!report) {
        return null;
      }

      const resultDate = report.calendar.toISOString().split('T')[0];
      logger.info(`Next report date found: ${resultDate} from ${currentDate}`);
      return resultDate;

    } catch (error) {
      logger.error(`Get next report date error: ${error.message}`, { currentDate });
      throw error;
    }
  }

  /**
   * 月別日報取得（カレンダー表示用）
   * @param {number} year - 年
   * @param {number} month - 月
   * @param {string} employeeId - 従業員ID（オプション）
   * @param {string} currentEmployeeId - 現在のログインユーザーID
   * @returns {Array} 日報一覧
   */
  async getByMonth(year, month, employeeId = null, currentEmployeeId = null) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const whereClause = {
        calendar: {
          gte: startDate,
          lte: endDate
        }
      };

      if (employeeId) {
        whereClause.employeeId = employeeId;
      }

      const reports = await prisma.dailyReport.findMany({
        where: whereClause,
        include: {
          employee: {
            select: {
              id: true,
              employeeName: true,
              color: true,
              role: true
            }
          },
          feedbacks: {
            select: {
              id: true
            }
          }
        },
        orderBy: { calendar: 'asc' }
      });

      logger.info(`Monthly reports retrieved: ${reports.length} reports for ${year}/${month}`);

      // 日報IDリストを取得
      const reportIds = reports.map(r => r.id);

      // リアクション情報を一括取得（currentEmployeeIdが提供されている場合のみ）
      let reactionsData = {};
      if (currentEmployeeId && reportIds.length > 0) {
        reactionsData = await reactionService.getReactionsByTargetIds(reportIds, currentEmployeeId);
      }

      // ロール情報、フィードバック数、リアクション情報を含めて返す
      return reports.map(report => ({
        ...report,
        employeeRole: report.employee.role,
        employeeColor: report.employee.color,
        employeeName: report.employee.employeeName,
        feedbacks: report.feedbacks,
        reactions: reactionsData[report.id] || {
          emj1: 0, emj2: 0, emj3: 0, emj4: 0, emj5: 0, emj6: 0,
          emj1Users: [], emj2Users: [], emj3Users: [],
          emj4Users: [], emj5Users: [], emj6Users: [],
          emj1Check: false, emj2Check: false, emj3Check: false,
          emj4Check: false, emj5Check: false, emj6Check: false
        }
      }));

    } catch (error) {
      logger.error(`Get by month error: ${error.message}`, { year, month });
      throw error;
    }
  }

  /**
   * 年度別日報をCSV形式でエクスポート
   * @param {number} year - 年度
   * @returns {Buffer} Shift-JISエンコードされたCSVデータ
   */
  async exportToCSV(year) {
    try {
      const reports = await prisma.dailyReport.findMany({
        where: { year: parseInt(year) },
        include: {
          employee: {
            select: {
              employeeName: true
            }
          },
          feedbacks: {
            select: {
              id: true
            }
          }
        },
        orderBy: { calendar: 'asc' }
      });

      logger.info(`Exporting ${reports.length} reports for year ${year} to CSV`);

      // CSVヘッダー
      const headers = ['日付', '従業員名', '内容', 'フィードバック数', '編集済み'];

      // CSVデータ行を生成
      const rows = reports.map(report => {
        const date = new Date(report.calendar);
        const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
        const employeeName = report.employee.employeeName;
        // 改行とカンマをエスケープ
        const content = report.content
          .replace(/"/g, '""')
          .replace(/\n/g, ' ')
          .replace(/\r/g, '');
        const feedbackCount = report.feedbacks.length;
        const isEdited = report.editCheck === 1 ? '○' : '';

        return [dateStr, employeeName, `"${content}"`, feedbackCount, isEdited];
      });

      // CSVを文字列として組み立て
      const csvLines = [headers, ...rows];
      const csvString = csvLines.map(row => row.join(',')).join('\n');

      // Shift-JISエンコード（ExcelでBOMありで開くため）
      const bom = Buffer.from([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
      const csvBuffer = iconv.encode(csvString, 'Shift_JIS');
      const csvWithBOM = Buffer.concat([bom, csvBuffer]);

      logger.info(`CSV export completed for year ${year}`);
      return csvWithBOM;

    } catch (error) {
      logger.error(`CSV export error: ${error.message}`, { year });
      throw error;
    }
  }
}

module.exports = new DailyReportService();
