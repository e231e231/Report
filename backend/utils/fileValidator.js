const path = require('path');
const fs = require('fs').promises;

/**
 * ファイル名のサニタイゼーション
 */
const sanitizeFilename = (filename) => {
  // 危険な文字を削除
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
};

/**
 * ファイルの存在確認
 */
const fileExists = async (filepath) => {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
};

/**
 * アップロードディレクトリの作成
 */
const ensureUploadDir = async (dir) => {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    throw new Error(`アップロードディレクトリの作成に失敗しました: ${error.message}`);
  }
};

module.exports = {
  sanitizeFilename,
  fileExists,
  ensureUploadDir
};
