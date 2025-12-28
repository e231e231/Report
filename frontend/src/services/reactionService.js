import api from './api';

export default {
  /**
   * リアクション追加/削除（トグル）
   * @param {object} data - リアクションデータ
   * @returns {Promise} レスポンス
   */
  async toggle(data) {
    const response = await api.post('/reactions/toggle', data);
    return response.data;
  }
};
