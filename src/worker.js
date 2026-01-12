const axios = require('axios');
const { ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const { sqsClient } = require('./services/sqs');
const CrawlRequest = require('./models/CrawlRequest');
const CrawlResult = require('./models/CrawlResult');
const mongoose = require('mongoose');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('[Worker] Connected to MongoDB'))
    .catch(err => console.error('[Worker] MongoDB connection error:', err));

async function processMessage(message) {
    const body = JSON.parse(message.Body);
    const { crawl_id, cep } = body;

    try {
        const viaCepRes = await axios.get(`https://viacep.com.br/ws/${cep}/json/`, { timeout: 5000 });
        const isError = viaCepRes.data.erro === 'true';

        await CrawlResult.create({
            crawl_id,
            cep,
            data: viaCepRes.data,
            status: isError ? 'not_found' : 'success'
        });

        const updateQuery = {
            $inc: {
                'counts.processed': 1,
                [isError ? 'counts.error' : 'counts.success']: 1
            }
        };

        const updatedRequest = await CrawlRequest.findOneAndUpdate(
            { crawl_id }, 
            updateQuery, 
            { new: true }
        );

        if (updatedRequest && updatedRequest.status !== 'finished' && updatedRequest.counts.processed >= updatedRequest.counts.total) {
            updatedRequest.status = 'finished';
            await updatedRequest.save();
            console.log(`[Worker] Job ${crawl_id} COMPLETED`);
        }
        
        console.log(`[Worker] Processed ${cep} - ${isError ? 'NOT FOUND' : 'SUCCESS'}`);

        await sqsClient.send(new DeleteMessageCommand({
            QueueUrl: process.env.QUEUE_URL,
            ReceiptHandle: message.ReceiptHandle
        }));

    } catch (error) {
        console.error(`[Worker] Error processing CEP ${cep}:`, error.message);
    }
}

async function worker() {
    console.log('[Worker] Started. Polling messages...');

    while (true) {
        try {
            const command = new ReceiveMessageCommand({
                QueueUrl: process.env.QUEUE_URL,
                MaxNumberOfMessages: 1,
                WaitTimeSeconds: 20
            });

            const response = await sqsClient.send(command);

            if (response.Messages && response.Messages.length > 0) {
                for (const message of response.Messages) {
                    await processMessage(message);
                    await sleep(2000); 
                }
            }
        } catch (error) {
            console.error("[Worker] Loop Error:", error.message);
            await sleep(5000);
        }
    }
}

worker();
