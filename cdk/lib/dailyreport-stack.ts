import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import * as path from 'path';

export interface DailyReportStackProps extends cdk.StackProps {
  stage: string;
  dbInstanceClass?: string;
  dbAllocatedStorage?: number;
  frontendDomainName?: string;
  certificateArn?: string;
  jwtSecret: string;
}

export class DailyReportStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DailyReportStackProps) {
    super(scope, id, props);

    const { stage, jwtSecret } = props;

    // ===========================================
    // VPC
    // ===========================================
    const vpc = new ec2.Vpc(this, 'DailyReportVpc', {
      maxAzs: 2,
      natGateways: 1, // コスト削減のため1つ（本番環境では2以上推奨）
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // ===========================================
    // セキュリティグループ
    // ===========================================
    
    // Lambda用セキュリティグループ
    const lambdaSg = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: true,
    });

    // RDS用セキュリティグループ
    const dbSg = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    // LambdaからRDSへのアクセスを許可
    dbSg.addIngressRule(
      lambdaSg,
      ec2.Port.tcp(5432),
      'Allow Lambda to access RDS'
    );

    // ===========================================
    // Secrets Manager（DBパスワード）
    // ===========================================
    const dbPasswordSecret = new secretsmanager.Secret(this, 'DBPasswordSecret', {
      secretName: `dailyreport-db-password-${stage}`,
      generateSecretString: {
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
    });

    // ===========================================
    // RDS PostgreSQL
    // ===========================================
    const dbInstance = new rds.DatabaseInstance(this, 'DailyReportDB', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        props.dbInstanceClass === 't3.small' 
          ? ec2.InstanceSize.SMALL 
          : ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSg],
      databaseName: 'dailyreport',
      credentials: rds.Credentials.fromPassword(
        'dbadmin',
        dbPasswordSecret.secretValue
      ),
      allocatedStorage: props.dbAllocatedStorage || 20,
      maxAllocatedStorage: 100,
      storageEncrypted: true,
      deletionProtection: stage === 'prod',
      removalPolicy: stage === 'prod' 
        ? cdk.RemovalPolicy.SNAPSHOT 
        : cdk.RemovalPolicy.DESTROY,
      backupRetention: stage === 'prod' 
        ? cdk.Duration.days(7) 
        : cdk.Duration.days(1),
    });

    // DATABASE_URLの構築
    const databaseUrl = `postgresql://dbadmin:${dbPasswordSecret.secretValue.unsafeUnwrap()}@${dbInstance.dbInstanceEndpointAddress}:${dbInstance.dbInstanceEndpointPort}/dailyreport?schema=public`;

    // ===========================================
    // S3バケット（画像アップロード用）
    // ===========================================
    const uploadBucket = new s3.Bucket(this, 'UploadBucket', {
      bucketName: `dailyreport-uploads-${stage}-${this.account}`,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ['*'], // 本番環境では特定のドメインに制限
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: stage === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: stage !== 'prod',
    });

    // ===========================================
    // Lambda関数（バックエンドAPI）
    // ===========================================
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend'), {
        exclude: [
          'node_modules',
          '.env*',
          'logs',
          'uploads',
          'README*.md',
          '.git*',
        ],
      }),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSg],
      environment: {
        NODE_ENV: 'production',
        DATABASE_URL: databaseUrl,
        JWT_SECRET: jwtSecret,
        JWT_EXPIRES_IN: '7d',
        FRONTEND_URL: props.frontendDomainName || '*',
        S3_BUCKET_NAME: uploadBucket.bucketName,
        AWS_REGION: this.region,
        USE_S3: 'true',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // LambdaにS3アクセス権限を付与
    uploadBucket.grantReadWrite(apiFunction);

    // LambdaにSecrets Managerアクセス権限を付与
    dbPasswordSecret.grantRead(apiFunction);

    // ===========================================
    // API Gateway
    // ===========================================
    const api = new apigateway.LambdaRestApi(this, 'DailyReportApi', {
      handler: apiFunction,
      proxy: true,
      deployOptions: {
        stageName: stage,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: props.frontendDomainName 
          ? [`https://${props.frontendDomainName}`]
          : apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: true,
      },
    });

    // ===========================================
    // S3バケット（フロントエンド静的ホスティング）
    // ===========================================
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `dailyreport-frontend-${stage}-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // SPAの場合
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: stage === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: stage !== 'prod',
    });

    // ===========================================
    // CloudFront Distribution（フロントエンド配信）
    // ===========================================
    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200, // アジア・北米・欧州
    });

    // ===========================================
    // Outputs
    // ===========================================
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `DailyReportApiEndpoint-${stage}`,
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL for frontend',
      exportName: `DailyReportFrontendUrl-${stage}`,
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'S3 bucket name for frontend',
      exportName: `DailyReportFrontendBucket-${stage}`,
    });

    new cdk.CfnOutput(this, 'UploadBucketName', {
      value: uploadBucket.bucketName,
      description: 'S3 bucket name for uploads',
      exportName: `DailyReportUploadBucket-${stage}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbInstance.dbInstanceEndpointAddress,
      description: 'RDS database endpoint',
      exportName: `DailyReportDbEndpoint-${stage}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: dbPasswordSecret.secretArn,
      description: 'Secret ARN for database password',
      exportName: `DailyReportDbSecretArn-${stage}`,
    });
  }
}
