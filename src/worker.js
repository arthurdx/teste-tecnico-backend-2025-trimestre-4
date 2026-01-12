const axios = require('axios');
const { ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const { sqsClient } = require('./services/sqs');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
