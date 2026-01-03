# フロントエンド JWT認証移行 - 変更完了

## ✅ 実装した変更

### 1. [services/authService.js](frontend/src/services/authService.js)
- ログイン時にJWTトークンを`localStorage`に保存
- ログアウト時にトークンを削除
- エンドポイント変更: `/auth/session` → `/auth/check`
- 後方互換のため`checkSession()`メソッドも維持

### 2. [services/api.js](frontend/src/services/api.js)
- **リクエストインターセプター**: 全APIリクエストに`Authorization: Bearer <token>`ヘッダーを自動付与
- **レスポンスインターセプター**: 401エラー時にトークンを削除してログイン画面へリダイレクト

### 3. [stores/auth.js](frontend/src/stores/auth.js)
- `login()`: トークンとユーザー情報を分離して保存
- `initializeAuth()`: アプリ起動時に`localStorage`から認証状態を復元
- `updateUser()`: ユーザー情報更新時に`localStorage`も同期

### 4. [main.js](frontend/src/main.js)
- アプリマウント前に`authStore.initializeAuth()`を実行
- ページリロード時も認証状態を維持

### 5. [router/index.js](frontend/src/router/index.js)
- トークンの存在チェックを追加
- トークン検証失敗時のエラーハンドリング強化
- より堅牢な認証ガード実装

## 🔄 認証フロー

### ログイン
1. ユーザーが認証情報を入力
2. バックエンドがJWTトークンを発行
3. フロントエンドが`localStorage`にトークン保存
4. 以降のAPIリクエストに自動でトークンが付与される

### ページ遷移
1. ルーターガードがトークンの存在をチェック
2. 必要に応じてサーバー側でトークン検証
3. 認証OK → ページ表示
4. 認証NG → ログイン画面へリダイレクト

### ログアウト
1. バックエンドへログアウトリクエスト送信
2. `localStorage`からトークンとユーザー情報を削除
3. ログイン画面へリダイレクト

## 📝 localStorage に保存されるデータ

```javascript
// JWTトークン
localStorage.getItem('authToken')
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// ユーザー情報（トークンなし）
localStorage.getItem('user')
// {"id":"xxx","userName":"admin","employeeName":"管理者","role":0,"color":"#FF5733"}
```

## 🧪 動作確認

### 1. ログインテスト
```bash
cd frontend
npm run serve
```
ブラウザで http://localhost:8080 にアクセスしてログイン

### 2. デベロッパーツールで確認
- Application → Local Storage → `authToken`と`user`が保存されているか
- Network → リクエストヘッダーに`Authorization: Bearer ...`が付与されているか

### 3. トークン有効期限テスト
- 7日後にトークンが自動で無効化され、ログイン画面にリダイレクトされるか

## ⚠️ 注意事項

### セキュリティ
- `localStorage`はXSS攻撃に脆弱。本番環境ではCSP（Content Security Policy）を設定
- HTTPSを必須とする（トークンの盗聴防止）

### ブラウザの制約
- `localStorage`はドメインごとに分離
- プライベートブラウジングでは制限あり

### トークン有効期限
- デフォルト: 7日間（`JWT_EXPIRES_IN=7d`）
- 期限切れ時は再ログインが必要

## 🔄 バックエンドとの互換性

この実装は以下のバックエンド変更と対応しています：

- ✅ JWT認証（`jsonwebtoken`）
- ✅ `/auth/check` エンドポイント
- ✅ `Authorization: Bearer <token>` ヘッダー認証
- ✅ `req.user` でユーザー情報取得

## 🚀 次のステップ

フロントエンドの修正が完了しました。以下の手順でテストしてください：

1. **バックエンドを起動**
   ```bash
   cd backend
   npm install  # 新しい依存関係をインストール
   npm run dev
   ```

2. **フロントエンドを起動**
   ```bash
   cd frontend
   npm run serve
   ```

3. **動作確認**
   - ログイン → 成功してトークンが保存されるか
   - ページリロード → 認証状態が維持されるか
   - API呼び出し → トークンが自動付与されるか
   - ログアウト → トークンが削除されるか

すべて完了です！🎉
