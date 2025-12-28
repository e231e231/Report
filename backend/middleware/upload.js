const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// ストレージ設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/images'));
  },
  filename: (req, file, cb) => {
    // ランダムな16進数 + タイムスタンプ + 元の拡張子
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${timestamp}-${uniqueSuffix}${ext}`);
  }
});

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
