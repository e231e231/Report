const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth');

// 画像アップロード（認証必須）
router.post(
  '/image',
  requireAuth,
  upload.single('image'), // 'image'はフロントエンドのFormDataキー
  uploadController.uploadImage
);

module.exports = router;
