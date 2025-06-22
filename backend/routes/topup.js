const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

// Middleware untuk verifikasi token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    req.user = decoded.user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};

// Mendapatkan riwayat top up
router.get('/history', verifyToken, async (req, res) => {
  try {
    const [topups] = await pool.query(
      'SELECT * FROM topups WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    
    // Ubah format response agar konsisten dengan endpoint lain
    res.json({
      success: true,
      data: topups,
      message: 'Riwayat top up berhasil diambil'
    });
  } catch (error) {
    console.error('Error fetching top up history:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      data: []
    });
  }
});

// Membuat permintaan top up
router.post('/request', verifyToken, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body; // Tambahkan paymentMethod
    const userId = req.user.id;
    
    if (!amount || amount < 10000) {
      return res.status(400).json({ message: 'Jumlah minimal top up adalah Rp 10.000' });
    }
    
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Metode pembayaran harus dipilih' });
    }

    // Ambil pengaturan Tripay
    const tripaySettings = await getTripaySettings();
    
    // Generate merchant reference
    const merchantRef = `TOPUP-${userId}-${Date.now()}`;
    
    // Simpan ke database dengan status pending (gunakan tabel 'topups')
    const [result] = await pool.execute(
      'INSERT INTO topups (user_id, amount, merchant_ref, payment_method, status, created_at) VALUES (?, ?, ?, ?, "pending", NOW())',
      [userId, amount, merchantRef, paymentMethod]
    );
    
    const topupId = result.insertId;
    
    // Buat signature untuk Tripay
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', tripaySettings.tripay_private_key)
      .update(tripaySettings.tripay_merchant_code + merchantRef + amount)
      .digest('hex');
    
    // Siapkan data untuk Tripay
    const tripayData = {
      method: paymentMethod, // Gunakan method yang dipilih user
      merchant_ref: merchantRef,
      amount: parseInt(amount),
      customer_name: req.user.username,
      customer_email: req.user.email || `${req.user.username}@example.com`,
      customer_phone: req.user.phone || '08123456789',
      order_items: [{
        sku: 'TOPUP',
        name: 'Top Up Saldo',
        price: parseInt(amount),
        quantity: 1
      }],
      callback_url: tripaySettings.tripay_callback_url,
      return_url: `${process.env.FRONTEND_URL}/profile?tab=riwayat-topup`,
      expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 jam
      signature: signature
    };
    
    // Kirim request ke Tripay
    const baseUrl = tripaySettings.tripay_environment === 'production' 
      ? 'https://tripay.co.id/api' 
      : 'https://tripay.co.id/api-sandbox';
    
    const tripayResponse = await axios.post(`${baseUrl}/transaction/create`, tripayData, {
      headers: {
        'Authorization': `Bearer ${tripaySettings.tripay_api_key}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (tripayResponse.data.success) {
      // Update database dengan reference dari Tripay (gunakan tabel 'topups')
      await pool.execute(
        'UPDATE topups SET tripay_reference = ?, payment_url = ? WHERE id = ?',
        [tripayResponse.data.data.reference, tripayResponse.data.data.checkout_url, topupId]
      );
      
      res.json({
        success: true,
        paymentUrl: tripayResponse.data.data.checkout_url,
        reference: tripayResponse.data.data.reference
      });
    } else {
      throw new Error('Gagal membuat transaksi di Tripay');
    }
    
  } catch (error) {
    console.error('Error creating top up request:', error);
    res.status(500).json({ message: 'Gagal membuat permintaan top up' });
  }
});

// Update callback endpoint untuk Tripay
router.post('/callback', async (req, res) => {
  try {
    const callbackData = req.body;
    console.log('Tripay Callback Data:', callbackData);
    
    // Ambil pengaturan Tripay untuk validasi signature
    const tripaySettings = await getTripaySettings();
    
    // Validasi signature
    const crypto = require('crypto');
    const callbackSignature = crypto
      .createHmac('sha256', tripaySettings.tripay_private_key)
      .update(JSON.stringify(callbackData))
      .digest('hex');
    
    if (callbackSignature !== req.headers['x-callback-signature']) {
      console.log('Invalid signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }
    
    const { reference, status, merchant_ref } = callbackData;
    console.log(`Processing callback for ${merchant_ref} with status ${status}`);
    
    // Mapping status Tripay ke status aplikasi
    let appStatus;
    switch (status) {
      case 'PAID':
        appStatus = 'success';
        break;
      case 'EXPIRED':
      case 'FAILED':
        appStatus = 'failed';
        break;
      case 'UNPAID':
        appStatus = 'pending';
        break;
      default:
        appStatus = 'pending';
    }
    
    // Update status di database
    const [updateResult] = await pool.execute(
      'UPDATE topups SET status = ?, tripay_reference = ?, updated_at = NOW() WHERE merchant_ref = ?',
      [appStatus, reference, merchant_ref]
    );
    
    console.log(`Updated ${updateResult.affectedRows} rows`);
    
    // Jika pembayaran berhasil, tambahkan saldo ke user
    if (status === 'PAID') {
      const [topupData] = await pool.execute(
        'SELECT user_id, amount FROM topups WHERE merchant_ref = ?',
        [merchant_ref]
      );
      
      if (topupData.length > 0) {
        const { user_id, amount } = topupData[0];
        
        // Update saldo user
        const [balanceResult] = await pool.execute(
          'UPDATE users SET balance = balance + ? WHERE id = ?',
          [amount, user_id]
        );
        
        console.log(`Updated balance for user ${user_id}, added ${amount}`);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error processing callback:', error);
    res.status(500).json({ message: 'Error processing callback' });
  }
});

// Update endpoint history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [rows] = await pool.execute(
      'SELECT * FROM topups WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    // Format response agar konsisten
    res.json({
      success: true,
      data: rows,
      message: 'Riwayat top up berhasil diambil'
    });
  } catch (error) {
    console.error('Error fetching top up history:', error);
    res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil riwayat top up',
      data: []
    });
  }
});

// Callback untuk Tripay (webhook)
router.post('/callback', async (req, res) => {
  try {
    // Dalam implementasi nyata, Anda perlu memverifikasi signature dari Tripay
    // untuk memastikan callback berasal dari Tripay
    
    const { merchant_ref, status } = req.body;
    
    // Update status top up di database
    if (status === 'PAID') {
      // Dapatkan data top up
      const [topups] = await pool.query(
        'SELECT * FROM topups WHERE merchant_ref = ?',
        [merchant_ref]
      );
      
      if (topups.length === 0) {
        return res.status(404).json({ success: false, message: 'Top up tidak ditemukan' });
      }
      
      const topup = topups[0];
      
      // Update status top up menjadi success
      await pool.query(
        'UPDATE topups SET status = ? WHERE id = ?',
        ['success', topup.id]
      );
      
      // Tambahkan saldo user
      await pool.query(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [topup.amount, topup.user_id]
      );
      
      res.json({ success: true });
    } else if (status === 'EXPIRED' || status === 'FAILED') {
      // Update status top up menjadi failed
      await pool.query(
        'UPDATE topups SET status = ? WHERE merchant_ref = ?',
        ['failed', merchant_ref]
      );
      
      res.json({ success: true });
    } else {
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error processing callback:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Simulasi pembayaran (untuk testing)
router.post('/simulate-payment', async (req, res) => {
  try {
    const { merchant_ref, status } = req.body;
    
    // Update status top up di database
    if (status === 'success') {
      // Dapatkan data top up
      const [topups] = await pool.query(
        'SELECT * FROM topups WHERE merchant_ref = ?',
        [merchant_ref]
      );
      
      if (topups.length === 0) {
        return res.status(404).json({ success: false, message: 'Top up tidak ditemukan' });
      }
      
      const topup = topups[0];
      
      // Update status top up menjadi success
      await pool.query(
        'UPDATE topups SET status = ? WHERE id = ?',
        ['success', topup.id]
      );
      
      // Tambahkan saldo user
      await pool.query(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [topup.amount, topup.user_id]
      );
      
      res.json({ success: true, message: 'Pembayaran berhasil disimulasikan' });
    } else {
      // Update status top up menjadi failed
      await pool.query(
        'UPDATE topups SET status = ? WHERE merchant_ref = ?',
        ['failed', merchant_ref]
      );
      
      res.json({ success: true, message: 'Pembayaran gagal disimulasikan' });
    }
  } catch (error) {
    console.error('Error simulating payment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

// Fungsi untuk mendapatkan pengaturan Tripay
const getTripaySettings = async () => {
  const [rows] = await pool.execute('SELECT * FROM tripay_settings WHERE id = 1');
  if (rows.length === 0) {
    throw new Error('Pengaturan Tripay belum dikonfigurasi');
  }
  return rows[0];
};

// Mendapatkan daftar payment channel yang aktif
router.get('/payment-channels', verifyToken, async (req, res) => {
  try {
    // Ambil pengaturan Tripay
    const tripaySettings = await getTripaySettings();
    
    // Tentukan base URL berdasarkan environment
    const baseUrl = tripaySettings.tripay_environment === 'production' 
      ? 'https://tripay.co.id/api' 
      : 'https://tripay.co.id/api-sandbox';
    
    // Request ke Tripay API untuk mendapatkan merchant payment channels
    const response = await axios.get(`${baseUrl}/merchant/payment-channel`, {
      headers: {
        'Authorization': `Bearer ${tripaySettings.tripay_api_key}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      // Filter hanya channel yang aktif
      const activeChannels = response.data.data.filter(channel => channel.active === true);
      
      // Format data untuk frontend
      const formattedChannels = activeChannels.map(channel => ({
        code: channel.code,
        name: channel.name,
        type: channel.type,
        fee_merchant: channel.fee_merchant,
        fee_customer: channel.fee_customer,
        total_fee: channel.total_fee,
        icon_url: channel.icon_url,
        minimum_fee: channel.minimum_fee,
        maximum_fee: channel.maximum_fee
      }));
      
      res.json({
        success: true,
        data: formattedChannels
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Gagal mengambil daftar payment channel' 
      });
    }
  } catch (error) {
    console.error('Error fetching payment channels:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error saat mengambil payment channels' 
    });
  }
});