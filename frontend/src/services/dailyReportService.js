import api from './api';

export default {
  /**
   * 日報一覧取得
   * @param {string} date - 日付（YYYY-MM-DD）
   * @param {string} roleFilter - ロールフィルター
   * @returns {Promise} レスポンス
   */
  async getList(date, roleFilter = 'All') {
    const response = await api.get('/daily-reports', {
      params: { date, roleFilter }
    });
    return response.data;
  },

  /**
   * 日報詳細取得
   * @param {string} id - 日報ID
   * @returns {Promise} レスポンス
   */
  async getDetail(id) {
    const response = await api.get(`/daily-reports/${id}`);
    return response.data;
  },

  /**
   * 日報詳細取得（getByIdエイリアス）
   * @param {string} id - 日報ID
   * @returns {Promise} レスポンス
   */
  async getById(id) {
    return this.getDetail(id);
  },

  /**
   * 日報登録
   * @param {object} data - 日報データ
   * @returns {Promise} レスポンス
   */
  async create(data) {
    const response = await api.post('/daily-reports', data);
    return response.data;
  },

  /**
   * 日報更新
   * @param {string} id - 日報ID
   * @param {object} data - 更新データ
   * @returns {Promise} レスポンス
   */
  async update(id, data) {
    const response = await api.put(`/daily-reports/${id}`, data);
    return response.data;
  },

  /**
   * 日報削除
   * @param {string} id - 日報ID
   * @returns {Promise} レスポンス
   */
  async delete(id) {
    const response = await api.delete(`/daily-reports/${id}`);
    return response.data;
  },

  /**
   * 年度別検索
   * @param {number} year - 年度
   * @returns {Promise} レスポンス
   */
  async searchByYear(year) {
    const response = await api.get('/daily-reports/search/by-year', {
      params: { year }
    });
    return response.data;
  },

  /**
   * 年度別削除
   * @param {number} year - 年度
   * @returns {Promise} レスポンス
   */
  async deleteByYear(year) {
    const response = await api.delete(`/daily-reports/year/${year}`);
    return response.data;
  },

  /**
   * カレンダー用日付リスト取得
   * @returns {Promise} レスポンス
   */
  async getReportDates() {
    const response = await api.get('/daily-reports/dates/list');
    return response.data;
  },

  /**
   * 月別日報取得
   * @param {object} params - パラメータ（year, month, employeeId）
   * @returns {Promise} レスポンス
   */
  async getByMonth(params) {
    const response = await api.get('/daily-reports/month/list', { params });
    return response.data;
  },

  /**
   * 前の日報がある日付を取得
   * @param {string} date - 現在の日付（YYYY-MM-DD）
   * @returns {Promise} レスポンス
   */
  async getPrevDate(date) {
    const response = await api.get('/daily-reports/dates/prev', {
      params: { date }
    });
    return response.data;
  },

  /**
   * 次の日報がある日付を取得
   * @param {string} date - 現在の日付（YYYY-MM-DD）
   * @returns {Promise} レスポンス
   */
  async getNextDate(date) {
    const response = await api.get('/daily-reports/dates/next', {
      params: { date }
    });
    return response.data;
  },

  /**
   * 年度別日報をCSV形式でエクスポート
   * @param {number} year - 年度
   * @returns {Promise} CSV Blobレスポンス
   */
  async exportCSV(year) {
    const response = await api.get('/daily-reports/export/csv', {
      params: { year },
      responseType: 'blob'
    });
    return response;
  }
};
