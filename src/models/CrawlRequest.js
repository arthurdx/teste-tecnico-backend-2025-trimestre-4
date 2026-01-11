const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const crawlRequestSchema = new mongoose.Schema({
    crawl_id: {
        type: String,
        default: () => randomUUID(),
        unique: true,
        index: true
    },
    params: {
        cep_start: {
            type: String, required: true
        },
        cep_end: {
            type: String, required: true
        },
    },
    counts: {
        total: {
            type: Number, default: 0
        },
        processed: {
            type: Number, default: 0
        },
        success: {
            type: Number, default: 0
        },
        error: {
            type: Number, default: 0
        },
    },
    status: {
        type: String,
        enum: ['pending', 'running', 'finished', 'failed'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('CrawlRequest', crawlRequestSchema);