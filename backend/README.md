# DailyReport System - Backend

日報管理システムのバックエンドAPI（Node.js + Express + Prisma + PostgreSQL）

## 技術スタック

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **認証**: express-session（セッションベース）
- **セキュリティ**: bcryptjs, helmet, xss-clean, DOMPurify
- **ログ**: Winston

## 主要な改善点

旧システム（ASP.NET MVC）から以下の改善を実施：

### セキュリティ改善（優先度：緊急）

✅ **パスワードハッシュ化**: bcryptjsを使用してパスワードを安全に保存
✅ **XSSサニタイゼーション**: DOMPurifyでHTMLコンテンツをサニタイズ
✅ **HTTPS対応**: 本番環境でHTTPSを強制（nginx/リバースプロキシで設定）
✅ **機密情報保護**: 環境変数でDB接続情報を管理
✅ **CSRF対策**: セッションベース認証でCSRF保護

### パフォーマンス改善（優先度：高）

✅ **N+1問題の解決**: リアクション取得を一括化（reactionService.js）
✅ **DBインデックス**: Prismaスキーマで主要カラムにインデックスを設定
✅ **クエリ最適化**: Prismaの`include`で必要なデータのみ取得

### コード品質改善（優先度：高）

✅ **ログ機能**: Winstonで包括的なログ記録
✅ **エラーハンドリング**: 統一されたエラーハンドラー
✅ **サービス層の導入**: Controllers → Services → Prismaの責務分離

## プロジェクト構造

```
backend/
├── server.js                # エントリーポイント
├── schema.prisma           # Prismaスキーマ
├── package.json
├── .env.example            # 環境変数のサンプル
├── controllers/            # ビジネスロジック
│   ├── authController.js
│   └── dailyReportController.js
├── services/               # データアクセス層
│   ├── authService.js
│   ├── dailyReportService.js
│   ├── reactionService.js  # N+1問題を解決
│   ├── feedbackService.js
│   ├── employeeService.js
│   ├── informationService.js
│   └── mailService.js
├── routes/                 # APIルーティング
│   ├── auth.js
│   ├── dailyReport.js
│   ├── feedback.js
│   ├── reaction.js
│   ├── employee.js
│   ├── information.js
│   └── mail.js
├── middleware/             # ミドルウェア
│   ├── auth.js             # 認証・認可
│   └── errorHandler.js     # エラーハンドリング
├── utils/                  # ユーティリティ
│   ├── logger.js           # Winstonロガー
│   └── sanitizer.js        # XSS対策
├── prisma/
│   └── seed.js             # 初期データ投入
└── logs/                   # ログファイル（自動生成）
    ├── combined.log
    └── error.log
```

## セットアップ

### 1. 依存関係のインストール

```bash
cd new/backend
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`を作成：

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/dailyreport_db?schema=public"
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-session-secret-key-change-this-in-production
FRONTEND_URL=http://localhost:8080
```

### 3. PostgreSQLデータベースの準備

PostgreSQLをインストール後、データベースを作成：

```sql
CREATE DATABASE dailyreport_db;
```

### 4. Prismaマイグレーション

```bash
# Prismaクライアントの生成
npm run prisma:generate

# データベースマイグレーション
npm run prisma:migrate

# 初期データの投入
npm run prisma:seed
```

### 5. サーバー起動

```bash
# 開発モード（nodemon）
npm run dev

# 本番モード
npm start
```

サーバーは `http://localhost:3000` で起動します。

## API エンドポイント

### 認証

- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/session` - セッション確認
- `POST /api/auth/change-password` - パスワード変更

### 日報

- `POST /api/daily-reports` - 日報登録（管理者以外）
- `GET /api/daily-reports` - 日報一覧取得
- `GET /api/daily-reports/:id` - 日報詳細取得
- `PUT /api/daily-reports/:id` - 日報更新
- `GET /api/daily-reports/search/by-year?year=2024` - 年度別検索（管理者のみ）
- `DELETE /api/daily-reports/year/:year` - 年度別削除（管理者のみ）
- `GET /api/daily-reports/dates/list` - カレンダー用日付リスト

### フィードバック

- `POST /api/feedbacks` - フィードバック登録
- `PUT /api/feedbacks/:id` - フィードバック更新
- `GET /api/feedbacks/mentions` - メンション一覧取得

### リアクション

- `POST /api/reactions/toggle` - リアクション追加/削除

### 従業員

- `GET /api/employees` - 従業員一覧取得（管理者のみ）
- `POST /api/employees` - 従業員登録（管理者のみ）
- `GET /api/employees/:id` - 従業員詳細取得
- `PUT /api/employees/:id` - 従業員更新（管理者のみ）
- `DELETE /api/employees/:id` - 従業員削除（管理者のみ）
- `PATCH /api/employees/:id/role` - ロール変更（管理者のみ）
- `POST /api/employees/color/random` - カラーランダム変更

### お知らせ

- `GET /api/information?limit=3` - お知らせ一覧取得
- `GET /api/information/:id` - お知らせ詳細取得
- `POST /api/information` - お知らせ登録（管理者のみ）

### メール

- `GET /api/mail` - メール一覧取得（管理者のみ）
- `POST /api/mail` - メール送信
- `PATCH /api/mail/:id/read` - メール既読化（管理者のみ）

## デフォルトアカウント

初期データ投入（`npm run prisma:seed`）後、以下のアカウントが利用可能：

- **管理者**: `username=admin`, `password=admin123`
- **テストユーザー**: `username=testuser`, `password=test123`

## ログ

ログは`logs/`ディレクトリに自動的に記録されます：

- `combined.log`: すべてのログ
- `error.log`: エラーログのみ

## データベース管理

### Prisma Studio（GUI）

```bash
npm run prisma:studio
```

ブラウザで `http://localhost:5555` を開くとデータベースをGUIで管理できます。

### マイグレーション

スキーマ変更後：

```bash
npm run prisma:migrate
```

## 本番環境へのデプロイ

### 環境変数の設定

本番環境では以下を必ず変更：

```env
NODE_ENV=production
SESSION_SECRET=<強力なランダム文字列>
DATABASE_URL=<本番DBの接続文字列>
```

### HTTPS設定

Nginx等のリバースプロキシでHTTPSを設定してください。

### ログローテーション

`logrotate`等でログファイルをローテーションすることを推奨します。

## トラブルシューティング

### Prismaクライアントが見つからない

```bash
npm run prisma:generate
```

### マイグレーションエラー

```bash
# マイグレーションをリセット（開発環境のみ）
npx prisma migrate reset
npm run prisma:seed
```

### ポートが使用中

`.env`ファイルで`PORT`を変更してください。

## 開発メモ

- パスワードは必ずbcryptでハッシュ化
- ユーザー入力は必ずサニタイズ（`utils/sanitizer.js`）
- すべてのAPI操作はログに記録（`utils/logger.js`）
- エラーは必ずtry-catchで捕捉してnext(error)
