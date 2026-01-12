const axios = require('axios');
const { ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const { sqsClient } = require('./services/sqs');
const CrawlRequest = require('./models/CrawlRequest');
const CrawlResult = require('./models/CrawlResult');
const mongoose = require('mongoose');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cep-crawler');

async function worker() {
    console.log('Worker started. Polling messages...');

    while (true) {
        try {
            const command = new ReceiveMessageCommand({
                QueueUrl: process.env.QUEUE_URL,
                MaxNumberOfMessages: 1,
                WaitTimeSeconds: 20
            });

            const response = await sqsClient.send(command);

            if (response.Messages && response.Messages.length > 0) {
                const message = response.Messages[0];
                const body = JSON.parse(message.Body);

                console.log(`Processing CEP: ${body.cep}`);

                const viaCepRes = await axios.get(`https://viacep.com.br/ws/${body.cep}/json/`);
                const isError = viaCepRes.data.erro === 'true' || viaCepRes.data.erro === true;

                await CrawlResult.create({
                    crawl_id: body.crawl_id,
                    cep: body.cep,
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
                    { crawl_id: body.crawl_id }, 
                    updateQuery, 
                    { new: true }
                );

                if (updatedRequest && updatedRequest.counts.processed >= updatedRequest.counts.total) {
                    updatedRequest.status = 'finished';
                    await updatedRequest.save();
                    console.log(`Crawl ${body.crawl_id} FINISHED!`);
                }
                
                console.log("ViaCEP Result:", viaCepRes.data);

                await sqsClient.send(new DeleteMessageCommand({
                    QueueUrl: process.env.QUEUE_URL,
                    ReceiptHandle: message.ReceiptHandle
                }));
                console.log("Message deleted.");

                await sleep(500);
            }
        } catch (error) {
            console.error("Worker Error:", error.message);
            await sleep(5000);
        }
    }
}

worker();