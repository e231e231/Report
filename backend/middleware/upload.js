const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const crypto = require('crypto');

// Lambda環境かどうかをチェック
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

// S3クライアントの設定（Lambda環境の場合）
let s3Client;
if (isLambda || process.env.USE_S3 === 'true') {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-northeast-1'
  });
}

// ファイルフィルター
const fileFilter = (req, file, cb) => {
  // 許可する画像形式
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif'
  ];

  // 許可する拡張子
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();

  // MIMEタイプと拡張子の両方をチェック
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('画像ファイルのみアップロード可能です（JPEG, PNG, GIF）'), false);
  }
};

// ストレージ設定
let storage;

if (isLambda || process.env.USE_S3 === 'true') {
  // Lambda環境またはS3を使用する場合
  storage = multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME || 'dailyreport-uploads',
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      // S3のキー（パス）を生成
      const uniqueSuffix = crypto.randomBytes(16).toString('hex');
      const timestamp = Date.now();
      const ext = path.extname(file.originalname).toLowerCase();
      const key = `images/${timestamp}-${uniqueSuffix}${ext}`;
      cb(null, key);
    }
  });
} else {
  // ローカル開発環境の場合
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../uploads/images'));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = crypto.randomBytes(16).toString('hex');
      const timestamp = Date.now();
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${timestamp}-${uniqueSuffix}${ext}`);
    }
  });
}

// Multer設定
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB制限
    files: 1 // 一度に1ファイルのみ
  }
});

module.exports = upload;
