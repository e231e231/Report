#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DailyReportStack } from '../lib/dailyreport-stack';
import * as dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

const app = new cdk.App();

// 環境設定
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'ap-northeast-1',
};

// 開発環境スタック
new DailyReportStack(app, 'DailyReportStack-dev', {
  env,
  stage: 'dev',
  dbInstanceClass: 't3.micro',
  dbAllocatedStorage: 20,
  frontendDomainName: process.env.DEV_DOMAIN_NAME,
  certificateArn: process.env.DEV_CERTIFICATE_ARN,
  jwtSecret: process.env.DEV_JWT_SECRET || 'dev-secret-change-me',
});

// 本番環境スタック（必要に応じてコメント解除）
/*
new DailyReportStack(app, 'DailyReportStack-prod', {
  env,
  stage: 'prod',
  dbInstanceClass: 't3.small',
  dbAllocatedStorage: 50,
  frontendDomainName: process.env.PROD_DOMAIN_NAME,
  certificateArn: process.env.PROD_CERTIFICATE_ARN,
  jwtSecret: process.env.PROD_JWT_SECRET || 'CHANGE-THIS-IN-PRODUCTION',
});
*/

app.synth();
