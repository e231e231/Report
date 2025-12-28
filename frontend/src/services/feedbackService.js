import api from './api';

export default {
  /**
   * フィードバック登録
   * @param {object} data - フィードバックデータ
   * @returns {Promise} レスポンス
   */
  async create(data) {
    const response = await api.post('/feedbacks', data);
    return response.data;
  },

  /**
   * フィードバック更新
   * @param {string} id - フィードバックID
   * @param {object} data - 更新データ
   * @returns {Promise} レスポンス
   */
  async update(id, data) {
    const response = await api.put(`/feedbacks/${id}`, data);
    return response.data;
  },

  /**
   * フィードバック削除
   * @param {string} id - フィードバックID
   * @returns {Promise} レスポンス
   */
  async delete(id) {
    const response = await api.delete(`/feedbacks/${id}`);
    return response.data;
  },

  /**
   * メンション一覧取得
   * @returns {Promise} レスポンス
   */
  async getMentions() {
    const response = await api.get('/feedbacks/mentions');
    return response.data;
  },

  /**
   * 最近のメンション取得（上位N件）
   * @param {number} limit - 取得件数
   * @returns {Promise} レスポンス
   */
  async getRecentMentions(limit = 5) {
    const response = await api.get('/feedbacks/mentions/recent', {
      params: { limit }
    });
    return response.data;
  }
};
