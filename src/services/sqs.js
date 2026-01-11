const { SQSClient, ListQueuesCommand } = require('@aws-sdk/client-sqs');

const sqsClient = new SQSClient({
  endpoint: process.env.SQS_ENDPOINT || 'http://localhost:9324',
  region: process.env.SQS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
  },
});

module.exports = { sqsClient };