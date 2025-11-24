const express = require('express');
const {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
} = require('../controllers/cartController');

const router = express.Router();

router.get('/', getCart);
router.post('/items', addCartItem);
router.put('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeCartItem);

module.exports = router;

