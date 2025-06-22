const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Middleware untuk verifikasi token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    req.user = decoded.user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};

// Mendapatkan riwayat transaksi
router.get('/', verifyToken, async (req, res) => {
  try {
    const [transactions] = await pool.query(
      `SELECT t.*, p.name as product_name 
       FROM transactions t 
       JOIN products p ON t.product_id = p.id 
       WHERE t.user_id = ? 
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Membuat transaksi baru
router.post('/', verifyToken, async (req, res) => {
  try {
    const { product_id, quantity, notes } = req.body;
    
    console.log('Received transaction data:', { product_id, quantity, notes }); // Debug log
    
    if (!product_id || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Data transaksi tidak valid' });
    }
    
    // Dapatkan data produk
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    
    const product = products[0];
    const totalPrice = product.price * quantity;
    
    // Dapatkan data user
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    
    const user = users[0];
    
    // Cek saldo user
    if (user.balance < totalPrice) {
      return res.status(400).json({ message: 'Saldo tidak mencukupi' });
    }
    
    // Generate transaction code
    const transactionCode = 'TRX' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    // Mulai transaksi database
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Buat transaksi dengan status pending (JANGAN kurangi saldo dulu)
      const [result] = await connection.query(
        'INSERT INTO transactions (user_id, product_id, amount, status, transaction_code, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, product_id, totalPrice, 'pending', transactionCode, notes || null]
      );
      
      console.log('Transaction created with ID:', result.insertId, 'Status: pending'); // Debug log
      
      await connection.commit();
      
      res.status(201).json({
        success: true,
        message: 'Transaksi berhasil dibuat dengan status pending. Menunggu konfirmasi admin.',
        transaction_id: result.insertId,
        transaction_code: transactionCode,
        status: 'pending'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update status transaksi (untuk admin)
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    
    // Validasi status
    const validStatuses = ['pending', 'success', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }
    
    // Dapatkan data transaksi
    const [transactions] = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]);
    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }
    
    const transaction = transactions[0];
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Jika status berubah menjadi success, kurangi saldo user
      if (status === 'success' && transaction.status === 'pending') {
        await connection.query(
          'UPDATE users SET balance = balance - ? WHERE id = ?',
          [transaction.amount, transaction.user_id]
        );
      }
      
      // Jika status berubah dari success ke failed/cancelled, kembalikan saldo
      if ((status === 'failed' || status === 'cancelled') && transaction.status === 'success') {
        await connection.query(
          'UPDATE users SET balance = balance + ? WHERE id = ?',
          [transaction.amount, transaction.user_id]
        );
      }
      
      // Update status transaksi
      const updateNotes = admin_notes ? `${transaction.notes || ''}\n[Admin]: ${admin_notes}` : transaction.notes;
      await connection.query(
        'UPDATE transactions SET status = ?, notes = ? WHERE id = ?',
        [status, updateNotes, id]
      );
      
      await connection.commit();
      
      res.json({
        success: true,
        message: `Status transaksi berhasil diupdate menjadi ${status}`
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Tambahkan endpoint ini setelah middleware verifyToken
router.get('/history', verifyToken, async (req, res) => {
  try {
    const [transactions] = await pool.query(
      `SELECT t.*, p.name as product_name 
       FROM transactions t 
       LEFT JOIN products p ON t.product_id = p.id 
       WHERE t.user_id = ? 
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

module.exports = router;