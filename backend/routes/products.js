const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all products
router.get('/', async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT *, 
             COALESCE(sold_count, 0) as sold_count,
             COALESCE(CAST(average_rating AS DECIMAL(3,2)), 0.00) as average_rating,
             COALESCE(total_reviews, 0) as total_reviews
      FROM products 
      WHERE status = 'active'
      ORDER BY created_at DESC
    `);
    
    // Convert string numbers to actual numbers
    const processedProducts = products.map(product => ({
      ...product,
      average_rating: parseFloat(product.average_rating) || 0,
      sold_count: parseInt(product.sold_count) || 0,
      total_reviews: parseInt(product.total_reviews) || 0
    }));
    
    res.json(processedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product by id
router.get('/:id', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    
    res.json(products[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products WHERE category = ?', [req.params.category]);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;