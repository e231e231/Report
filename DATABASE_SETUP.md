# データベースセットアップガイド

PostgreSQLを使用したデータベースのセットアップ手順

## PostgreSQLのインストール

### Windows

1. [PostgreSQL公式サイト](https://www.postgresql.org/download/windows/)からインストーラーをダウンロード
2. インストーラーを実行し、指示に従ってインストール
3. インストール時にパスワードを設定（忘れないこと）
4. ポートはデフォルトの5432を使用

### macOS

```bash
# Homebrewを使用
brew install postgresql@14
brew services start postgresql@14
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## データベースの作成

### 方法1: コマンドライン

```bash
# PostgreSQLユーザーに切り替え（Linux）
sudo -u postgres psql

# または直接作成（Windows/macOS）
psql -U postgres

# データベースを作成
CREATE DATABASE dailyreport_db;

# ユーザーの作成（オプション）
CREATE USER dailyreport_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE dailyreport_db TO dailyreport_user;

# 終了
\q
```

### 方法2: pgAdmin

1. pgAdmin（PostgreSQLのGUIツール）を開く
2. 左側のサーバーツリーでサーバーを展開
3. Databases を右クリック → Create → Database
4. Database name: `dailyreport_db`
5. Save

## 接続文字列の設定

`backend/.env`ファイルを作成：

```env
# PostgreSQLローカル接続
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/dailyreport_db?schema=public"

# 別ユーザーを作成した場合
# DATABASE_URL="postgresql://dailyreport_user:your_password@localhost:5432/dailyreport_db?schema=public"
```

### 接続文字列の形式

```
postgresql://[ユーザー名]:[パスワード]@[ホスト]:[ポート]/[データベース名]?schema=public
```

## Prismaマイグレーション

```bash
cd new/backend

# Prismaクライアントの生成
npm run prisma:generate

# マイグレーションの実行（テーブル作成）
npm run prisma:migrate

# 初期データの投入
npm run prisma:seed
```

## データベーススキーマの確認

### Prisma Studio（推奨）

```bash
npm run prisma:studio
```

ブラウザで `http://localhost:5555` を開くとGUIでデータベースを確認・編集できます。

### psqlコマンド

```bash
psql -U postgres -d dailyreport_db

# テーブル一覧
\dt

# テーブル構造の確認
\d employee

# データの確認
SELECT * FROM employee;
```

## 作成されるテーブル

以下のテーブルが自動的に作成されます：

1. `employee` - 従業員
2. `employee_role` - 従業員ロール
3. `daily_report` - 日報
4. `feedback` - フィードバック
5. `reaction` - リアクション
6. `emoji` - 絵文字
7. `information` - お知らせ
8. `mail` - 管理者連絡

## 初期データ

`npm run prisma:seed`で以下のデータが投入されます：

### 従業員ロール
- 0: 管理者
- 1: 新入社員
- 2: OJT推進者
- 3: OJT責任者
- 4: OJT支援者

### 絵文字
- EMJ00001 ~ EMJ00006（6種類）

### デフォルトユーザー
- **管理者**: username=admin, password=admin123
- **テストユーザー**: username=testuser, password=test123

## トラブルシューティング

### 接続エラー: "password authentication failed"

1. パスワードが正しいか確認
2. `pg_hba.conf`の設定を確認（認証方式）
3. PostgreSQLサービスが起動しているか確認

```bash
# Windowsの場合
services.msc から PostgreSQL サービスを確認

# Linux/macOSの場合
sudo systemctl status postgresql
```

### 接続エラー: "database does not exist"

データベースが作成されているか確認：

```bash
psql -U postgres -l
```

### ポート競合

PostgreSQLのポートを変更した場合、`.env`の接続文字列も変更してください。

### マイグレーションエラー

```bash
# マイグレーションをリセット（開発環境のみ）
npx prisma migrate reset
npm run prisma:seed
```

## バックアップとリストア

### バックアップ

```bash
pg_dump -U postgres -d dailyreport_db -F c -f dailyreport_backup.dump
```

### リストア

```bash
pg_restore -U postgres -d dailyreport_db dailyreport_backup.dump
```

## 本番環境での推奨設定

### 1. 専用ユーザーの作成

```sql
CREATE USER dailyreport_prod WITH PASSWORD 'strong_random_password';
GRANT ALL PRIVILEGES ON DATABASE dailyreport_db TO dailyreport_prod;
```

### 2. 接続数の制限

```sql
ALTER USER dailyreport_prod CONNECTION LIMIT 20;
```

### 3. SSL接続の有効化

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&sslmode=require"
```

### 4. 定期バックアップ

cronでバックアップスクリプトを実行：

```bash
# 毎日午前3時にバックアップ
0 3 * * * pg_dump -U dailyreport_prod dailyreport_db > /backup/daily_$(date +\%Y\%m\%d).sql
```

## クラウドデータベースの使用

### Amazon RDS (PostgreSQL)

1. RDSインスタンスを作成
2. セキュリティグループでポート5432を開放
3. エンドポイントとパスワードを取得
4. `.env`に接続文字列を設定

```env
DATABASE_URL="postgresql://username:password@your-instance.region.rds.amazonaws.com:5432/dailyreport_db"
```

### Heroku Postgres

```bash
heroku addons:create heroku-postgresql:hobby-dev
heroku config:get DATABASE_URL
```

### Azure Database for PostgreSQL

1. Azureポータルでデータベースを作成
2. ファイアウォール設定でIPアドレスを許可
3. 接続文字列を取得

## パフォーマンスチューニング

### インデックスの確認

```sql
-- インデックス一覧
SELECT * FROM pg_indexes WHERE schemaname = 'public';

-- インデックスの使用状況
SELECT * FROM pg_stat_user_indexes;
```

### スロークエリの確認

```sql
-- 実行時間が長いクエリ
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### バキューム（メンテナンス）

```sql
-- 定期的に実行
VACUUM ANALYZE;
```

## セキュリティ

### パスワードポリシー

強力なパスワードを使用してください：
- 最低12文字以上
- 大文字、小文字、数字、記号を含む
- 辞書にある単語を避ける

### 接続制限

`postgresql.conf`で接続元IPを制限：

```
listen_addresses = 'localhost'  # ローカルのみ
# または
listen_addresses = '127.0.0.1,192.168.1.100'  # 特定のIPのみ
```

### ログの有効化

```
log_statement = 'all'
log_connections = on
log_disconnections = on
```
