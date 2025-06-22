const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all promotions
router.get('/', async (req, res) => {
  try {
    const [promotions] = await pool.query('SELECT * FROM promotions');
    res.json(promotions);
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get promotion by id
router.get('/:id', async (req, res) => {
  try {
    const [promotions] = await pool.query('SELECT * FROM promotions WHERE id = ?', [req.params.id]);
    
    if (promotions.length === 0) {
      return res.status(404).json({ message: 'Promosi tidak ditemukan' });
    }
    
    res.json(promotions[0]);
  } catch (error) {
    console.error('Error fetching promotion:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;