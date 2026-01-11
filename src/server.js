const express = require('express');
const mongoose = require('mongoose');
const cepRoutes = require('./routes/cepRoutes');
const { sqsClient } = require('./services/sqs');
const { ListQueuesCommand } = require('@aws-sdk/client-sqs');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/cep', cepRoutes);

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
