# 日報管理システム - 起動ガイド

このドキュメントでは、フロントエンドとバックエンドの起動方法について説明します。

## 前提条件

以下のソフトウェアがインストールされている必要があります：

- **Node.js**: v16.x 以上
- **npm**: v8.x 以上（Node.jsに同梱）
- **PostgreSQL**: v13.x 以上
- **Git**: v2.x 以上（任意）

## 1. データベースのセットアップ

### PostgreSQLのインストールと設定

1. PostgreSQLをインストール
2. PostgreSQLサービスを起動
3. データベースとユーザーを作成

```sql
-- PostgreSQLにログイン
psql -U postgres

-- データベースの作成
CREATE DATABASE dailyreport;

-- ユーザーの作成（オプション）
CREATE USER dailyreport_user WITH PASSWORD 'your_password';

-- 権限の付与
GRANT ALL PRIVILEGES ON DATABASE dailyreport TO dailyreport_user;

-- 接続を終了
\q
```

## 2. バックエンドのセットアップと起動

### 2.1. ディレクトリ移動

```bash
cd C:\Users\SKK\Documents\SKKReport\new\backend
```

### 2.2. 依存関係のインストール

```bash
npm install
```

### 2.3. 環境変数の設定

`.env` ファイルを作成し、以下の内容を設定します：

```bash
# データベース接続文字列
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/dailyreport?schema=public"

# または、カスタムユーザーを使用する場合
# DATABASE_URL="postgresql://dailyreport_user:your_password@localhost:5432/dailyreport?schema=public"

# サーバーポート
PORT=3000

# 環境
NODE_ENV=development

# セッションシークレット（本番環境では強力なランダム文字列を使用）
SESSION_SECRET=your-secret-key-change-this-in-production

# フロントエンドURL
FRONTEND_URL=http://localhost:8080
```

**重要**: `your_password` を実際のPostgreSQLパスワードに置き換えてください。

### 2.4. Prismaのセットアップ

#### Prismaクライアントの生成

```bash
npm run prisma:generate
```

#### データベースマイグレーションの実行

```bash
npm run prisma:migrate
```

マイグレーション名を聞かれた場合は、`init` など任意の名前を入力してください。

#### 初期データの投入（シード）

```bash
npm run prisma:seed
```

これにより、以下のデフォルトアカウントが作成されます：

**管理者アカウント:**
- ユーザー名: `admin`
- パスワード: `admin123`

**テストユーザーアカウント:**
- ユーザー名: `testuser`
- パスワード: `test123`

### 2.5. バックエンドサーバーの起動

#### 開発モード（nodemon使用、自動再起動）

```bash
npm run dev
```

#### 本番モード

```bash
npm start
```

サーバーが正常に起動すると、以下のようなログが表示されます：

```
Server is running on port 3000
Environment: development
```

### 2.6. 動作確認

ブラウザまたはcurlコマンドで以下のURLにアクセス：

```bash
curl http://localhost:3000/api/health
```

レスポンス例：
```json
{
  "status": "OK",
  "timestamp": "2025-12-09T10:30:00.000Z"
}
```

## 3. フロントエンドのセットアップと起動

### 3.1. ディレクトリ移動

**新しいターミナル/コマンドプロンプトを開いて**実行してください：

```bash
cd C:\Users\SKK\Documents\SKKReport\new\frontend
```

### 3.2. 依存関係のインストール

```bash
npm install
```

### 3.3. 環境変数の設定

`.env` ファイルを作成し、以下の内容を設定します：

```bash
# アプリケーションタイトル
VUE_APP_TITLE=日報管理システム

# バックエンドAPIのベースURL
VUE_APP_API_BASE_URL=http://localhost:3000
```

### 3.4. フロントエンド開発サーバーの起動

```bash
npm run serve
```

サーバーが正常に起動すると、以下のようなメッセージが表示されます：

```
App running at:
- Local:   http://localhost:8080/
- Network: http://192.168.x.x:8080/

Note that the development build is not optimized.
To create a production build, run npm run build.
```

### 3.5. ブラウザでアクセス

ブラウザで以下のURLを開きます：

```
http://localhost:8080/
```

## 4. 動作確認手順

### 4.1. ログイン

1. ブラウザで `http://localhost:8080/` ｓにアクセス
2. ログイン画面が表示される
3. 以下のいずれかのアカウントでログイン：

   **管理者:**
   - ユーザー名: `admin`
   - パスワード: `admin123`

   **一般ユーザー:**
   - ユーザー名: `testuser`
   - パスワード: `test123`

### 4.2. 主要機能の確認

#### 一般ユーザー（testuser）の場合：

1. **日報一覧**: カレンダー表示で日報を確認
2. **日報登録**:
   - 「日報登録」メニューをクリック
   - 日付を選択
   - Markdownエディタで内容を入力
   - 画像を表示したい場合は `![説明](画像URL)` の形式で記述
   - 「登録」ボタンをクリック
3. **日報詳細**: 登録した日報をクリックして詳細を表示
4. **フィードバック**: 他のユーザーの日報にフィードバックを投稿
5. **リアクション**: 👍 ❤️ 😊 などのリアクションを追加
6. **メンション**: 自分宛のメンションを確認
7. **お知らせ**: システムのお知らせを確認
8. **プロフィール設定**: パスワード変更

#### 管理者（admin）の場合：

1. **従業員管理**: 従業員の登録・編集・削除
2. **お知らせ登録**: システムのお知らせを投稿
3. **日報検索**: 全従業員の日報を検索
4. **日報一覧**: 全従業員の日報を閲覧

### 4.3. Markdown機能の確認

日報登録画面で以下のMarkdown記法を試してください：

```markdown
# 見出し1
## 見出し2

**太字** *斜体* ~~打ち消し線~~

- リスト項目1
- リスト項目2

1. 番号付きリスト
2. 項目2

[リンクテキスト](https://example.com)

![画像の説明](https://via.placeholder.com/300x200)

`インラインコード`

\```
コードブロック
\```

> 引用文

| 列1 | 列2 |
|-----|-----|
| A   | B   |
```

プレビューボタンをクリックすると、レンダリング結果が表示されます。

## 5. トラブルシューティング

### バックエンドが起動しない

**データベース接続エラー:**
```
Error: P1001: Can't reach database server
```
→ PostgreSQLが起動しているか確認
→ `.env` の `DATABASE_URL` が正しいか確認

**ポート使用中エラー:**
```
Error: listen EADDRINUSE: address already in use :::3000
```
→ ポート3000が既に使用されている
→ 別のプロセスを終了するか、`.env` の `PORT` を変更

### フロントエンドが起動しない

**ポート使用中エラー:**
```
Port 8080 is already in use
```
→ ポート8080が既に使用されている
→ 別のプロセスを終了するか、`vue.config.js` でポートを変更

### ログインできない

1. シードデータが投入されているか確認：
   ```bash
   cd backend
   npm run prisma:seed
   ```

2. データベースのemployeeテーブルを確認：
   ```bash
   npm run prisma:studio
   ```
   ブラウザで `http://localhost:5555` が開き、データを確認できます

### API通信エラー

**CORS エラー:**
→ バックエンドの `.env` で `FRONTEND_URL` が正しく設定されているか確認

**401 Unauthorized:**
→ セッションが切れている可能性があります。再ログインしてください

## 6. 停止方法

### バックエンドの停止

ターミナルで `Ctrl + C` を押下

### フロントエンドの停止

ターミナルで `Ctrl + C` を押下

## 7. 本番環境へのデプロイ

### バックエンド

1. 環境変数を本番用に設定（特に `SESSION_SECRET` は強力なランダム文字列に変更）
2. `NODE_ENV=production` に設定
3. `npm start` でサーバーを起動
4. リバースプロキシ（Nginx等）の設定を推奨

### フロントエンド

1. ビルド実行：
   ```bash
   npm run build
   ```

2. `dist/` ディレクトリが生成される

3. 静的ファイルホスティング（Nginx, Apache等）で `dist/` を公開

## 8. 便利なコマンド

### バックエンド

```bash
# Prisma Studio（データベースGUI）の起動
npm run prisma:studio

# データベースをリセット（全データ削除）
npx prisma migrate reset

# マイグレーションの状態確認
npx prisma migrate status
```

### フロントエンド

```bash
# ビルド（本番用）
npm run build

# Lint実行
npm run lint
```

## 9. サポート

問題が発生した場合は、以下を確認してください：

1. Node.jsとnpmのバージョン
   ```bash
   node --version
   npm --version
   ```

2. PostgreSQLの起動状態
   ```bash
   # Windowsの場合
   sc query postgresql-x64-13

   # または
   services.msc
   ```

3. ログファイルの確認
   - バックエンド: `backend/logs/combined.log`, `backend/logs/error.log`
   - ブラウザ: 開発者ツール（F12）のConsoleタブ

---

**最終更新日**: 2025年12月9日
