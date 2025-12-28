const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// ログイン
router.post('/login', authController.login);

// ログアウト
router.post('/logout', requireAuth, authController.logout);

// セッション確認
router.get('/session', authController.checkSession);

// パスワード変更
router.post('/change-password', requireAuth, authController.changePassword);

module.exports = router;
