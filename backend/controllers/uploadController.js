const path = require('path');
const logger = require('../utils/logger');
const { ensureUploadDir } = require('../utils/fileValidator');

class UploadController {
  /**
   * 画像アップロード
   */
  async uploadImage(req, res, next) {
    try {
      // multerによりreq.fileに画像情報が格納される
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: '画像ファイルが選択されていません'
        });
      }

      // 画像URL生成（フロントエンドからアクセス可能なパス）
      const imageUrl = `/uploads/images/${req.file.filename}`;

      logger.info(`Image uploaded: ${req.file.filename} by ${req.session.employeeId}`);

      res.status(200).json({
        success: true,
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          url: imageUrl,
          size: req.file.size
        }
      });

    } catch (error) {
      logger.error(`Image upload error: ${error.message}`);
      next(error);
    }
  }

  /**
   * アップロードディレクトリの初期化
   */
  async initializeUploadDir() {
    const uploadDir = path.join(__dirname, '../uploads/images');
    await ensureUploadDir(uploadDir);
    logger.info('Upload directory initialized');
  }
}

module.exports = new UploadController();
