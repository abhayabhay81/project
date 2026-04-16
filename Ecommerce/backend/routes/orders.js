const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const ORDERS_FILE = path.join(__dirname, '../data/orders.json');
const CARTS_FILE = path.join(__dirname, '../data/carts.json');
const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

const readOrders = () => {
  try { return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8')); }
  catch { return []; }
};
const writeOrders = (o) => fs.writeFileSync(ORDERS_FILE, JSON.stringify(o, null, 2));
const readCarts = () => {
  try { return JSON.parse(fs.readFileSync(CARTS_FILE, 'utf-8')); }
  catch { return {}; }
};
const writeCarts = (c) => fs.writeFileSync(CARTS_FILE, JSON.stringify(c, null, 2));
const readProducts = () => {
  try { return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8')); }
  catch { return []; }
};

router.use(authMiddleware);

// GET /api/orders — get user's order history
router.get('/', (req, res) => {
  const orders = readOrders();
  const userOrders = orders.filter(o => o.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ orders: userOrders });
});

// GET /api/orders/:id — get single order
router.get('/:id', (req, res) => {
  const orders = readOrders();
  const order = orders.find(o => o.id === req.params.id && o.userId === req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json(order);
});

// POST /api/orders — place a new order
router.post('/', (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  if (!shippingAddress || !paymentMethod) {
    return res.status(400).json({ error: 'Shipping address and payment method are required.' });
  }

  const carts = readCarts();
  const userCart = carts[req.user.id] || [];

  if (userCart.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  const products = readProducts();
  const orderItems = userCart.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return null;
    return {
      productId: item.productId,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: item.quantity,
      subtotal: product.price * item.quantity
    };
  }).filter(Boolean);

  const subtotal = orderItems.reduce((s, i) => s + i.subtotal, 0);
  const tax = Math.round(subtotal * 0.18);
  const shippingCost = subtotal >= 999 ? 0 : 99;
  const total = subtotal + tax + shippingCost;

  const newOrder = {
    id: uuidv4(),
    userId: req.user.id,
    userName: req.user.name,
    items: orderItems,
    subtotal,
    tax,
    shippingCost,
    total,
    shippingAddress,
    paymentMethod,
    status: 'Confirmed',
    createdAt: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  };

  const orders = readOrders();
  orders.push(newOrder);
  writeOrders(orders);

  // Clear cart after order
  carts[req.user.id] = [];
  writeCarts(carts);

  res.status(201).json({ message: 'Order placed successfully!', order: newOrder });
});

module.exports = router;
