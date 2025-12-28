import api from './api';

export default {
  /**
   * 絵文字一覧取得
   * @returns {Promise} レスポンス
   */
  async getAll() {
    const response = await api.get('/reactions/emojis');
    return response.data;
  }
};
