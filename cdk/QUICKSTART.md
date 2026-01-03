# AWS CDK フルスタックデプロイ クイックスタート

## 🚀 最速デプロイ手順

### 1. 前提条件の確認

```bash
# Node.js バージョン確認
node --version  # v18.x 以上

# AWS CLI 確認
aws --version

# AWS認証情報確認
aws sts get-caller-identity
```

### 2. CDK CLIのインストール

```bash
npm install -g aws-cdk
cdk --version
```

### 3. プロジェクトのセットアップ

```bash
cd cdk

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env
nano .env  # または vim .env
```

`.env` の最低限の設定：

```env
AWS_ACCOUNT_ID=your-account-id
AWS_REGION=ap-northeast-1
DEV_JWT_SECRET=your-strong-random-secret-key-here
```

### 4. CDKのブートストラップ（初回のみ）

```bash
cdk bootstrap
```

### 5. デプロイ実行

#### オプション A: 自動デプロイスクリプト（推奨）

```bash
./deploy.sh dev
```

このスクリプトは以下を自動実行：
- CDKスタックのデプロイ
- データベースマイグレーション
- フロントエンドのビルド
- S3へのアップロード
- CloudFrontキャッシュクリア

#### オプション B: 手動デプロイ

```bash
# 1. インフラのデプロイ
cdk deploy DailyReportStack-dev

# 2. 出力値の確認
cdk deploy DailyReportStack-dev --outputs-file outputs.json
cat outputs.json

# 3. DBマイグレーション
cd ../backend
export DATABASE_URL="postgresql://dbadmin:PASSWORD@ENDPOINT:5432/dailyreport"
npx prisma migrate deploy

# 4. フロントエンドデプロイ
cd ../frontend
echo "VUE_APP_API_URL=https://YOUR_API/api" > .env.production
npm run build
aws s3 sync dist/ s3://BUCKET_NAME/ --delete
```

### 6. アクセス確認

デプロイ完了後、出力されたURLにアクセス：

```
Frontend URL: https://xxxxx.cloudfront.net
```

## 📋 デプロイ後のチェックリスト

- [ ] フロントエンドにアクセスできる
- [ ] ログイン画面が表示される
- [ ] ログインできる
- [ ] 日報の作成・表示ができる
- [ ] 画像アップロードができる

## 🔧 トラブルシューティング

### エラー: "User is not authorized to perform: cloudformation:CreateStack"

IAMユーザーに必要な権限を付与：

```bash
# 管理者権限が必要
aws iam attach-user-policy \
  --user-name your-user \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

### エラー: "Stack is in ROLLBACK_COMPLETE state"

```bash
# スタックを削除して再デプロイ
cdk destroy DailyReportStack-dev
cdk deploy DailyReportStack-dev
```

### Lambdaがタイムアウトする

Lambda関数のタイムアウトを延長（`lib/dailyreport-stack.ts`）：

```typescript
timeout: cdk.Duration.seconds(60),
```

### フロントエンドが表示されない

CloudFrontの伝播を待つ（10-15分）または強制的にキャッシュクリア：

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

## 💰 コスト削減のヒント

### 開発環境の停止

```bash
# RDSを停止（最大7日間）
aws rds stop-db-instance --db-instance-identifier dailyreport-db-dev

# Lambda、S3、CloudFrontは使用量課金のため停止不要
```

### 不要時の完全削除

```bash
cdk destroy DailyReportStack-dev
```

## 🔐 セキュリティ推奨事項

1. **JWT_SECRET**: 必ず強力なランダム文字列を使用
   ```bash
   # 生成例
   openssl rand -base64 32
   ```

2. **データベースパスワード**: Secrets Managerで自動管理

3. **CORS設定**: 本番環境では特定のドメインに制限
   ```typescript
   allowOrigins: ['https://yourdomain.com']
   ```

4. **S3バケット**: 本番環境ではバージョニング有効化

## 📊 モニタリング

### CloudWatch Logs

```bash
# Lambda関数のログ確認
aws logs tail /aws/lambda/DailyReportStack-dev-ApiFunction --follow
```

### RDSメトリクス

AWSコンソール → RDS → Monitoring で確認

### コスト確認

```bash
# 当月のコスト確認
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

## 🔄 更新デプロイ

### コード変更後の再デプロイ

```bash
# バックエンドのみ
cdk deploy DailyReportStack-dev

# フロントエンドのみ
cd frontend
npm run build
aws s3 sync dist/ s3://BUCKET_NAME/ --delete
```

### データベーススキーマ変更

```bash
cd backend
npx prisma migrate dev --name your_migration_name
npx prisma migrate deploy  # 本番環境へ適用
```

## 🌐 カスタムドメインの設定

### 1. Route 53でドメインを取得/インポート

### 2. ACM証明書の作成（us-east-1リージョン）

```bash
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS \
  --region us-east-1
```

### 3. `.env`に設定追加

```env
DEV_DOMAIN_NAME=dev.yourdomain.com
DEV_CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/xxxxx
```

### 4. 再デプロイ

```bash
cdk deploy DailyReportStack-dev
```

### 5. Route 53でエイリアスレコード作成

CloudFrontディストリビューションをポイント

## 📚 次のステップ

- [ ] カスタムドメイン設定
- [ ] CI/CDパイプライン構築（GitHub Actions）
- [ ] バックアップ戦略の実装
- [ ] アラート設定（CloudWatch Alarms）
- [ ] WAFの設定（DDoS対策）

---

完了です！アプリケーションが稼働しています 🎉
