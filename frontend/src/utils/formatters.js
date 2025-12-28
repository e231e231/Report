/**
 * 日付フォーマット関連のユーティリティ
 */

/**
 * 日付を指定フォーマットで文字列化
 * @param {Date|string} date - 日付
 * @param {string} format - フォーマット（YYYY/MM/DD HH:mm:ss）
 * @returns {string} フォーマットされた日付文字列
 */
export const formatDate = (date, format = 'YYYY/MM/DD') => {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * 日時を表示用にフォーマット
 * @param {Date|string} date - 日付
 * @returns {string} フォーマットされた日時
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'YYYY/MM/DD HH:mm:ss');
};

/**
 * 相対時間の取得（〜前）
 * @param {Date|string} date - 日付
 * @returns {string} 相対時間
 */
export const getRelativeTime = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'たった今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;

  return formatDate(date);
};

/**
 * 文字列を指定長で切り捨て
 * @param {string} str - 文字列
 * @param {number} length - 最大長
 * @returns {string} 切り捨てられた文字列
 */
export const truncate = (str, length = 100) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

/**
 * ロール番号をロール名に変換
 * @param {number|string} role - ロール番号または文字列
 * @returns {string} ロール名
 */
export const getRoleName = (role) => {
  // 数値ロールのマッピング
  const numericRoleMap = {
    0: '管理者',
    1: '新入社員',
    2: 'OJT推進者',
    3: 'OJT責任者',
    4: 'OJT支援者'
  };

  // 文字列ロールID（RL...形式）のマッピング
  const stringRoleMap = {
    'RL0000001': '管理者',
    'RL0000002': '従業員'
  };

  // 数値の場合
  if (typeof role === 'number') {
    return numericRoleMap[role] || '不明';
  }

  // 文字列の場合
  if (typeof role === 'string') {
    // RL...形式の場合
    if (role.startsWith('RL')) {
      return stringRoleMap[role] || '不明';
    }
    // 数値文字列の場合（'0', '1'など）
    const numRole = parseInt(role, 10);
    if (!isNaN(numRole)) {
      return numericRoleMap[numRole] || '不明';
    }
  }

  return '不明';
};
