const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_super_secret_jwt_key_12345');
    
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ? AND role = "admin"',
      [decoded.user.id]
    );

    if (users.length === 0) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// ===== BANNER MANAGEMENT =====

// Get all banners
router.get('/banners', async (req, res) => {
  try {
    const { status, position } = req.query;
    let query = 'SELECT * FROM banners';
    let params = [];
    let conditions = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (position) {
      conditions.push('position = ?');
      params.push(position);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY sort_order ASC, created_at DESC';

    const [banners] = await pool.query(query, params);
    res.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get banner by ID
router.get('/banners/:id', async (req, res) => {
  try {
    const [banners] = await pool.query('SELECT * FROM banners WHERE id = ?', [req.params.id]);
    
    if (banners.length === 0) {
      return res.status(404).json({ message: 'Banner tidak ditemukan' });
    }
    
    res.json(banners[0]);
  } catch (error) {
    console.error('Error fetching banner:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create banner
router.post('/banners', adminAuth, async (req, res) => {
  try {
    const { title, description, image_url, link_url, position, status, sort_order, start_date, end_date } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO banners (title, description, image_url, link_url, position, status, sort_order, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, image_url, link_url, position, status || 'active', sort_order || 0, start_date, end_date, req.user.id]
    );
    
    res.status(201).json({ message: 'Banner berhasil dibuat', id: result.insertId });
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update banner
router.put('/banners/:id', adminAuth, async (req, res) => {
  try {
    const { title, description, image_url, link_url, position, status, sort_order, start_date, end_date } = req.body;
    
    const [result] = await pool.query(
      'UPDATE banners SET title = ?, description = ?, image_url = ?, link_url = ?, position = ?, status = ?, sort_order = ?, start_date = ?, end_date = ? WHERE id = ?',
      [title, description, image_url, link_url, position, status, sort_order, start_date, end_date, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Banner tidak ditemukan' });
    }
    
    res.json({ message: 'Banner berhasil diupdate' });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete banner
router.delete('/banners/:id', adminAuth, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM banners WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Banner tidak ditemukan' });
    }
    
    res.json({ message: 'Banner berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== FAQ MANAGEMENT =====

// Get all FAQs
router.get('/faqs', async (req, res) => {
  try {
    const { category, status } = req.query;
    let query = 'SELECT * FROM faqs';
    let params = [];
    let conditions = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY sort_order ASC, created_at DESC';

    const [faqs] = await pool.query(query, params);
    res.json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get FAQ by ID
router.get('/faqs/:id', async (req, res) => {
  try {
    const [faqs] = await pool.query('SELECT * FROM faqs WHERE id = ?', [req.params.id]);
    
    if (faqs.length === 0) {
      return res.status(404).json({ message: 'FAQ tidak ditemukan' });
    }
    
    res.json(faqs[0]);
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create FAQ
router.post('/faqs', adminAuth, async (req, res) => {
  try {
    const { question, answer, category, sort_order, status } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO faqs (question, answer, category, sort_order, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [question, answer, category, sort_order || 0, status || 'active', req.user.id]
    );
    
    res.status(201).json({ message: 'FAQ berhasil dibuat', id: result.insertId });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update FAQ
router.put('/faqs/:id', adminAuth, async (req, res) => {
  try {
    const { question, answer, category, sort_order, status } = req.body;
    
    const [result] = await pool.query(
      'UPDATE faqs SET question = ?, answer = ?, category = ?, sort_order = ?, status = ? WHERE id = ?',
      [question, answer, category, sort_order, status, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'FAQ tidak ditemukan' });
    }
    
    res.json({ message: 'FAQ berhasil diupdate' });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete FAQ
router.delete('/faqs/:id', adminAuth, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM faqs WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'FAQ tidak ditemukan' });
    }
    
    res.json({ message: 'FAQ berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== SITE CONTENT MANAGEMENT =====

// Get all site content
router.get('/content', async (req, res) => {
  try {
    const [content] = await pool.query('SELECT * FROM site_content ORDER BY key_name');
    res.json(content);
  } catch (error) {
    console.error('Error fetching site content:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get content by key
router.get('/content/:key', async (req, res) => {
  try {
    const [content] = await pool.query('SELECT * FROM site_content WHERE key_name = ?', [req.params.key]);
    
    if (content.length === 0) {
      return res.status(404).json({ message: 'Konten tidak ditemukan' });
    }
    
    res.json(content[0]);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update content
router.put('/content/:key', adminAuth, async (req, res) => {
  try {
    const { content, content_type } = req.body;
    
    const [result] = await pool.query(
      'UPDATE site_content SET content = ?, content_type = ?, updated_by = ? WHERE key_name = ?',
      [content, content_type || 'html', req.user.id, req.params.key]
    );
    
    if (result.affectedRows === 0) {
      // If content doesn't exist, create it
      await pool.query(
        'INSERT INTO site_content (key_name, content, content_type, updated_by) VALUES (?, ?, ?, ?)',
        [req.params.key, content, content_type || 'html', req.user.id]
      );
    }
    
    res.json({ message: 'Konten berhasil diupdate' });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active banners for public display
router.get('/banners/active', async (req, res) => {
  try {
    const [banners] = await pool.query(`
      SELECT * FROM banners 
      WHERE status = 'active' 
      AND (start_date IS NULL OR start_date <= NOW()) 
      AND (end_date IS NULL OR end_date >= NOW())
      ORDER BY sort_order ASC, created_at DESC
    `);
    res.json(banners);
  } catch (error) {
    console.error('Error fetching active banners:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get public content
router.get('/content', async (req, res) => {
  try {
    const [content] = await pool.query(`
      SELECT content_key as \`key\`, content_value as value 
      FROM site_content 
      WHERE status = 'active'
    `);
    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update content
router.put('/content/:key', adminAuth, async (req, res) => {
  try {
    const { content, content_type } = req.body;
    
    const [result] = await pool.query(
      'UPDATE site_content SET content = ?, content_type = ?, updated_by = ? WHERE key_name = ?',
      [content, content_type || 'html', req.user.id, req.params.key]
    );
    
    if (result.affectedRows === 0) {
      // If content doesn't exist, create it
      await pool.query(
        'INSERT INTO site_content (key_name, content, content_type, updated_by) VALUES (?, ?, ?, ?)',
        [req.params.key, content, content_type || 'html', req.user.id]
      );
    }
    
    res.json({ message: 'Konten berhasil diupdate' });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;