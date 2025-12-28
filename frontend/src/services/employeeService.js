import api from './api';

export default {
  /**
   * 従業員一覧取得
   * @returns {Promise} レスポンス
   */
  async getList() {
    const response = await api.get('/employees');
    return response.data;
  },

  /**
   * 従業員詳細取得
   * @param {string} id - 従業員ID
   * @returns {Promise} レスポンス
   */
  async getDetail(id) {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  /**
   * 従業員登録
   * @param {object} data - 従業員データ
   * @returns {Promise} レスポンス
   */
  async create(data) {
    const response = await api.post('/employees', data);
    return response.data;
  },

  /**
   * 従業員更新
   * @param {string} id - 従業員ID
   * @param {object} data - 更新データ
   * @returns {Promise} レスポンス
   */
  async update(id, data) {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  /**
   * 従業員削除
   * @param {string} id - 従業員ID
   * @returns {Promise} レスポンス
   */
  async delete(id) {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  /**
   * ロール変更
   * @param {string} id - 従業員ID
   * @param {number} role - 新しいロール
   * @returns {Promise} レスポンス
   */
  async updateRole(id, role) {
    const response = await api.patch(`/employees/${id}/role`, { role });
    return response.data;
  },

  /**
   * カラーランダム変更
   * @returns {Promise} レスポンス
   */
  async updateColorRandom() {
    const response = await api.post('/employees/color/random');
    return response.data;
  },

  /**
   * カラー変更（指定）
   * @param {string} id - 従業員ID
   * @param {string} color - カラーコード（#RRGGBB）
   * @returns {Promise} レスポンス
   */
  async updateColor(id, color) {
    const response = await api.patch(`/employees/${id}/color`, { color });
    return response.data;
  },

  /**
   * 全従業員取得（管理者以外）
   * @returns {Promise} レスポンス
   */
  async getAll() {
    const response = await api.get('/employees');
    return response.data;
  }
};
