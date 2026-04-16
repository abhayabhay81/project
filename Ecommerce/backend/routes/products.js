const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

const readProducts = () => {
  try {
    return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
  } catch {
    return [];
  }
};

// GET /api/products — list with optional search & category filter
router.get('/', (req, res) => {
  try {
    let products = readProducts();
    const { search, category, sort } = req.query;

    if (category && category !== 'All') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (sort === 'price-asc') products.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') products.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') products.sort((a, b) => b.rating - a.rating);

    res.json({ count: products.length, products });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// GET /api/products/:id — single product
router.get('/:id', (req, res) => {
  try {
    const products = readProducts();
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
});

module.exports = router;
