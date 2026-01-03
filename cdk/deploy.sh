#!/bin/bash

# DailyReport フルスタックデプロイスクリプト
# Usage: ./deploy.sh [dev|prod]

set -e

STAGE=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "DailyReport Full Stack Deployment"
echo "Stage: $STAGE"
echo "=========================================="

# 環境変数のチェック
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "Error: .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# CDKのインストール確認
if ! command -v cdk &> /dev/null; then
    echo "Error: AWS CDK CLI not found. Please install it with: npm install -g aws-cdk"
    exit 1
fi

# Step 1: CDK依存関係のインストール
echo ""
echo "[1/6] Installing CDK dependencies..."
cd "$SCRIPT_DIR"
npm install

# Step 2: CDKスタックのデプロイ
echo ""
echo "[2/6] Deploying CDK stack..."
cdk deploy DailyReportStack-$STAGE --require-approval never

# Step 3: スタック出力の取得
echo ""
echo "[3/6] Getting stack outputs..."
API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name DailyReportStack-$STAGE \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
    --output text)

DB_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name DailyReportStack-$STAGE \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
    --output text)

DB_SECRET_ARN=$(aws cloudformation describe-stacks \
    --stack-name DailyReportStack-$STAGE \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseSecretArn`].OutputValue' \
    --output text)

FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name DailyReportStack-$STAGE \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
    --output text)

FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name DailyReportStack-$STAGE \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' \
    --output text)

echo "API Endpoint: $API_ENDPOINT"
echo "DB Endpoint: $DB_ENDPOINT"
echo "Frontend URL: $FRONTEND_URL"

# Step 4: データベースパスワードの取得とマイグレーション
echo ""
echo "[4/6] Running database migrations..."
DB_PASSWORD=$(aws secretsmanager get-secret-value \
    --secret-id dailyreport-db-password-$STAGE \
    --query SecretString \
    --output text)

cd "$PROJECT_ROOT/backend"
export DATABASE_URL="postgresql://dbadmin:$DB_PASSWORD@$DB_ENDPOINT:5432/dailyreport?schema=public"

# Prismaのインストール（まだの場合）
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# マイグレーション実行
echo "Running Prisma migrations..."
npx prisma migrate deploy
npx prisma generate

echo "Database migrations completed!"

# Step 5: フロントエンドのビルドとデプロイ
echo ""
echo "[5/6] Building and deploying frontend..."
cd "$PROJECT_ROOT/frontend"

# フロントエンドの依存関係インストール
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# 環境変数ファイルの作成
echo "Creating frontend environment file..."
cat > .env.production << EOF
VUE_APP_API_URL=${API_ENDPOINT}api
EOF

# ビルド
echo "Building frontend..."
npm run build

# S3にデプロイ
echo "Deploying to S3..."
aws s3 sync dist/ s3://$FRONTEND_BUCKET/ --delete

# Step 6: CloudFrontキャッシュのクリア
echo ""
echo "[6/6] Clearing CloudFront cache..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Origins.Items[?DomainName=='$FRONTEND_BUCKET.s3.amazonaws.com']].Id" \
    --output text | head -n 1)

if [ -n "$DISTRIBUTION_ID" ]; then
    echo "Creating CloudFront invalidation (Distribution: $DISTRIBUTION_ID)..."
    aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/*" > /dev/null
    echo "Invalidation created!"
else
    echo "Warning: Could not find CloudFront distribution ID"
fi

echo ""
echo "=========================================="
echo "✅ Deployment completed successfully!"
echo "=========================================="
echo ""
echo "📝 Deployment Summary:"
echo "  - Stage: $STAGE"
echo "  - API Endpoint: $API_ENDPOINT"
echo "  - Frontend URL: $FRONTEND_URL"
echo "  - Database: $DB_ENDPOINT"
echo ""
echo "🚀 Next Steps:"
echo "  1. Access the application at: $FRONTEND_URL"
echo "  2. Login with your credentials"
echo "  3. Check CloudWatch Logs for any issues"
echo ""
echo "📊 Monitoring:"
echo "  - CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1#logsV2:log-groups"
echo "  - Lambda Metrics: https://console.aws.amazon.com/lambda/home?region=ap-northeast-1"
echo "  - RDS Dashboard: https://console.aws.amazon.com/rds/home?region=ap-northeast-1"
echo ""
