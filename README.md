# 日報管理システム（DailyReport System）

ASP.NET MVCからVue.js + Node.js/Express + PostgreSQLへのコンバージョンプロジェクト

## プロジェクト概要

企業における日報の作成、管理、フィードバックを効率的に行うためのWebアプリケーションです。
新入社員の成長をサポートし、OJT（On-the-Job Training）を円滑に進めるためのコミュニケーションツールとして機能します。

## アーキテクチャ

### 旧システム
- **フロントエンド**: Razor View Engine + Bootstrap + jQuery
- **バックエンド**: ASP.NET MVC 5 (C#)
- **データベース**: SQL Server
- **認証**: Forms Authentication

### 新システム
- **フロントエンド**: Vue.js 3 (Composition API)
- **バックエンド**: Node.js + Express.js
- **データベース**: PostgreSQL
- **ORM**: Prisma
- **認証**: express-session（セッションベース）

## 主要な改善点

### セキュリティ改善（優先度：🔴 緊急）

| 項目 | 旧システム | 新システム | 状態 |
|------|-----------|-----------|------|
| パスワード管理 | 平文保存 | bcryptでハッシュ化 | ✅ 実装済 |
| XSS対策 | 不十分 | DOMPurifyでサニタイズ | ✅ 実装済 |
| HTTPS | 未対応 | 対応可能 | ✅ 実装済 |
| 機密情報保護 | Web.configに平文 | 環境変数で管理 | ✅ 実装済 |
| CSRF対策 | 一部のみ | 全POST操作で対策 | ✅ 実装済 |

### パフォーマンス改善（優先度：🟠 高）

| 項目 | 旧システム | 新システム | 状態 |
|------|-----------|-----------|------|
| N+1問題 | あり（リアクション取得） | 一括取得で解決 | ✅ 実装済 |
| DBインデックス | 不十分 | 主要カラムに設定 | ✅ 実装済 |
| ログ機能 | なし | Winston導入 | ✅ 実装済 |

### コード品質改善

| 項目 | 旧システム | 新システム | 状態 |
|------|-----------|-----------|------|
| 責務分離 | Controller内に混在 | Controller → Service → Prisma | ✅ 実装済 |
| エラーハンドリング | 場当たり的 | 統一されたハンドラー | ✅ 実装済 |
| ログ | なし | 包括的なログ記録 | ✅ 実装済 |

## ディレクトリ構造

```
new/
├── backend/              # Node.js + Express バックエンド
│   ├── server.js
│   ├── schema.prisma
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── prisma/
│   └── README.md
├── frontend/             # Vue.js 3 フロントエンド
│   ├── src/
│   │   ├── views/
│   │   ├── components/
│   │   ├── stores/
│   │   ├── services/
│   │   └── router/
│   ├── public/
│   └── README.md
└── README.md            # このファイル
```

## クイックスタート

### 前提条件

- Node.js 16以上
- PostgreSQL 12以上
- npm または yarn

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd new
```

### 2. バックエンドのセットアップ

```bash
cd backend

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envを編集してデータベース接続情報を設定

# データベースの準備
createdb dailyreport_db  # PostgreSQL

# Prismaマイグレーション
npm run prisma:generate
npm run prisma:migrate

# 初期データの投入
npm run prisma:seed

# サーバー起動
npm run dev
```

バックエンドは `http://localhost:3000` で起動します。

### 3. フロントエンドのセットアップ

```bash
cd ../frontend

# 依存関係のインストール
npm install

# 環境変数の設定（必要に応じて）
# .env.developmentを編集

# 開発サーバー起動
npm run serve
```

フロントエンドは `http://localhost:8080` で起動します。

### 4. ログイン

デフォルトアカウント：
- **管理者**: `username=admin`, `password=admin123`
- **テストユーザー**: `username=testuser`, `password=test123`

## 主要な機能

### 1. 認証・ログイン機能
- セッションベース認証（120分有効）
- パスワードのハッシュ化（bcrypt）
- ロール別アクセス制御

### 2. 日報管理機能
- 日報の登録・編集・削除
- 日報の一覧表示・詳細表示
- カレンダー形式での日報表示
- 年度別の日報検索
- CSV形式での日報エクスポート（今後実装予定）

### 3. フィードバック機能
- 日報に対するコメント投稿
- コメントへの返信（スレッド形式）
- フィードバックの編集

### 4. リアクション機能
- 日報・フィードバックに対する絵文字リアクション（6種類）
- リアクションした従業員の一覧表示
- **N+1問題を解決**した高速な取得

### 5. 従業員管理機能（管理者のみ）
- 従業員の登録・編集・論理削除
- ロール（権限）の変更
- パスワード変更

### 6. お知らせ機能
- お知らせの登録・一覧表示・詳細表示

### 7. メール機能
- 管理者への連絡機能

### 8. ユーザーカスタマイズ機能
- ユーザーカラーのカスタマイズ（ランダム生成）

## API ドキュメント

詳細は `backend/README.md` を参照してください。

### 認証
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/session` - セッション確認

### 日報
- `POST /api/daily-reports` - 日報登録
- `GET /api/daily-reports` - 日報一覧取得
- `GET /api/daily-reports/:id` - 日報詳細取得
- `PUT /api/daily-reports/:id` - 日報更新

### フィードバック
- `POST /api/feedbacks` - フィードバック登録
- `GET /api/feedbacks/mentions` - メンション一覧取得

### その他
- 従業員管理API
- お知らせAPI
- メールAPI
- リアクションAPI

## データベース設計

### 主要テーブル

1. **employee** - 従業員
2. **daily_report** - 日報
3. **feedback** - フィードバック
4. **reaction** - リアクション
5. **emoji** - 絵文字マスター
6. **employee_role** - ロールマスター
7. **information** - お知らせ
8. **mail** - 管理者連絡

詳細なER図とテーブル定義は `old/設計書/03_データベース設計.md` を参照してください。

## セキュリティ

### 実装済みのセキュリティ対策

- ✅ パスワードのハッシュ化（bcrypt、ソルト10ラウンド）
- ✅ XSSサニタイゼーション（DOMPurify）
- ✅ HTTPS対応（本番環境での設定が必要）
- ✅ 機密情報の環境変数化
- ✅ CSRF対策（セッションベース認証）
- ✅ SQLインジェクション対策（Prismaのパラメータ化クエリ）
- ✅ セッションタイムアウト（120分）
- ✅ ロールベースアクセス制御

### 今後の検討事項

- レート制限（DDoS対策）
- 2要素認証
- セキュリティヘッダーの強化

## ログ

バックエンドでは包括的なログを記録：

- **combined.log**: すべてのログ
- **error.log**: エラーログのみ

ログレベル: error, warn, info, debug

## パフォーマンス

### N+1問題の解決

旧システムでは、日報一覧表示時にリアクション数を個別に取得していました（N+1問題）。

```csharp
// 旧システム（N+1問題あり）
foreach (var item in subList)
{
    emj1_Count.Add((from r in db.Reactions
                    where r.Emoji_ID == "EMJ00001" && r.Daily_Report_ID == item.ID
                    select r).Count());
}
```

新システムでは一括取得に変更：

```javascript
// 新システム（一括取得）
const reactions = await prisma.reaction.findMany({
  where: { dailyReportId: { in: reportIds } },
  include: { employee: true, emoji: true }
});
// グループ化してマッピング
```

### インデックス設定

Prismaスキーマで主要カラムにインデックスを設定：

```prisma
model DailyReport {
  // ...
  @@index([employeeId])
  @@index([calendar])
  @@index([year])
  @@index([calendar, employeeId])
}
```

## 開発

### コードフォーマット

```bash
# バックエンド
cd backend
npm run lint

# フロントエンド
cd frontend
npm run lint
```

### テスト（今後実装予定）

```bash
npm test
```

## デプロイ

### バックエンド

1. 環境変数を本番用に設定
2. `npm run build`でビルド（必要に応じて）
3. `npm start`で起動
4. Nginx等でリバースプロキシ設定

### フロントエンド

1. `npm run build`でビルド
2. `dist/`ディレクトリをWebサーバーに配置
3. Nginxで静的ファイルとして配信

### Docker（今後実装予定）

```bash
docker-compose up -d
```

## トラブルシューティング

### データベース接続エラー

`.env`ファイルの`DATABASE_URL`を確認してください。

### Prismaクライアントエラー

```bash
npm run prisma:generate
```

### ポート競合

`.env`ファイルで`PORT`を変更してください。

## コンバージョンメモ

### 移行されていない機能

以下の機能は新システムでは未実装または変更が必要です：

1. CSV出力機能（実装予定）
2. 特殊リアクション画面（ゲーム要素、今後検討）
3. 週報フラグ機能（仕様変更により削除）

### データ移行

旧システムからのデータ移行スクリプトは別途作成が必要です。

### 設計書との相違

実装は実際の旧プログラムを優先しています。設計書と異なる部分があります。

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## サポート

問題が発生した場合は、GitHubのIssueを作成してください。
