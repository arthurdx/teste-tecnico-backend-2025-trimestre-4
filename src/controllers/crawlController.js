const { SendMessageCommand } = require('@aws-sdk/client-sqs');
const { sqsClient } = require('../services/sqs');
const CrawlRequest = require("../models/CrawlRequest");


async function createCrawl(req, res) {
    try {
        const { cep_start, cep_end } = req.body;
        if (!cep_start || !cep_end) return res.status(400).json({ error: 'Missing range' })

        const start = parseInt(cep_start)
        const end = parseInt(cep_end);

        const newCrawl = await CrawlRequest.create({
            params: { cep_start, cep_end },
            counts: { total: (end - start) + 1 }
        })


        for (let i = start; i <= end; i++) {
            cepNumber = i.toString().padStart(8, '0');
            const messageBody = {
                crawl_id: newCrawl.crawl_id,
                cep: cepNumber
            };

            const command = new SendMessageCommand({
                QueueUrl: process.env.QUEUE_URL,
                MessageBody: JSON.stringify(messageBody)
            });

            await sqsClient.send(command);    
        }
        res.status(202).json({
                message: "Crawl started",
                crawl_id: newCrawl.crawl_id
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal Server Error"
        })
    }
}

module.exports = { createCrawl }