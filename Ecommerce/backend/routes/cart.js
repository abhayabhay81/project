const express = require('express');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const CARTS_FILE = path.join(__dirname, '../data/carts.json');
const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

const readCarts = () => {
  try { return JSON.parse(fs.readFileSync(CARTS_FILE, 'utf-8')); }
  catch { return {}; }
};
const writeCarts = (carts) => fs.writeFileSync(CARTS_FILE, JSON.stringify(carts, null, 2));
const readProducts = () => {
  try { return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8')); }
  catch { return []; }
};

// All cart routes require authentication
router.use(authMiddleware);

// GET /api/cart — get current user's cart
router.get('/', (req, res) => {
  const carts = readCarts();
  const products = readProducts();
  const userCart = carts[req.user.id] || [];

  const enriched = userCart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return product ? { ...item, product } : null;
  }).filter(Boolean);

  const total = enriched.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  res.json({ items: enriched, total, itemCount: enriched.reduce((s, i) => s + i.quantity, 0) });
});

// POST /api/cart — add item to cart
router.post('/', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId is required.' });

  const products = readProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const carts = readCarts();
  if (!carts[req.user.id]) carts[req.user.id] = [];

  const existing = carts[req.user.id].find(i => i.productId === productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, product.stock);
  } else {
    carts[req.user.id].push({ productId, quantity: Math.min(quantity, product.stock) });
  }

  writeCarts(carts);
  res.json({ message: 'Item added to cart.', cart: carts[req.user.id] });
});

// PUT /api/cart/:productId — update quantity
router.put('/:productId', (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Valid quantity required.' });

  const carts = readCarts();
  if (!carts[req.user.id]) return res.status(404).json({ error: 'Cart is empty.' });

  const item = carts[req.user.id].find(i => i.productId === req.params.productId);
  if (!item) return res.status(404).json({ error: 'Item not in cart.' });

  item.quantity = quantity;
  writeCarts(carts);
  res.json({ message: 'Cart updated.', cart: carts[req.user.id] });
});

// DELETE /api/cart/:productId — remove item
router.delete('/:productId', (req, res) => {
  const carts = readCarts();
  if (!carts[req.user.id]) return res.status(404).json({ error: 'Cart is empty.' });

  carts[req.user.id] = carts[req.user.id].filter(i => i.productId !== req.params.productId);
  writeCarts(carts);
  res.json({ message: 'Item removed from cart.' });
});

// DELETE /api/cart — clear entire cart
router.delete('/', (req, res) => {
  const carts = readCarts();
  carts[req.user.id] = [];
  writeCarts(carts);
  res.json({ message: 'Cart cleared.' });
});

module.exports = router;
