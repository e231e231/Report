import api from './api';

export default {
  /**
   * 画像アップロード
   * @param {File} file - 画像ファイル
   * @returns {Promise} レスポンス
   */
  async uploadImage(file) {
    // FormDataを作成
    const formData = new FormData();
    formData.append('image', file);

    // Content-Typeをmultipart/form-dataに設定
    const response = await api.post('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      // アップロード進捗を取得する場合
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    });

    return response.data;
  }
};
