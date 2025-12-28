const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

// DOMPurifyの初期化
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * HTMLをサニタイズする
 * 優先度「緊急」のXSS対策を実装
 * @param {string} dirty - サニタイズする文字列
 * @param {object} options - DOMPurifyのオプション
 * @returns {string} サニタイズされた文字列
 */
const sanitizeHtml = (dirty, options = {}) => {
  const defaultOptions = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'title', 'style'],
    ALLOW_DATA_ATTR: false
  };

  const config = { ...defaultOptions, ...options };
  return DOMPurify.sanitize(dirty, config);
};

/**
 * テキストのみを許可（すべてのHTMLタグを除去）
 * @param {string} dirty - サニタイズする文字列
 * @returns {string} サニタイズされた文字列
 */
const sanitizeText = (dirty) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

/**
 * オブジェクトのすべてのString値をサニタイズ
 * @param {object} obj - サニタイズするオブジェクト
 * @param {function} sanitizeFunc - 使用するサニタイズ関数
 * @returns {object} サニタイズされたオブジェクト
 */
const sanitizeObject = (obj, sanitizeFunc = sanitizeHtml) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeFunc(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, sanitizeFunc);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

module.exports = {
  sanitizeHtml,
  sanitizeText,
  sanitizeObject
};
