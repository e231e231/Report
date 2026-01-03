# DailyReport Backend API - AWS Lambda Version

Node.js + Express + Prisma + PostgreSQL による日報管理システムのバックエンドAPI

**AWS Lambda + API Gateway + Serverless Framework 対応版**

## 🚀 主な技術スタック

- **Runtime**: Node.js 18.x
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL (RDS推奨)
- **Authentication**: JWT (JSON Web Token)
- **File Storage**: AWS S3
- **Logging**: Winston → CloudWatch Logs
- **Deployment**: Serverless Framework
- **Infrastructure**: AWS Lambda + API Gateway

## 📁 プロジェクト構造

```
backend/
├── app.js                 # Expressアプリ定義（Lambda/ローカル共通）
├── lambda.js              # Lambda関数ハンドラー
├── server.js              # ローカル開発用サーバー
├── serverless.yml         # Serverless Framework設定
├── controllers/           # コントローラー
├── services/              # ビジネスロジック
├── routes/                # ルート定義
├── middleware/            # ミドルウェア
│   ├── auth.js           # JWT認証
│   ├── upload.js         # S3アップロード対応
│   └── errorHandler.js   # エラーハンドリング
├── utils/                 # ユーティリティ
│   ├── logger.js         # CloudWatch対応ロガー
│   └── ...
└── prisma/               # Prismaスキーマとマイグレーション
```

## 🔧 セットアップ

### 1. 依存パッケージのインストール

```bash
cd backend
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成：

```bash
cp .env.example .env
```

必要な環境変数を設定：

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/dailyreport?schema=public"
JWT_SECRET="your-secret-key"
FRONTEND_URL=http://localhost:8080
```

### 3. Prismaのセットアップ

```bash
# Prismaクライアント生成
npm run prisma:generate

# マイグレーション実行
npm run prisma:migrate

# シードデータ投入（オプション）
npm run prisma:seed
```

### 4. ローカル開発

```bash
# 開発サーバー起動
npm run dev

# または
npm start
```

サーバーは `http://localhost:3000` で起動します。

## 🚀 AWS Lambdaへのデプロイ

### 前提条件

- AWS CLI の設定完了
- Serverless Framework のインストール：`npm install -g serverless`
- AWS アカウントとIAM権限の設定

### デプロイ手順

#### 1. Serverless Frameworkのグローバルインストール（未インストールの場合）

```bash
npm install -g serverless
```

#### 2. AWS認証情報の設定

```bash
aws configure
```

または環境変数で設定：

```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
```

#### 3. RDSデータベースの準備

PostgreSQLデータベースをAWS RDS上に作成し、接続情報を取得

#### 4. 環境変数の設定

本番環境用の環境変数を設定（AWS Systems Manager Parameter Store推奨）：

```bash
# 例: Parameter Storeに保存
aws ssm put-parameter --name /dailyreport/prod/DATABASE_URL --value "postgresql://..." --type SecureString
aws ssm put-parameter --name /dailyreport/prod/JWT_SECRET --value "your-secret" --type SecureString
```

または `serverless.yml` の環境変数セクションで直接指定。

#### 5. デプロイコマンド

```bash
# 開発環境へデプロイ
npm run deploy:dev

# 本番環境へデプロイ
npm run deploy:prod

# または直接
serverless deploy --stage prod
```

#### 6. デプロイ後の確認

```bash
# ログ確認
npm run logs

# または
serverless logs -f api -t --stage prod
```

デプロイが成功すると、API Gateway のエンドポイントURLが表示されます：

```
endpoints:
  ANY - https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod
  ANY - https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/{proxy+}
```

### S3バケットの設定

`serverless.yml` で自動的に作成されますが、手動で作成する場合：

```bash
aws s3 mb s3://dailyreport-uploads-prod --region ap-northeast-1
```

## 🔐 認証方式の変更点

**旧**: Express Session（メモリベース）  
**新**: JWT (JSON Web Token)

### フロントエンドでの対応が必要

- ログイン時にレスポンスの `token` を保存
- API リクエスト時に `Authorization: Bearer <token>` ヘッダーを追加

```javascript
// ログイン例
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userName, password })
});
const { token } = await response.json();
localStorage.setItem('token', token);

// API呼び出し例
const response = await fetch('/api/daily-reports', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

## 📦 ファイルアップロード

**旧**: ローカルファイルシステム  
**新**: AWS S3

- Lambda環境では自動的にS3を使用
- ローカル開発では従来通りローカルストレージ
- 環境変数 `USE_S3=true` で切り替え可能

## 📊 ログ管理

**旧**: ローカルファイル（logs/）  
**新**: CloudWatch Logs

Lambda環境では自動的にCloudWatch Logsに出力されます。

```bash
# ログ確認
serverless logs -f api -t --stage prod
```

## 🔧 Prismaマイグレーション

Lambda環境へデプロイする前にマイグレーションを実行：

```bash
# ローカルまたはCI/CDで実行
DATABASE_URL="postgresql://rds-endpoint/db" npx prisma migrate deploy
```

## 🌐 API エンドポイント

| Method | Endpoint | 説明 |
|--------|----------|------|
| POST | /api/auth/login | ログイン |
| POST | /api/auth/logout | ログアウト |
| GET | /api/auth/check | トークン確認 |
| GET | /api/daily-reports | 日報一覧 |
| POST | /api/daily-reports | 日報作成 |
| GET | /api/daily-reports/:id | 日報詳細 |
| PUT | /api/daily-reports/:id | 日報更新 |
| POST | /api/uploads/image | 画像アップロード（S3） |
| ... | ... | その他多数 |

## 🛠️ ローカルでのLambda環境テスト

Serverless Offlineを使用してローカルでLambda環境をエミュレート：

```bash
serverless offline
```

`http://localhost:3001` でアクセス可能。

## 📝 注意事項

### VPC設定

RDSがVPC内にある場合、`serverless.yml` のVPC設定のコメントを解除して設定：

```yaml
vpc:
  securityGroupIds:
    - sg-xxxxxxxxx
  subnetIds:
    - subnet-xxxxxxxxx
    - subnet-yyyyyyyyy
```

### コールドスタート対策

- Provisioned Concurrency の設定を検討
- メモリサイズを調整（512MB推奨）
- データベース接続プーリング（RDS Proxy推奨）

### タイムアウト

Lambda のタイムアウトは最大15分。長時間処理は別の方法を検討。

## 🐛 トラブルシューティング

### デプロイエラー

```bash
# デプロイ情報を確認
serverless info --stage prod

# スタックを削除して再デプロイ
serverless remove --stage prod
serverless deploy --stage prod
```

### データベース接続エラー

- RDSのセキュリティグループ設定を確認
- DATABASE_URLが正しいか確認
- VPC設定が正しいか確認

### S3アップロードエラー

- IAMロールの権限を確認
- S3バケット名が正しいか確認
- CORS設定を確認

## 📚 関連ドキュメント

- [Serverless Framework](https://www.serverless.com/framework/docs)
- [AWS Lambda](https://docs.aws.amazon.com/lambda/)
- [Prisma](https://www.prisma.io/docs)
- [Express](https://expressjs.com/)

## 📄 ライセンス

MIT
