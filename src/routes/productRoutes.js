const express = require('express');
const { getProducts, getProductStock } = require('../controllers/productController');

const router = express.Router();

router.get('/', getProducts);
router.get('/:productId/stock', getProductStock);

module.exports = router;

