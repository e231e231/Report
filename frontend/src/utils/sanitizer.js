import DOMPurify from 'dompurify';

/**
 * HTMLをサニタイズ（XSS対策）
 * @param {string} dirty - サニタイズする文字列
 * @param {object} options - オプション
 * @returns {string} サニタイズされた文字列
 */
export const sanitizeHtml = (dirty, options = {}) => {
  const defaultOptions = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'span', 'div', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'title', 'style'],
    ALLOW_DATA_ATTR: false
  };

  const config = { ...defaultOptions, ...options };
  return DOMPurify.sanitize(dirty, config);
};

/**
 * テキストのみ許可（すべてのHTMLタグを除去）
 * @param {string} dirty - サニタイズする文字列
 * @returns {string} サニタイズされた文字列
 */
export const sanitizeText = (dirty) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};
