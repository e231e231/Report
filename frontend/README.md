# DailyReport System - Frontend

日報管理システムのフロントエンド（Vue.js 3）

## 技術スタック

- **Framework**: Vue.js 3 (Composition API)
- **状態管理**: Pinia
- **ルーティング**: Vue Router 4
- **HTTP Client**: Axios
- **UI Framework**: Bootstrap 5
- **セキュリティ**: DOMPurify（XSS対策）

## プロジェクト構造

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── main.js              # エントリーポイント
│   ├── App.vue              # ルートコンポーネント
│   ├── router/
│   │   └── index.js         # ルーティング設定
│   ├── stores/              # Pinia ストア
│   │   ├── auth.js          # 認証状態管理
│   │   └── notification.js  # 通知状態管理
│   ├── views/               # ページコンポーネント
│   │   ├── Login.vue
│   │   ├── DailyReportList.vue
│   │   ├── DailyReportRegister.vue
│   │   ├── DailyReportDetail.vue
│   │   ├── EmployeeList.vue
│   │   ├── InformationList.vue
│   │   └── ...
│   ├── components/          # 再利用可能なコンポーネント
│   │   ├── Layout/
│   │   │   ├── Navbar.vue
│   │   │   └── Footer.vue
│   │   ├── DailyReport/
│   │   │   ├── ReportCard.vue
│   │   │   └── ReactionButton.vue
│   │   └── Common/
│   │       ├── LoadingSpinner.vue
│   │       └── ErrorMessage.vue
│   ├── services/            # API通信
│   │   ├── api.js           # Axios設定
│   │   ├── authService.js
│   │   ├── dailyReportService.js
│   │   └── ...
│   ├── utils/               # ユーティリティ
│   │   ├── sanitizer.js     # XSS対策
│   │   └── formatters.js    # 日付等のフォーマット
│   └── assets/              # 静的ファイル
│       ├── styles/
│       └── images/
├── .env.development         # 開発環境変数
├── .env.production          # 本番環境変数
├── vue.config.js            # Vue CLI設定
└── package.json
```

## セットアップ

### 1. 依存関係のインストール

```bash
cd new/frontend
npm install
```

### 2. 環境変数の設定

`.env.development`を作成：

```env
VUE_APP_API_BASE_URL=http://localhost:3000/api
```

`.env.production`を作成：

```env
VUE_APP_API_BASE_URL=https://your-api-domain.com/api
```

### 3. 開発サーバー起動

```bash
npm run serve
```

ブラウザで `http://localhost:8080` を開きます。

### 4. ビルド（本番用）

```bash
npm run build
```

`dist/`ディレクトリに本番用ファイルが生成されます。

## 主要な機能

### 認証

- セッションベース認証
- 認証状態はPiniaストアで管理
- ルートガードで未認証ユーザーをログイン画面にリダイレクト

### 日報管理

- 日報の登録・編集・一覧表示・詳細表示
- カレンダー形式での日付選択
- リアルタイムのリアクション表示

### フィードバック

- スレッド形式の返信機能
- リアクション機能（6種類の絵文字）

### セキュリティ

- XSS対策: DOMPurifyでHTMLをサニタイズ
- CSRF対策: セッションCookieを使用

## 主要画面

### ログイン画面（Login.vue）

```vue
<template>
  <div class="login-container">
    <form @submit.prevent="handleLogin">
      <input v-model="username" placeholder="ユーザー名" />
      <input v-model="password" type="password" placeholder="パスワード" />
      <button type="submit">ログイン</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const username = ref('');
const password = ref('');

const handleLogin = async () => {
  await authStore.login(username.value, password.value);
  router.push('/daily-reports');
};
</script>
```

### 日報一覧画面（DailyReportList.vue）

- カレンダー形式での日付選択
- ロール別フィルター（新入社員/先輩社員/全員）
- リアクション数とフィードバック数の表示
- お知らせ上位3件の表示

### 日報詳細画面（DailyReportDetail.vue）

- 日報内容の表示
- フィードバック一覧（スレッド形式）
- リアクションボタン
- フィードバック投稿フォーム

### 従業員管理画面（EmployeeList.vue）（管理者のみ）

- 従業員の一覧・登録・編集・削除
- ロール変更機能

## API連携

### Axios設定（services/api.js）

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  withCredentials: true, // セッションCookie送信
  headers: {
    'Content-Type': 'application/json'
  }
});

// リクエストインターセプター
api.interceptors.request.use(
  config => {
    // ローディング表示など
    return config;
  },
  error => Promise.reject(error)
);

// レスポンスインターセプター
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 認証エラー時はログイン画面へ
      router.push('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 認証ストア（stores/auth.js）

```javascript
import { defineStore } from 'pinia';
import authService from '@/services/authService';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false
  }),
  actions: {
    async login(username, password) {
      const response = await authService.login(username, password);
      this.user = response.data;
      this.isAuthenticated = true;
    },
    async logout() {
      await authService.logout();
      this.user = null;
      this.isAuthenticated = false;
    },
    async checkSession() {
      const response = await authService.checkSession();
      if (response.authenticated) {
        this.user = response.data;
        this.isAuthenticated = true;
      }
    }
  }
});
```

## ルーティング

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/daily-reports',
    name: 'DailyReportList',
    component: () => import('@/views/DailyReportList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/daily-reports/:id',
    name: 'DailyReportDetail',
    component: () => import('@/views/DailyReportDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/employees',
    name: 'EmployeeList',
    component: () => import('@/views/EmployeeList.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
  // ... 他のルート
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// ルートガード
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresAdmin && authStore.user?.role !== 0) {
    next('/daily-reports');
  } else {
    next();
  }
});

export default router;
```

## XSS対策

```javascript
// utils/sanitizer.js
import DOMPurify from 'dompurify';

export const sanitizeHtml = (dirty) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'title']
  });
};
```

## デプロイ

### Nginx設定例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/dailyreport/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## トラブルシューティング

### CORS エラー

バックエンドの`server.js`で`FRONTEND_URL`が正しく設定されているか確認。

### セッションが保持されない

- `withCredentials: true`がAxios設定に含まれているか確認
- バックエンドのCORS設定で`credentials: true`が設定されているか確認

## 今後の拡張

- リアルタイム通知（WebSocket）
- オフライン対応（Service Worker）
- ダークモード
- モバイル対応の強化
