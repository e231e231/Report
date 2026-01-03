#!/bin/bash
# 日報管理システム - 環境セットアップスクリプト
# Ubuntu/Debian系ディストリビューション用

set -e  # エラーが発生したら終了

# カレントディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "日報管理システム 環境セットアップ"
echo "=========================================="
echo ""

# パッケージリストを更新
echo "[1/10] パッケージリストを更新中..."
sudo apt update

# Node.jsとnpmをインストール
echo ""
echo "[2/10] Node.jsとnpmをインストール中..."
sudo apt install -y nodejs npm

# PostgreSQLをインストール
echo ""
echo "[3/10] PostgreSQLをインストール中..."
sudo apt install -y postgresql postgresql-contrib

# PostgreSQLサービスを起動
echo ""
echo "[4/10] PostgreSQLサービスを起動中..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# データベースを作成
echo ""
echo "[5/10] データベース 'dailyreport_db' を作成中..."
sudo -u postgres psql -c "CREATE DATABASE dailyreport_db;" 2>/dev/null || echo "データベースは既に存在します"

# Vue CLIをグローバルにインストール
echo ""
echo "[6/10] Vue CLIをグローバルにインストール中..."
sudo npm install -g @vue/cli @vue/cli-service

# バックエンドの依存パッケージをインストール
echo ""
echo "[7/10] バックエンドの依存パッケージをインストール中..."
cd "$SCRIPT_DIR/backend"
npm install

# .envファイルを作成（存在しない場合）
echo ""
echo "[8/10] バックエンドの.envファイルを作成中..."
if [ ! -f .env ]; then
  cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dailyreport_db?schema=public"

# Server
PORT=3000
NODE_ENV=development

# Session
SESSION_SECRET=dailyreport-secret-key-dev-2025

# JWT (optional - if using JWT instead of sessions)
JWT_SECRET=dailyreport-jwt-secret-dev-2025
JWT_EXPIRE=2h

# CORS
FRONTEND_URL=http://localhost:8080
EOF
  echo ".envファイルを作成しました"
else
  echo ".envファイルは既に存在します"
fi

# Prismaのセットアップ
echo ""
echo "[9/10] Prismaのセットアップ中..."
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# フロントエンドの依存パッケージをインストール
echo ""
echo "[10/10] フロントエンドの依存パッケージをインストール中..."
cd "$SCRIPT_DIR/frontend"
npm install
npm install --save-dev vue-template-compiler

# バージョン確認
echo ""
echo "=========================================="
echo "セットアップ完了！"
echo "=========================================="
echo ""
echo "インストールされたバージョン:"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  PostgreSQL: $(psql --version | cut -d' ' -f3)"
echo "  Vue CLI: $(vue --version 2>/dev/null || echo 'インストール済み')"
echo ""
echo "デフォルトアカウント:"
echo "  管理者: username=admin, password=admin123"
echo "  テストユーザー: username=testuser, password=test123"
echo ""
echo "サーバーの起動方法:"
echo "  1. バックエンド: cd backend && npm start"
echo "  2. フロントエンド: cd frontend && npm run serve"
echo ""
echo "アクセスURL:"
echo "  フロントエンド: http://localhost:8080/"
echo "  バックエンドAPI: http://localhost:3000/"
echo ""
