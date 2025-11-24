const express = require('express');
const { startPurchase, getPurchaseStatus } = require('../controllers/purchaseController');

const router = express.Router();

router.post('/start', startPurchase);
router.get('/status/:sessionId', getPurchaseStatus);

module.exports = router;

