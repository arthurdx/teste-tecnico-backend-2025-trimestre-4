const express = require('express');
const router = express.Router();
const crawlController = require('../controllers/crawlController');

router.post('/crawl', crawlController.createCrawl);
router.get('/crawl/:crawl_id', crawlController.getCrawlStatus);

module.exports = router