const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const reactionService = require('../services/reactionService');
const { requireAuth } = require('../middleware/auth');

const prisma = new PrismaClient();

// 絵文字一覧取得
router.get('/emojis', requireAuth, async (req, res, next) => {
  try {
    const emojis = await prisma.emoji.findMany({
      orderBy: {
        id: 'asc'
      }
    });

    res.json({ success: true, data: emojis });
  } catch (error) {
    next(error);
  }
});

// リアクション追加/削除
router.post('/toggle', requireAuth, async (req, res, next) => {
  try {
    const { targetId, emojiId, isFeedback } = req.body;

    const result = await reactionService.toggleReaction({
      employeeId: req.user.employeeId,
      targetId,
      emojiId,
      isFeedback: isFeedback || false
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
