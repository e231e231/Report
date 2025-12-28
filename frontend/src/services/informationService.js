import api from './api';

export default {
  /**
   * お知らせ一覧取得
   * @param {number} limit - 取得件数制限
   * @returns {Promise} レスポンス
   */
  async getList(limit = null) {
    const params = limit ? { limit } : {};
    const response = await api.get('/information', { params });
    return response.data;
  },

  /**
   * お知らせ詳細取得
   * @param {string} id - お知らせID
   * @returns {Promise} レスポンス
   */
  async getDetail(id) {
    const response = await api.get(`/information/${id}`);
    return response.data;
  },

  /**
   * お知らせ登録
   * @param {object} data - お知らせデータ
   * @returns {Promise} レスポンス
   */
  async create(data) {
    const response = await api.post('/information', data);
    return response.data;
  }
};
