const express = require('express');
const router = express.Router();
const dailyReportController = require('../controllers/dailyReportController');
const { requireAuth, requireAdmin, requireNonAdmin } = require('../middleware/auth');

// 日報登録（管理者以外）
router.post('/', requireAuth, requireNonAdmin, dailyReportController.create);

// 日報一覧取得
router.get('/', requireAuth, dailyReportController.getList);

// 月別日報取得
router.get('/month/list', requireAuth, dailyReportController.getByMonth);

// 前の日報がある日付を取得
router.get('/dates/prev', requireAuth, dailyReportController.getPrevDate);

// 次の日報がある日付を取得
router.get('/dates/next', requireAuth, dailyReportController.getNextDate);

// 日報詳細取得
router.get('/:id', requireAuth, dailyReportController.getDetail);

// 日報更新
router.put('/:id', requireAuth, dailyReportController.update);

// 年度別検索（管理者のみ）
router.get('/search/by-year', requireAuth, requireAdmin, dailyReportController.searchByYear);

// CSV出力（管理者のみ）
router.get('/export/csv', requireAuth, requireAdmin, dailyReportController.exportCSV);

// 年度別削除（管理者のみ）
router.delete('/year/:year', requireAuth, requireAdmin, dailyReportController.deleteByYear);

// カレンダー用日付リスト
router.get('/dates/list', requireAuth, dailyReportController.getReportDates);

module.exports = router;
