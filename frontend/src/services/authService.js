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
    
    // JWTトークンを保存
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('authToken', response.data.data.token);
      
      // ユーザー情報も保存（トークンを除く）
      const { token, ...userInfo } = response.data.data;
      localStorage.setItem('user', JSON.stringify(userInfo));
    }
    
    return response.data;
  },

  /**
   * ログアウト
   * @returns {Promise} レスポンス
   */
  async logout() {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } finally {
      // JWTトークンとユーザー情報を削除
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  },

  /**
   * トークン確認（旧セッション確認）
   * @returns {Promise} レスポンス
   */
  async checkAuth() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return { success: true, authenticated: false };
    }
    
    try {
      const response = await api.get('/auth/check');
      return response.data;
    } catch (error) {
      // トークンが無効な場合は削除
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return { success: true, authenticated: false };
    }
  },

  /**
   * 後方互換性のため（旧メソッド名）
   */
  async checkSession() {
    return this.checkAuth();
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
