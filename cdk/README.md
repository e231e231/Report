# DailyReport CDK Infrastructure

AWS CDKを使用したDailyReportシステムのフルスタックインフラストラクチャ

## 📦 構成

このCDKスタックは以下のAWSリソースをデプロイします：

### ネットワーク
- **VPC**: パブリック/プライベート/アイソレートサブネット
- **NAT Gateway**: プライベートサブネットからのインターネットアクセス
- **Security Groups**: Lambda、RDS用

### データベース
- **RDS PostgreSQL 15**: 本番環境ではマルチAZ対応可能
- **Secrets Manager**: データベースパスワード管理
- **自動バックアップ**: 本番7日、開発1日

### バックエンド
- **Lambda関数**: Express.js API（Node.js 18.x）
- **API Gateway**: REST API エンドポイント
- **VPC統合**: RDSへのプライベート接続
- **CloudWatch Logs**: ログ保存（7日間）

### ストレージ
- **S3 (アップロード用)**: 画像ファイル保存
- **S3 (フロントエンド用)**: 静的ウェブサイトホスティング

### CDN
- **CloudFront**: フロントエンド配信（グローバル）
- **HTTPS対応**: 自動リダイレクト
- **SPA対応**: 404→index.htmlリダイレクト

## 🚀 セットアップ

### 1. 前提条件

- Node.js 18.x 以上
- AWS CLI 設定済み
- AWS CDK CLI インストール

```bash
npm install -g aws-cdk
```

### 2. 依存関係のインストール

```bash
cd cdk
npm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集：

```env
AWS_ACCOUNT_ID=your-account-id
AWS_REGION=ap-northeast-1
DEV_JWT_SECRET=your-strong-secret-key
```

### 4. AWS認証情報の設定

```bash
aws configure
```

または環境変数で：

```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=ap-northeast-1
```

### 5. CDKのブートストラップ（初回のみ）

```bash
cdk bootstrap
```

## 📋 デプロイ手順

### 開発環境へのデプロイ

```bash
npm run deploy:dev
```

または

```bash
cdk deploy DailyReportStack-dev
```

### 本番環境へのデプロイ

```bash
npm run deploy:prod
```

### 全スタックのデプロイ

```bash
npm run deploy
```

## 🗑️ スタックの削除

```bash
# 開発環境
cdk destroy DailyReportStack-dev

# 本番環境
cdk destroy DailyReportStack-prod

# 全スタック
npm run destroy
```

## 📊 デプロイ後の設定

### 1. データベースのマイグレーション

デプロイ後、RDSエンドポイントを取得：

```bash
aws cloudformation describe-stacks \
  --stack-name DailyReportStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text
```

データベースパスワードを取得：

```bash
aws secretsmanager get-secret-value \
  --secret-id dailyreport-db-password-dev \
  --query SecretString \
  --output text
```

Prismaマイグレーションを実行：

```bash
cd ../backend
export DATABASE_URL="postgresql://dbadmin:PASSWORD@ENDPOINT:5432/dailyreport?schema=public"
npx prisma migrate deploy
npx prisma generate
```

### 2. フロントエンドのビルドとデプロイ

API Gateway URLを取得：

```bash
aws cloudformation describe-stacks \
  --stack-name DailyReportStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text
```

フロントエンドの環境変数を設定：

```bash
cd ../frontend
echo "VUE_APP_API_URL=https://YOUR_API_GATEWAY_URL/api" > .env.production
```

ビルド：

```bash
npm run build
```

S3にデプロイ：

```bash
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name DailyReportStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text)

aws s3 sync dist/ s3://$BUCKET_NAME/ --delete
```

CloudFrontキャッシュをクリア：

```bash
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[?DomainName=='$BUCKET_NAME.s3.amazonaws.com']].Id" \
  --output text)

aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### 3. フロントエンドURLを確認

```bash
aws cloudformation describe-stacks \
  --stack-name DailyReportStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' \
  --output text
```

ブラウザでアクセスしてテスト。

## 🔧 カスタマイズ

### データベースのスペック変更

`bin/dailyreport-cdk.ts` で設定：

```typescript
new DailyReportStack(app, 'DailyReportStack-prod', {
  dbInstanceClass: 't3.medium',  // 変更
  dbAllocatedStorage: 100,       // 変更
  // ...
});
```

### Lambda関数のメモリサイズ変更

`lib/dailyreport-stack.ts` で設定：

```typescript
const apiFunction = new lambda.Function(this, 'ApiFunction', {
  memorySize: 1024, // 変更
  timeout: cdk.Duration.seconds(60), // 変更
  // ...
});
```

### NAT Gatewayの数変更（高可用性）

```typescript
const vpc = new ec2.Vpc(this, 'DailyReportVpc', {
  natGateways: 2, // 2つのAZに配置
  // ...
});
```

## 💰 コスト見積もり

### 開発環境（月額概算）

- **RDS t3.micro**: $15
- **NAT Gateway**: $32
- **Lambda**: $0-5（無料枠内）
- **API Gateway**: $0-5
- **S3**: $1-3
- **CloudFront**: $1-5
- **合計**: 約 $50-60/月

### 本番環境（月額概算）

- **RDS t3.small**: $30
- **NAT Gateway x2**: $64
- **Lambda**: $10-50（トラフィック次第）
- **その他**: $10-20
- **合計**: 約 $100-150/月

## 📝 よくある問題

### Q: Lambda関数がRDSに接続できない

**A**: セキュリティグループとサブネット設定を確認してください。Lambdaは`PRIVATE_WITH_EGRESS`サブネット、RDSは`PRIVATE_ISOLATED`サブネットに配置されている必要があります。

### Q: フロントエンドのAPIリクエストがCORSエラー

**A**: API Gatewayの CORS 設定とフロントエンドのドメインが一致しているか確認してください。

### Q: デプロイが遅い

**A**: VPCとNAT Gatewayの作成に10-15分かかります。Lambda関数のデプロイにも5-10分かかることがあります。

## 🔐 セキュリティのベストプラクティス

1. **JWT_SECRET**: 本番環境では必ず強力なキーを使用
2. **データベースパスワード**: Secrets Managerで自動生成
3. **HTTPS**: CloudFrontで強制リダイレクト
4. **VPC**: RDSは完全にプライベートサブネットに配置
5. **IAM**: 最小権限の原則に従う

## 📚 参考リンク

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda](https://docs.aws.amazon.com/lambda/)
- [Amazon RDS](https://docs.aws.amazon.com/rds/)
- [CloudFront](https://docs.aws.amazon.com/cloudfront/)

## 🆘 トラブルシューティング

スタックが失敗した場合：

```bash
# スタックイベントを確認
cdk diff DailyReportStack-dev

# CloudFormationコンソールでエラー詳細を確認
# またはCLIで
aws cloudformation describe-stack-events \
  --stack-name DailyReportStack-dev \
  --max-items 10
```

---

デプロイが完了したら、[FRONTEND_CHANGES_SUMMARY.md](../FRONTEND_CHANGES_SUMMARY.md) の手順でアプリケーションをテストしてください。
