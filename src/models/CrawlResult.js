const mongoose = require('mongoose');
const { randomUUID } = require('crypto'); 


const crawlResultSchema = new mongoose.Schema({
    crawl_id: { type: String, required: true, index: true},
    cep: { type: String, required: true },
    data: { type: Object }, 
    status: { type: String, enum: ['success', 'not_found', 'error'] } 
}, { timestamps: true });

module.exports = mongoose.model('CrawlResult', crawlResultSchema);