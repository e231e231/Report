# フロントエンド側の必要な変更

バックエンドがAWS Lambda + JWT認証に移行したため、フロントエンド側で以下の変更が必要です。

## 🔐 1. 認証方式の変更（Session → JWT）

### 変更前（Session方式）
- Cookieでセッション管理
- 認証情報はサーバー側で保持

### 変更後（JWT方式）
- JWTトークンをクライアント側で保持
- すべてのAPIリクエストに `Authorization` ヘッダーを追加

## 📝 2. 必要な変更箇所

### 2-1. authService.js の変更

**ファイル**: `frontend/src/services/authService.js`

```javascript
// ログイン処理
export async function login(userName, password) {
  const response = await api.post('/auth/login', { userName, password });
  
  if (response.data.success && response.data.data.token) {
    // ✅ NEW: トークンを保存
    localStorage.setItem('authToken', response.data.data.token);
    
    // ユーザー情報も保存（オプション）
    localStorage.setItem('user', JSON.stringify(response.data.data));
  }
  
  return response.data;
}

// ログアウト処理
export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    // ✅ NEW: トークンを削除
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
}

// セッション確認 → トークン確認
export async function checkAuth() {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    return { authenticated: false };
  }
  
  try {
    // ✅ CHANGED: エンドポイントが /auth/session → /auth/check に変更
    const response = await api.get('/auth/check');
    return response.data;
  } catch (error) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return { authenticated: false };
  }
}
```

### 2-2. api.js の変更（Axiosインターセプター）

**ファイル**: `frontend/src/services/api.js`

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000/api',
  withCredentials: true, // Cookie用（削除してもOK）
  headers: {
    'Content-Type': 'application/json'
  }
});

// ✅ NEW: リクエストインターセプター（JWTトークン自動付与）
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ NEW: レスポンスインターセプター（401エラー時の処理）
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // トークンが無効な場合、ローカルストレージをクリア
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // ログインページにリダイレクト
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### 2-3. auth.js (Vuex Store) の変更

**ファイル**: `frontend/src/stores/auth.js`

```javascript
import { defineStore } from 'pinia';
import * as authService from '@/services/authService';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    loading: false
  }),

  actions: {
    async login(userName, password) {
      this.loading = true;
      try {
        const result = await authService.login(userName, password);
        
        if (result.success) {
          // ✅ NEW: トークン情報はlocalStorageで管理
          this.user = result.data;
          this.isAuthenticated = true;
        }
        
        return result;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      await authService.logout();
      this.user = null;
      this.isAuthenticated = false;
    },

    async checkAuth() {
      this.loading = true;
      try {
        const result = await authService.checkAuth();
        
        if (result.authenticated) {
          this.user = result.data;
          this.isAuthenticated = true;
        } else {
          this.user = null;
          this.isAuthenticated = false;
        }
        
        return result;
      } finally {
        this.loading = false;
      }
    },
    
    // ✅ NEW: 初期化時にlocalStorageからユーザー情報を復元
    initializeAuth() {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('authToken');
      
      if (userStr && token) {
        this.user = JSON.parse(userStr);
        this.isAuthenticated = true;
      }
    }
  }
});
```

### 2-4. main.js の変更

**ファイル**: `frontend/src/main.js`

```javascript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// ✅ NEW: アプリ起動時に認証状態を初期化
const authStore = useAuthStore();
authStore.initializeAuth();

app.mount('#app');
```

### 2-5. ルーターガードの変更（必要に応じて）

**ファイル**: `frontend/src/router/index.js`

```javascript
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ... routes
  ]
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // 認証が必要なページ
  if (to.meta.requiresAuth) {
    // ✅ CHANGED: トークンの存在をチェック
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      next({ name: 'Login' });
      return;
    }
    
    // 必要に応じてサーバー側でトークン検証
    if (!authStore.isAuthenticated) {
      await authStore.checkAuth();
      
      if (!authStore.isAuthenticated) {
        next({ name: 'Login' });
        return;
      }
    }
  }
  
  next();
});

export default router;
```

## 🌐 3. 環境変数の変更

**ファイル**: `frontend/.env` または `.env.production`

```env
# ローカル開発
VUE_APP_API_URL=http://localhost:3000/api

# 本番環境（Lambda）
VUE_APP_API_URL=https://your-api-gateway-url.execute-api.ap-northeast-1.amazonaws.com/prod/api
```

## 📸 4. 画像アップロード関連の変更

S3を使用するため、画像URLが変更されます：

### 変更前
```
http://localhost:3000/uploads/images/xxxxx.jpg
```

### 変更後（S3）
```
https://dailyreport-uploads-prod.s3.ap-northeast-1.amazonaws.com/images/xxxxx.jpg
```

画像表示のコンポーネントで相対パスではなく、APIから返されるフルURLを使用してください。

## ✅ 5. 変更確認チェックリスト

- [ ] `authService.js` のログイン/ログアウト処理を変更
- [ ] `api.js` にJWTトークン自動付与のインターセプター追加
- [ ] `auth.js`（Vuex/Pinia Store）を変更
- [ ] `main.js` で初期化処理を追加
- [ ] ルーターガードを更新
- [ ] 環境変数を設定（本番環境のAPI Gateway URL）
- [ ] 画像URLの扱いを確認
- [ ] すべてのAPIリクエストが正常に動作することを確認

## 🐛 6. トラブルシューティング

### 401 Unauthorized エラーが出る
- トークンが正しく保存されているか確認：`localStorage.getItem('authToken')`
- `Authorization` ヘッダーが正しく付与されているか確認
- トークンの有効期限が切れていないか確認

### CORS エラーが出る
- バックエンドの `FRONTEND_URL` 環境変数を確認
- API Gateway のCORS設定を確認

### 画像が表示されない
- S3バケットのパブリック読み取り権限を確認
- 画像URLがフルパス（S3のURL）になっているか確認

## 📚 参考

- [JWT.io](https://jwt.io/)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [Vue Router Navigation Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html)
