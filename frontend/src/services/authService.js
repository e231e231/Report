import api from './api';

export default {
  /**
   * ログイン
   * @param {string} userName - ユーザー名
   * @param {string} password - パスワード
   * @returns {Promise} レスポンス
   */
  async login(userName, password) {
    const response = await api.post('/auth/login', { userName, password });
    return response.data;
  },

  /**
   * ログアウト
   * @returns {Promise} レスポンス
   */
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * セッション確認
   * @returns {Promise} レスポンス
   */
  async checkSession() {
    const response = await api.get('/auth/session');
    return response.data;
  },

  /**
   * パスワード変更
   * @param {string} newPassword - 新しいパスワード
   * @param {string} confirmPassword - 確認用パスワード
   * @returns {Promise} レスポンス
   */
  async changePassword(newPassword, confirmPassword) {
    const response = await api.post('/auth/change-password', {
      newPassword,
      confirmPassword
    });
    return response.data;
  }
};
