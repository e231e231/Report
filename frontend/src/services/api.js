import axios from 'axios';
import router from '@/router';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || '/api',
  withCredentials: true, // セッションCookieを送信
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30秒タイムアウト
});

// リクエストインターセプター
api.interceptors.request.use(
  (config) => {
    // ローディング表示などの処理をここに追加可能
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // サーバーからのエラーレスポンス
      const { status, data } = error.response;

      if (status === 401) {
        // 認証エラー時はログイン画面へ
        router.push('/login');
      } else if (status === 403) {
        // 権限エラー
        console.error('アクセス権限がありません');
      } else if (status === 404) {
        // リソースが見つからない
        console.error('リソースが見つかりません');
      } else if (status >= 500) {
        // サーバーエラー
        console.error('サーバーエラーが発生しました');
      }

      // エラーメッセージを統一
      error.message = data?.error || error.message || 'エラーが発生しました';
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがない
      error.message = 'サーバーに接続できません';
    }

    return Promise.reject(error);
  }
);

export default api;
