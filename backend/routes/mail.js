const express = require('express');
const router = express.Router();
const mailService = require('../services/mailService');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sanitizeHtml } = require('../utils/sanitizer');

// メール一覧取得（管理者のみ）
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const mails = await mailService.getAllMails();
    res.json({ success: true, data: mails });
  } catch (error) {
    next(error);
  }
});

// メール送信（一般ユーザー）
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { content } = req.body;

    const mail = await mailService.sendMail({
      employeeId: req.user.employeeId,
      employeeName: req.user.employeeName,
      content: sanitizeHtml(content)
    });

    res.status(201).json({ success: true, data: mail });
  } catch (error) {
    next(error);
  }
});

// メール既読化（管理者のみ）
router.patch('/:id/read', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await mailService.markAsRead(req.params.id);
    res.json({ success: true, message: '既読にしました' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
