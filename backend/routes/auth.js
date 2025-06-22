const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register user
router.post('/register', async (req, res) => {
  try {
    const { username, pin } = req.body;

    // Validate input
    if (!username || !pin) {
      return res.status(400).json({ message: 'Username dan PIN diperlukan' });
    }

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      return res.status(400).json({ message: 'PIN harus 4 digit angka' });
    }

    // Check if username already exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    // Hash the PIN
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    // Insert user to database
    const [result] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPin]
    );

    res.status(201).json({ message: 'Registrasi berhasil' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, pin } = req.body;

    // Validate input
    if (!username || !pin) {
      return res.status(400).json({ message: 'Username dan PIN diperlukan' });
    }

    // Check if user exists
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'Username atau PIN salah' });
    }

    const user = users[0];

    // Verify PIN
    const isMatch = await bcrypt.compare(pin, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Username atau PIN salah' });
    }

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        username: user.username
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'my_super_secret_jwt_key_12345',
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Format token tidak valid' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_super_secret_jwt_key_12345');
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);
      return res.status(401).json({ message: 'Token tidak valid atau sudah expired' });
    }
    
    // Update query untuk menambahkan created_at dan last_login dengan nilai default
    const [users] = await pool.query(`
      SELECT 
        id, 
        username, 
        balance,
        IFNULL(created_at, NOW()) as created_at,
        IFNULL(last_login, NOW()) as last_login
      FROM users 
      WHERE id = ?
    `, [decoded.user.id]);
    
    // Tambahkan logging untuk debugging
    console.log('Database result:', users[0]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset PIN
// Reset PIN
router.post('/reset-pin', async (req, res) => {
  try {
    // Verify token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_super_secret_jwt_key_12345');
    
    // Generate new PIN (4 digit) - diubah dari 6 digit
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Hash the new PIN
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(newPin, salt);
    
    // Update user's PIN
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPin, decoded.user.id]);
    
    // In a real implementation, you would send the new PIN via email
    res.json({ message: 'PIN berhasil direset', newPin });
  } catch (error) {
    console.error('Reset PIN error:', error);
    res.status(401).json({ message: 'Token tidak valid' });
  }
});

// Google Login endpoint
router.post('/google-login', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    
    // Check if user exists or create new user
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        email,
        name,
        picture,
        authProvider: 'google'
      });
      await user.save();
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, user: { id: user._id, email, name } });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(400).json({ message: 'Google login gagal' });
  }
});

module.exports = router;