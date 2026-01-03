# AWS Lambda 移行クイックスタートガイド

バックエンドをAWS Lambdaにデプロイするための手順書

## 📋 前提条件

- [x] Node.js 18.x 以上
- [x] AWS アカウント
- [x] AWS CLI インストール済み
- [x] PostgreSQL データベース（RDS推奨）

## 🚀 デプロイ手順

### ステップ 1: 依存パッケージのインストール

```bash
cd backend
npm install
```

### ステップ 2: Serverless Framework のインストール

```bash
npm install -g serverless
```

### ステップ 3: AWS認証情報の設定

```bash
aws configure
```

入力項目：
- AWS Access Key ID
- AWS Secret Access Key
- Default region name: `ap-northeast-1`
- Default output format: `json`

### ステップ 4: RDSデータベースの準備

#### 4-1. RDS PostgreSQLインスタンスを作成

AWS コンソールまたはCLIで作成：

```bash
aws rds create-db-instance \
  --db-instance-identifier dailyreport-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourSecurePassword123 \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxx \
  --publicly-accessible
```

#### 4-2. エンドポイントを取得

```bash
aws rds describe-db-instances --db-instance-identifier dailyreport-db \
  --query 'DBInstances[0].Endpoint.Address' --output text
```

出力例: `dailyreport-db.xxxxx.ap-northeast-1.rds.amazonaws.com`

### ステップ 5: Prismaマイグレーション実行

```bash
# DATABASE_URLを設定
export DATABASE_URL="postgresql://admin:YourSecurePassword123@dailyreport-db.xxxxx.ap-northeast-1.rds.amazonaws.com:5432/postgres?schema=public"

# マイグレーション実行
npx prisma migrate deploy

# Prismaクライアント生成
npx prisma generate
```

### ステップ 6: 環境変数の設定

#### 方法A: `.env` ファイルを使用（開発環境向け）

```bash
cp .env.example .env
```

`.env` を編集：

```env
NODE_ENV=production
DATABASE_URL="postgresql://admin:password@rds-endpoint:5432/postgres?schema=public"
JWT_SECRET="your-super-secret-jwt-key-CHANGE-THIS"
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend-domain.com
AWS_REGION=ap-northeast-1
S3_BUCKET_NAME=dailyreport-uploads-prod
USE_S3=true
```

#### 方法B: AWS Systems Manager Parameter Store（本番環境推奨）

```bash
# JWT Secret
aws ssm put-parameter \
  --name /dailyreport/prod/JWT_SECRET \
  --value "your-super-secret-jwt-key" \
  --type SecureString

# Database URL
aws ssm put-parameter \
  --name /dailyreport/prod/DATABASE_URL \
  --value "postgresql://admin:password@rds-endpoint:5432/postgres" \
  --type SecureString
```

そして `serverless.yml` で参照：

```yaml
environment:
  JWT_SECRET: ${ssm:/dailyreport/prod/JWT_SECRET~true}
  DATABASE_URL: ${ssm:/dailyreport/prod/DATABASE_URL~true}
```

### ステップ 7: serverless.yml の設定確認

`backend/serverless.yml` を開き、以下を確認：

```yaml
provider:
  region: ap-northeast-1  # 必要に応じて変更
  stage: prod             # または dev

custom:
  s3BucketName: dailyreport-uploads-prod  # バケット名をユニークに
  
  environment:
    prod:
      FRONTEND_URL: https://your-frontend-domain.com  # 変更必須
```

### ステップ 8: VPC設定（RDSがVPC内にある場合）

`serverless.yml` の該当箇所のコメントを解除：

```yaml
provider:
  vpc:
    securityGroupIds:
      - sg-xxxxxxxxx  # Lambda用のセキュリティグループ
    subnetIds:
      - subnet-xxxxxxxxx  # プライベートサブネット
      - subnet-yyyyyyyyy  # プライベートサブネット
```

### ステップ 9: デプロイ実行

```bash
# 本番環境へデプロイ
npm run deploy:prod

# または
serverless deploy --stage prod
```

デプロイには数分かかります。

### ステップ 10: デプロイ結果の確認

デプロイが成功すると、以下のような出力が表示されます：

```
Service Information
service: dailyreport-api
stage: prod
region: ap-northeast-1
stack: dailyreport-api-prod
endpoints:
  ANY - https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod
  ANY - https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/{proxy+}
functions:
  api: dailyreport-api-prod-api
```

**このエンドポイントURLをメモしてください！**

### ステップ 11: 動作確認

```bash
# ヘルスチェック
curl https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/api/health

# 期待される結果
{
  "status": "OK",
  "timestamp": "2026-01-03T...",
  "environment": "production",
  "isLambda": true
}
```

### ステップ 12: ログ確認

```bash
# リアルタイムログ表示
npm run logs

# または
serverless logs -f api -t --stage prod
```

## 🌐 フロントエンドの設定

1. フロントエンドの環境変数を更新：

```env
# frontend/.env.production
VUE_APP_API_URL=https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/api
```

2. [FRONTEND_MIGRATION_GUIDE.md](./FRONTEND_MIGRATION_GUIDE.md) の手順に従ってコードを変更

3. フロントエンドをビルド＆デプロイ

## 🔧 トラブルシューティング

### デプロイエラー: "Stack creation failed"

```bash
# スタック情報を確認
serverless info --stage prod

# スタックを削除して再デプロイ
serverless remove --stage prod
serverless deploy --stage prod
```

### データベース接続エラー

1. RDSのセキュリティグループを確認
   - Lambda実行ロールからの接続を許可
   - ポート5432を開放

2. DATABASE_URLが正しいか確認
   ```bash
   echo $DATABASE_URL
   ```

3. VPC設定を確認
   - LambdaとRDSが同じVPC内にあるか
   - サブネットが正しいか

### S3アップロードエラー

1. IAM権限を確認
   ```bash
   # Lambda実行ロールにS3権限が付与されているか確認
   aws iam get-role-policy \
     --role-name dailyreport-api-prod-ap-northeast-1-lambdaRole \
     --policy-name dailyreport-api-prod-lambda
   ```

2. S3バケットを手動で確認
   ```bash
   aws s3 ls s3://dailyreport-uploads-prod/
   ```

### CORS エラー

`serverless.yml` のCORS設定を確認：

```yaml
functions:
  api:
    events:
      - http:
          cors:
            origin: 'https://your-frontend-domain.com'  # 正しいか確認
```

## 📊 モニタリング

### CloudWatch メトリクス

AWS コンソール > CloudWatch > Metrics で以下を確認：

- Lambda Invocations（実行回数）
- Duration（実行時間）
- Errors（エラー数）
- Throttles（スロットル数）

### CloudWatch Logs

```bash
# ログストリームを確認
aws logs describe-log-streams \
  --log-group-name /aws/lambda/dailyreport-api-prod-api

# 最新のログを表示
serverless logs -f api --stage prod --startTime 1h
```

## 💰 コスト最適化

- **Lambda無料枠**: 月100万リクエスト、40万GB-秒
- **RDS**: `db.t3.micro` または `db.t4g.micro` を使用
- **S3**: 標準ストレージクラスを使用
- 不要なリソースは削除：`serverless remove --stage prod`

## 🔄 更新手順

コードを変更した後：

```bash
# 再デプロイ
npm run deploy:prod

# 特定の関数のみ更新（高速）
serverless deploy function -f api --stage prod
```

## 📚 次のステップ

- [ ] CloudFront でS3画像配信を高速化
- [ ] RDS Proxy でデータベース接続を最適化
- [ ] Lambda Provisioned Concurrency でコールドスタート対策
- [ ] AWS WAF でセキュリティ強化
- [ ] CI/CD パイプラインの構築（GitHub Actions等）

## 🆘 サポート

問題が発生した場合：

1. ログを確認：`npm run logs`
2. エラーメッセージをググる
3. [Serverless Framework ドキュメント](https://www.serverless.com/framework/docs)
4. [AWS Lambda ドキュメント](https://docs.aws.amazon.com/lambda/)

---

デプロイが完了しました！🎉
