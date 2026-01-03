const express = require('express');
const router = express.Router();
const feedbackService = require('../services/feedbackService');
const { sanitizeHtml } = require('../utils/sanitizer');
const { requireAuth } = require('../middleware/auth');

// フィードバック登録
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { dailyReportId, content, toReplyFbid } = req.body;

    if (!content || content.length > 1000) {
      return res.status(400).json({
        success: false,
        error: '内容は1000文字以内で入力してください'
      });
    }

    const feedback = await feedbackService.createFeedback({
      dailyReportId,
      employeeId: req.session.employeeId,
      content: sanitizeHtml(content),
      toReplyFbid
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
});

// フィードバック更新
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const feedback = await feedbackService.updateFeedback(
      id,
      { content: sanitizeHtml(content) },
      req.user.employeeId
    );

    res.json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
});

// メンション一覧
router.get('/mentions', requireAuth, async (req, res, next) => {
  try {
    const mentions = await feedbackService.getMentionList(req.user.employeeId);
    res.json({ success: true, data: mentions });
  } catch (error) {
    next(error);
  }
});

// 最近のメンション（上位N件）
router.get('/mentions/recent', requireAuth, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const recentMentions = await feedbackService.getRecentMentions(req.user.employeeId, limit);
    res.json({ success: true, data: recentMentions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
