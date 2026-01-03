const path = require('path');
const logger = require('../utils/logger');
const { ensureUploadDir } = require('../utils/fileValidator');

const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const useS3 = isLambda || process.env.USE_S3 === 'true';

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

      // 画像URL生成
      let imageUrl;
      if (useS3) {
        // S3の場合、locationまたはkeyからURLを生成
        imageUrl = req.file.location || 
                   `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-northeast-1'}.amazonaws.com/${req.file.key}`;
      } else {
        // ローカルの場合
        imageUrl = `/uploads/images/${req.file.filename}`;
      }

      logger.info(`Image uploaded: ${req.file.filename || req.file.key} by ${req.user.employeeId}`);

      res.status(200).json({
        success: true,
        data: {
          filename: req.file.filename || req.file.key,
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
   * アップロードディレクトリの初期化（ローカル開発時のみ）
   */
  async initializeUploadDir() {
    if (!useS3) {
      const uploadDir = path.join(__dirname, '../uploads/images');
      await ensureUploadDir(uploadDir);
      logger.info('Upload directory initialized');
    } else {
      logger.info('Using S3 for file uploads, skipping local directory initialization');
    }
  }
}

module.exports = new UploadController();
