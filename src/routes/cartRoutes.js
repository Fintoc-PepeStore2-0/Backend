const express = require('express');
const { getCart, addCartItem } = require('../controllers/cartController');

const router = express.Router();

router.get('/', getCart);
router.post('/items', addCartItem);

module.exports = router;

