const { SendMessageCommand } = require('@aws-sdk/client-sqs');
const { sqsClient } = require('../services/sqs');
const CrawlRequest = require("../models/CrawlRequest");
const CrawlResult = require('../models/CrawlResult');

/**
 * 
 * @param {string} req 
 * @param {string} res 
 * @returns {object}
 */
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

async function getCrawlStatus(req, res) {
    try {
        const { crawl_id } = req.params;
        if (!crawl_id) return res.status(400).json({ error: 'Missing id' });

        const crawl = await CrawlRequest.findOne({ crawl_id: crawl_id });

        if (!crawl) return res.status(404).json({ error: 'Crawl request not found' });

        return res.json(crawl);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Internal Server Error"
        })
    }
}

async function getCrawlResults(req, res){
    try {
        const { crawl_id } = req.params;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const [results, total] = await Promise.all([
            CrawlResult.find({ crawl_id }).skip(skip).limit(limit).lean(),
            
            CrawlResult.countDocuments({
                crawl_id
            })
        ]);

        res.json({
            results,
            pagination: {
                total,
                page,
                limit,
                pages:
                Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error in getCrawlResults:', error);
        res.status(500).json({
            error: "Internal Server Error"
        });
    }
}

module.exports = { 
    createCrawl, 
    getCrawlStatus, 
    getCrawlResults 
}