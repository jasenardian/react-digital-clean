const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth } = require('../middleware/auth');

// Get reviews for a product
// Get reviews for a specific product (tambahkan jika belum ada)
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    console.log('Fetching reviews for product ID:', productId);
    
    const [reviews] = await pool.query(`
      SELECT r.*, u.username 
      FROM product_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.status = 'approved'
      ORDER BY r.created_at DESC
    `, [productId]);
    
    console.log('Found reviews:', reviews.length);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({ error: 'Gagal mengambil ulasan produk' });
  }
});

// Add a review (only for users who bought the product)
router.post('/', auth, async (req, res) => {
  try {
    const { product_id, transaction_id, rating, review_text } = req.body;
    const user_id = req.user.id;

    // Check if user bought this product in this transaction
    const [transaction] = await pool.query(`
      SELECT * FROM transactions 
      WHERE id = ? AND user_id = ? AND product_id = ? AND status = 'success'
    `, [transaction_id, user_id, product_id]);

    if (transaction.length === 0) {
      return res.status(400).json({ error: 'Anda hanya bisa memberikan ulasan untuk produk yang telah dibeli' });
    }

    // Check if review already exists
    const [existingReview] = await pool.query(`
      SELECT * FROM product_reviews 
      WHERE user_id = ? AND product_id = ? AND transaction_id = ?
    `, [user_id, product_id, transaction_id]);

    if (existingReview.length > 0) {
      return res.status(400).json({ error: 'Anda sudah memberikan ulasan untuk pembelian ini' });
    }

    // Insert review
    await pool.query(`
      INSERT INTO product_reviews (user_id, product_id, transaction_id, rating, review_text, status)
      VALUES (?, ?, ?, ?, ?, 'approved')
    `, [user_id, product_id, transaction_id, rating, review_text]);

    res.json({ message: 'Ulasan berhasil ditambahkan' });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's purchased products that can be reviewed
router.get('/user/reviewable', auth, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const [products] = await pool.query(`
      SELECT DISTINCT t.id as transaction_id, t.product_id, p.name, p.image_url, t.created_at,
             CASE WHEN r.id IS NOT NULL THEN 1 ELSE 0 END as has_review
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      LEFT JOIN product_reviews r ON r.transaction_id = t.id AND r.user_id = t.user_id
      WHERE t.user_id = ? AND t.status = 'success'
      ORDER BY t.created_at DESC
    `, [user_id]);
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching reviewable products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;