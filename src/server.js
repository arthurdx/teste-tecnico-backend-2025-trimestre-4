const express = require('express');
const mongoose = require('mongoose');
const { SQSClient, ListQueuesCommand } = require('@aws-sdk/client-sqs');

const app = express();
const PORT = process.env.PORT || 3000;

const sqsClient = new SQSClient({
  endpoint: process.env.SQS_ENDPOINT || 'http://localhost:9324',
  region: process.env.SQS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
  },
});

async function checkConnections() {
  console.log('--- Checking Connections ---');
  
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cep-crawler');
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }

  try {
    const command = new ListQueuesCommand({});
    const response = await sqsClient.send(command);
    console.log('✅ SQS Connection OK. Queues:', response.QueueUrls || 'None');
  } catch (err) {
    console.error('SQS Connection Error:', err.message);
    process.exit(1);
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

async function start() {
  await checkConnections();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
