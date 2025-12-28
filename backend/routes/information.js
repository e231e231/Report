const express = require('express');
const router = express.Router();
const informationService = require('../services/informationService');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sanitizeHtml } = require('../utils/sanitizer');

// お知らせ一覧取得
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { limit } = req.query;
    const information = await informationService.getAllInformation(limit ? parseInt(limit) : null);
    res.json({ success: true, data: information });
  } catch (error) {
    next(error);
  }
});

// お知らせ詳細取得
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const information = await informationService.getInformationById(req.params.id);
    res.json({ success: true, data: information });
  } catch (error) {
    next(error);
  }
});

// お知らせ登録（管理者のみ）
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { title, content } = req.body;

    const information = await informationService.createInformation({
      title: sanitizeHtml(title),
      content: sanitizeHtml(content)
    });

    res.status(201).json({ success: true, data: information });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
