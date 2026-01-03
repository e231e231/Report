// AWS Lambda Handler
// Serverless Express を使用してExpressアプリをLambdaで動作させます

const serverlessExpress = require('@vendia/serverless-express');
const app = require('./app');

let serverlessExpressInstance;

// Lambda関数がコンテナで再利用される場合のためにインスタンスをキャッシュ
function setupServerlessExpress(event, context) {
  serverlessExpressInstance = serverlessExpress({ app });
  return serverlessExpressInstance(event, context);
}

// Lambda Handler
exports.handler = async (event, context) => {
  // コールドスタート対策: インスタンスを再利用
  if (serverlessExpressInstance) {
    return serverlessExpressInstance(event, context);
  }
  
  return setupServerlessExpress(event, context);
};
