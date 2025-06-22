const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Basic auth middleware untuk user biasa
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    
    // Verify user exists and is active
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ? AND status = "active"',
      [decoded.user.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'User tidak ditemukan atau tidak aktif' });
    }

    req.user = decoded.user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};

// Admin auth middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_super_secret_jwt_key_12345');
    
    // Check if user is admin
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ? AND role = "admin"',
      [decoded.user.id]
    );

    if (users.length === 0) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    req.user = decoded.user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = { auth, adminAuth };