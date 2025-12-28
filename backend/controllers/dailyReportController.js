const dailyReportService = require('../services/dailyReportService');
const { sanitizeHtml } = require('../utils/sanitizer');

class DailyReportController {
  // 日報登録
  async create(req, res, next) {
    try {
      const { content, calendar } = req.body;

      if (!content || content.length > 1000) {
        return res.status(400).json({
          success: false,
          error: '内容は1000文字以内で入力してください'
        });
      }

      const sanitizedContent = sanitizeHtml(content);

      const dailyReport = await dailyReportService.createDailyReport({
        employeeId: req.session.employeeId,
        content: sanitizedContent,
        calendar: calendar || new Date()
      });

      res.status(201).json({ success: true, data: dailyReport });
    } catch (error) {
      next(error);
    }
  }

  // 日報一覧取得
  async getList(req, res, next) {
    try {
      const { date, roleFilter } = req.query;
      const reports = await dailyReportService.getDailyReportList(
        date || new Date(),
        roleFilter || 'All',
        req.session.employeeId
      );
      res.json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }

  // 日報詳細取得
  async getDetail(req, res, next) {
    try {
      const { id } = req.params;
      const report = await dailyReportService.getDailyReportDetail(id, req.session.employeeId);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  // 日報更新
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!content || content.length > 1000) {
        return res.status(400).json({
          success: false,
          error: '内容は1000文字以内で入力してください'
        });
      }

      const sanitizedContent = sanitizeHtml(content);
      const report = await dailyReportService.updateDailyReport(
        id,
        { content: sanitizedContent },
        req.session.employeeId
      );

      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  // 年度別検索
  async searchByYear(req, res, next) {
    try {
      const { year } = req.query;
      const reports = await dailyReportService.searchByYear(year);
      res.json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }

  // 年度別削除
  async deleteByYear(req, res, next) {
    try {
      const { year } = req.params;
      await dailyReportService.deleteByYear(year);
      res.json({ success: true, message: '削除が完了しました' });
    } catch (error) {
      next(error);
    }
  }

  // カレンダー用日付リスト
  async getReportDates(req, res, next) {
    try {
      const dates = await dailyReportService.getReportDates();
      res.json({ success: true, data: dates });
    } catch (error) {
      next(error);
    }
  }

  // 前の日報がある日付を取得
  async getPrevDate(req, res, next) {
    try {
      const { date } = req.query;
      if (!date) {
        return res.status(400).json({
          success: false,
          error: '日付を指定してください'
        });
      }
      const prevDate = await dailyReportService.getPrevReportDate(date);
      res.json({ success: true, data: { date: prevDate } });
    } catch (error) {
      next(error);
    }
  }

  // 次の日報がある日付を取得
  async getNextDate(req, res, next) {
    try {
      const { date } = req.query;
      if (!date) {
        return res.status(400).json({
          success: false,
          error: '日付を指定してください'
        });
      }
      const nextDate = await dailyReportService.getNextReportDate(date);
      res.json({ success: true, data: { date: nextDate } });
    } catch (error) {
      next(error);
    }
  }

  // 月別日報取得
  async getByMonth(req, res, next) {
    try {
      const { year, month, employeeId } = req.query;

      if (!year || !month) {
        return res.status(400).json({
          success: false,
          error: '年と月を指定してください'
        });
      }

      const reports = await dailyReportService.getByMonth(
        parseInt(year),
        parseInt(month),
        employeeId || null,
        req.session.employeeId
      );
      res.json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }

  // CSV出力
  async exportCSV(req, res, next) {
    try {
      const { year } = req.query;

      if (!year) {
        return res.status(400).json({
          success: false,
          error: '年度を指定してください'
        });
      }

      const csvBuffer = await dailyReportService.exportToCSV(year);

      // CSVファイルとしてダウンロード
      res.setHeader('Content-Type', 'text/csv; charset=shift-jis');
      res.setHeader('Content-Disposition', `attachment; filename="${year}年度_日報.csv"`);
      res.send(csvBuffer);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DailyReportController();
