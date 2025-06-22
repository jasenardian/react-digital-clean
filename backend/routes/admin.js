const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const pool = require('../config/db');
const router = express.Router();

// Admin authentication middleware
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

    req.user = users[0];
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if admin exists
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? AND role = "admin"',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { user: { id: user.id, username: user.username, role: user.role } },
      process.env.JWT_SECRET || 'my_super_secret_jwt_key_12345',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role != "admin"');
    const [productCount] = await pool.query('SELECT COUNT(*) as count FROM products');
    const [transactionCount] = await pool.query('SELECT COUNT(*) as count FROM transactions');
    const [revenueSum] = await pool.query('SELECT SUM(amount) as total FROM transactions WHERE status = "success"');

    res.json({
      totalUsers: userCount[0].count,
      totalProducts: productCount[0].count,
      totalTransactions: transactionCount[0].count,
      totalRevenue: revenueSum[0].total || 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent transactions
router.get('/recent-transactions', adminAuth, async (req, res) => {
  try {
    const [transactions] = await pool.query(`
      SELECT 
        t.id,
        t.amount,
        t.status,
        t.created_at,
        u.username,
        p.name as product_name
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      JOIN products p ON t.product_id = p.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `);

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all products (admin)
router.get('/products', adminAuth, async (req, res) => {
  try {
    const [products] = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new product
router.post('/products', adminAuth, async (req, res) => {
  try {
    const { name, category, price, description, image_url, stock, status } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO products (name, category, price, description, image_url, stock, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [name, category, price, description, image_url, stock, status || 'active']
    );
    
    res.status(201).json({ 
      message: 'Product created successfully', 
      productId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product
router.put('/products/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, description, image_url, stock, status } = req.body;
    
    await pool.query(
      'UPDATE products SET name = ?, category = ?, price = ?, description = ?, image_url = ?, stock = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [name, category, price, description, image_url, stock, status, id]
    );
    
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete product
router.delete('/products/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (admin)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, balance, status, created_at, last_login FROM users WHERE role != "admin" ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user status (block/unblock)
router.put('/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    await pool.query(
      'UPDATE users SET status = ? WHERE id = ? AND role != "admin"',
      [status, id]
    );
    
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset user password
router.post('/users/:id/reset-password', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Generate new temporary password
    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ? AND role != "admin"',
      [hashedPassword, id]
    );
    
    res.json({ 
      message: 'Password reset successfully',
      newPassword: newPassword
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Analytics endpoint
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // For now, let's return mock data to test the endpoint
    const analyticsData = {
      kpis: {
        totalRevenue: 15420000,
        totalTransactions: 1247,
        totalUsers: 2890,
        conversionRate: 12.5
      },
      salesTrend: [
        { date: '2024-01-01', revenue: 1500000, transactions: 45 },
        { date: '2024-01-02', revenue: 1800000, transactions: 52 },
        { date: '2024-01-03', revenue: 2100000, transactions: 61 }
      ],
      transactionStatus: [
        { status: 'completed', count: 245, percentage: 78 },
        { status: 'pending', count: 45, percentage: 14 },
        { status: 'failed', count: 25, percentage: 8 }
      ],
      userGrowth: [
        { month: 'Jan', users: 120 },
        { month: 'Feb', users: 145 },
        { month: 'Mar', users: 180 }
      ],
      topProducts: [
        { name: 'Premium Package', sales: 156, revenue: 7800000 },
        { name: 'Standard Package', sales: 234, revenue: 4680000 }
      ]
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all transactions (admin) with filters and pagination
// Hapus duplikasi dan gunakan satu route saja
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      dateFrom, 
      dateTo, 
      search 
    } = req.query;

    let whereClause = '';
    let queryParams = [];
    let conditions = [];
    
    // Filter conditions
    if (status && status !== 'all') {
      conditions.push('t.status = ?');
      queryParams.push(status);
    }
    
    if (dateFrom) {
      conditions.push('DATE(t.created_at) >= ?');
      queryParams.push(dateFrom);
    }
    
    if (dateTo) {
      conditions.push('DATE(t.created_at) <= ?');
      queryParams.push(dateTo);
    }
    
    if (search) {
      conditions.push('(u.username LIKE ? OR p.name LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    // Optimized single query with window functions
    const optimizedQuery = `
      SELECT 
        t.id,
        t.user_id,
        t.product_id,
        t.amount,
        t.status,
        t.created_at,
        u.username,
        u.email,
        p.name as product_name,
        p.category as product_category,
        COUNT(*) OVER() as total_records,
        COUNT(CASE WHEN t.status = 'success' THEN 1 END) OVER() as success_count,
        COUNT(CASE WHEN t.status = 'pending' THEN 1 END) OVER() as pending_count,
        COUNT(CASE WHEN t.status = 'failed' THEN 1 END) OVER() as failed_count,
        COALESCE(SUM(CASE WHEN t.status = 'success' THEN t.amount END) OVER(), 0) as total_revenue
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      JOIN products p ON t.product_id = p.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const offset = (page - 1) * limit;
    const [results] = await pool.query(
      optimizedQuery, 
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    const totalRecords = results.length > 0 ? results[0].total_records : 0;
    const totalPages = Math.ceil(totalRecords / limit);

    // Extract statistics from first row
    const statistics = results.length > 0 ? {
      total_transactions: results[0].total_records,
      success_transactions: results[0].success_count,
      pending_transactions: results[0].pending_count,
      failed_transactions: results[0].failed_count,
      total_revenue: results[0].total_revenue
    } : {
      total_transactions: 0,
      success_transactions: 0,
      pending_transactions: 0,
      failed_transactions: 0,
      total_revenue: 0
    };

    // Clean up transaction data
    const transactions = results.map(row => ({
      id: row.id,
      user_id: row.user_id,
      product_id: row.product_id,
      amount: row.amount,
      status: row.status,
      created_at: row.created_at,
      username: row.username,
      email: row.email,
      product_name: row.product_name,
      product_category: row.product_category
    }));

    res.json({
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords,
        limit: parseInt(limit)
      },
      statistics
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction details - FIXED QUERY
router.get('/transactions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [transactions] = await pool.query(`
      SELECT 
        t.*,
        u.username,
        u.email,
        u.balance as user_balance,
        p.name as product_name,
        p.category as product_category,
        p.price as product_price
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      JOIN products p ON t.product_id = p.id
      WHERE t.id = ?
    `, [id]);
    
    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transactions[0]);
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update transaction status
router.put('/transactions/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'success', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Dapatkan data transaksi terlebih dahulu
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );
    
    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const transaction = transactions[0];
    
    // Mulai database transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update status transaksi
      await connection.query(
        'UPDATE transactions SET status = ? WHERE id = ?',
        [status, id]
      );
      
      // Jika status berubah menjadi success dari pending, kurangi saldo user
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
      
      await connection.commit();
      
      res.json({ 
        message: 'Transaction status updated successfully',
        balanceUpdated: status === 'success' && transaction.status === 'pending'
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

// Categories Management Endpoints

// Get all categories with hierarchy
router.get('/categories', async (req, res) => {
  try {
    const { search, parent_id } = req.query;
    
    let query = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.status,
        c.parent_id,
        c.level,
        c.created_at,
        c.updated_at,
        COUNT(p.id) as product_count,
        parent.name as parent_name
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      LEFT JOIN products p ON c.name = p.category AND p.status = 'active'
    `;
    
    let queryParams = [];
    let whereConditions = [];
    
    if (search) {
      whereConditions.push('(c.name LIKE ? OR c.description LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (parent_id !== undefined) {
      if (parent_id === 'null' || parent_id === '') {
        whereConditions.push('c.parent_id IS NULL');
      } else {
        whereConditions.push('c.parent_id = ?');
        queryParams.push(parent_id);
      }
    }
    
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    query += ` GROUP BY c.id ORDER BY c.level ASC, c.created_at DESC`;
    
    const [categories] = await pool.query(query, queryParams);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get category tree structure
router.get('/categories/tree', async (req, res) => {
  try {
  // Dalam router.get('/categories/tree')
// Update router.get('/categories/tree') - sekitar baris 476-484
const [categories] = await pool.query(`
  SELECT 
    c.id,
    c.name,
    c.description,
    c.status,
    c.parent_id,
    c.level,
    c.icon,
    c.image_url,
    COUNT(p.id) as product_count
  FROM categories c
  LEFT JOIN products p ON c.name = p.category AND p.status = 'active'
  WHERE c.status = 'active'
  GROUP BY c.id
  ORDER BY c.level ASC, c.name ASC
`);
    // Build tree structure
    const categoryMap = new Map();
    const rootCategories = [];
    
    // First pass: create all category objects
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });
    
    // Second pass: build tree structure
    categories.forEach(cat => {
      if (cat.parent_id === null) {
        rootCategories.push(categoryMap.get(cat.id));
      } else {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children.push(categoryMap.get(cat.id));
        }
      }
    });
    
    res.json(rootCategories);
  } catch (error) {
    console.error('Error fetching category tree:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new category (updated to support parent_id)
router.post('/categories', async (req, res) => {
  try {
    // Dalam fungsi POST /categories
    const { name, description, status = 'active', parent_id = null, icon = null, image_url = null } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    // Check if category already exists
    const [existing] = await pool.query('SELECT id FROM categories WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }
    
    // Determine level
    let level = 0;
    if (parent_id) {
      const [parent] = await pool.query('SELECT level FROM categories WHERE id = ?', [parent_id]);
      if (parent.length > 0) {
        level = parent[0].level + 1;
        // Limit to 2 levels (category -> subcategory)
        if (level > 1) {
          return res.status(400).json({ error: 'Maximum 2 levels of categories allowed' });
        }
      }
    }
    
    const [result] = await pool.query(
      'INSERT INTO categories (name, description, status, parent_id, level, icon, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [name, description, status, parent_id, level, icon, image_url]
    );
    
    res.status(201).json({
      message: 'Category created successfully',
      categoryId: result.insertId
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update category
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, icon = null, image_url = null } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    // Check if category exists
    const [existing] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check if name already exists (excluding current category)
    const [duplicate] = await pool.query('SELECT id FROM categories WHERE name = ? AND id != ?', [name, id]);
    if (duplicate.length > 0) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }
    
    await pool.query(
      'UPDATE categories SET name = ?, description = ?, status = ?, icon = ?, image_url = ?, updated_at = NOW() WHERE id = ?',
      [name, description, status, icon, image_url, id]
    );
    
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete category
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const [existing] = await pool.query('SELECT name FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check if category is being used by products
    const [products] = await pool.query('SELECT COUNT(*) as count FROM products WHERE category = ?', [existing[0].name]);
    if (products[0].count > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category. It is being used by ${products[0].count} product(s)` 
      });
    }
    
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk delete categories
router.delete('/categories', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Category IDs are required' });
    }
    
    // Check which categories are being used
    const [categories] = await pool.query(
      `SELECT c.id, c.name, COUNT(p.id) as product_count 
       FROM categories c 
       LEFT JOIN products p ON c.name = p.category 
       WHERE c.id IN (${ids.map(() => '?').join(',')}) 
       GROUP BY c.id`,
      ids
    );
    
    const categoriesInUse = categories.filter(cat => cat.product_count > 0);
    const categoriesToDelete = categories.filter(cat => cat.product_count === 0);
    
    if (categoriesInUse.length > 0) {
      return res.status(400).json({ 
        error: `Cannot delete ${categoriesInUse.length} category(ies) as they are being used by products`,
        categoriesInUse: categoriesInUse.map(cat => ({ id: cat.id, name: cat.name, productCount: cat.product_count }))
      });
    }
    
    if (categoriesToDelete.length > 0) {
      await pool.query(
        `DELETE FROM categories WHERE id IN (${categoriesToDelete.map(() => '?').join(',')})`,
        categoriesToDelete.map(cat => cat.id)
      );
    }
    
    res.json({ 
      message: `${categoriesToDelete.length} category(ies) deleted successfully`,
      deletedCount: categoriesToDelete.length
    });
  } catch (error) {
    console.error('Error bulk deleting categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all roles from database (admin)
router.get('/roles', adminAuth, async (req, res) => {
  try {
    const [roles] = await pool.query(
      'SELECT id, name, display_name, description FROM roles ORDER BY id'
    );
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update endpoint users dengan pagination dan filtering
router.get('/users', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      role = 'all',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['u.role != "admin"'];
    let queryParams = [];

    // Add search condition
    if (search) {
      whereConditions.push('(u.username LIKE ? OR u.email LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Add status filter
    if (status !== 'all') {
      whereConditions.push('u.status = ?');
      queryParams.push(status);
    }

    // Add role filter
    if (role !== 'all') {
      whereConditions.push('r.name = ?');
      queryParams.push(role);
    }

    const whereClause = whereConditions.join(' AND ');
    
    // Get users with role information
    const usersQuery = `
      SELECT 
        u.id, u.username, u.email, u.balance, u.status, 
        u.created_at, u.last_login, u.role_id,
        r.name as role_name, r.display_name as role_display_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE ${whereClause}
      ORDER BY u.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    
    const [users] = await pool.query(usersQuery, [...queryParams, parseInt(limit), offset]);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE ${whereClause}
    `;
    const [countResult] = await pool.query(countQuery, queryParams);
    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / limit);
    
    // Get statistics
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked_users,
        SUM(CASE WHEN r.name = 'user' THEN 1 ELSE 0 END) as regular_users,
        SUM(CASE WHEN r.name = 'moderator' THEN 1 ELSE 0 END) as moderators
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.role != 'admin'
    `);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords,
        limit: parseInt(limit)
      },
      statistics: stats[0]
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add bulk actions endpoint
router.post('/users/bulk-action', adminAuth, async (req, res) => {
  try {
    const { action, userIds, data } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Invalid user IDs' });
    }
    
    const placeholders = userIds.map(() => '?').join(',');
    
    switch (action) {
      case 'block':
        await pool.query(
          `UPDATE users SET status = 'blocked' WHERE id IN (${placeholders}) AND role != 'admin'`,
          userIds
        );
        break;
        
      case 'unblock':
        await pool.query(
          `UPDATE users SET status = 'active' WHERE id IN (${placeholders}) AND role != 'admin'`,
          userIds
        );
        break;
        
      case 'change_role':
        if (!data.roleId) {
          return res.status(400).json({ message: 'Role ID is required' });
        }
        await pool.query(
          `UPDATE users SET role_id = ? WHERE id IN (${placeholders}) AND role != 'admin'`,
          [data.roleId, ...userIds]
        );
        break;
        
      case 'delete':
        await pool.query(
          `DELETE FROM users WHERE id IN (${placeholders}) AND role != 'admin'`,
          userIds
        );
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
    
    // Log admin action
    await pool.query(
      'INSERT INTO admin_logs (admin_id, action, target_type, details) VALUES (?, ?, ?, ?)',
      [req.user.id, `bulk_${action}`, 'users', JSON.stringify({ userIds, data })]
    );
    
    res.json({ message: `Bulk ${action} completed successfully` });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add user activity endpoint
router.get('/users/:id/activity', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [logs] = await pool.query(`
      SELECT 
        ual.id, ual.action, ual.details, ual.ip_address, 
        ual.user_agent, ual.created_at,
        admin.username as admin_username
      FROM user_activity_logs ual
      LEFT JOIN users admin ON ual.admin_id = admin.id
      WHERE ual.user_id = ?
      ORDER BY ual.created_at DESC
      LIMIT 50
    `, [id]);
    
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add export users endpoint
router.get('/users/export', adminAuth, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT 
        u.id, u.username, u.email, u.balance, u.status, 
        u.created_at, u.last_login,
        r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.role != 'admin'
      ORDER BY u.created_at DESC
    `);
    
    // Convert to CSV
    const csvHeader = 'ID,Username,Email,Balance,Status,Role,Created At,Last Login\n';
    const csvData = users.map(user => {
      return [
        user.id,
        user.username,
        user.email || '',
        user.balance,
        user.status,
        user.role_name || '',
        user.created_at,
        user.last_login || ''
      ].join(',');
    }).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csvHeader + csvData);
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Endpoint untuk update saldo user
router.post('/users/:id/balance', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, description } = req.body;
    
    // Validasi input
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Jumlah harus lebih dari 0' });
    }
    
    if (!['add', 'subtract'].includes(type)) {
      return res.status(400).json({ message: 'Tipe transaksi tidak valid' });
    }
    
    // Update saldo user
    const updateQuery = type === 'add' 
      ? 'UPDATE users SET balance = balance + ? WHERE id = ?'
      : 'UPDATE users SET balance = balance - ? WHERE id = ?';
    
    await pool.query(updateQuery, [amount, id]);
    
    // Log aktivitas admin
    await pool.query(
      'INSERT INTO admin_activity_logs (admin_id, action, target_user_id, details) VALUES (?, ?, ?, ?)',
      [req.user.id, `${type}_balance`, id, JSON.stringify({ amount, description })]
    );
    
    res.json({ 
      message: `Saldo berhasil ${type === 'add' ? 'ditambah' : 'dikurangi'}`,
      amount: amount
    });
  } catch (error) {
    console.error('Error updating balance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint untuk reset PIN user
router.post('/users/:id/reset-pin', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Generate PIN baru (4 digit)
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPin = await bcrypt.hash(newPin, 10);
    
    // Update PIN user ke kolom password (bukan pin)
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPin, id]);
    
    // Log aktivitas admin
    await pool.query(
      'INSERT INTO admin_activity_logs (admin_id, action, target_user_id) VALUES (?, ?, ?)',
      [req.user.id, 'reset_pin', id]
    );
    
    res.json({ 
      message: 'PIN berhasil direset',
      newPin: newPin
    });
  } catch (error) {
    console.error('Error resetting PIN:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new user
router.post('/users', adminAuth, async (req, res) => {
  try {
    const { username, email, password, role_id, status = 'active', balance = 0 } = req.body;
    
    // Validasi input
    if (!username || !email || !password || !role_id) {
      return res.status(400).json({ message: 'Username, email, password, dan role wajib diisi' });
    }
    
    // Check if username already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username atau email sudah digunakan' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, role_id, status, balance, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [username, email, hashedPassword, role_id, status, balance]
    );
    
    // Log admin activity
    await pool.query(
      'INSERT INTO admin_activity_logs (admin_id, action, target_user_id, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'create_user', result.insertId, JSON.stringify({ username, email, role_id, status, balance })]
    );
    
    res.json({ 
      message: 'User berhasil ditambahkan',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user data
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, status } = req.body;
    
    // Validasi input
    if (!username || !email) {
      return res.status(400).json({ message: 'Username dan email wajib diisi' });
    }
    
    // Check if username/email already exists (exclude current user)
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
      [username, email, id]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username atau email sudah digunakan' });
    }
    
    // Update user
    await pool.query(
      'UPDATE users SET username = ?, email = ?, role = ?, status = ? WHERE id = ? AND role != "admin"',
      [username, email, role || 'user', status || 'active', id]
    );
    
    // Log aktivitas admin
    await pool.query(
      'INSERT INTO admin_activity_logs (admin_id, action, target_user_id, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'update_user', id, JSON.stringify({ username, email, role, status })]
    );
    
    res.json({ message: 'User berhasil diupdate' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Promotions Management
// Get all promotions
router.get('/promotions', adminAuth, async (req, res) => {
  try {
    const [promotions] = await pool.query(`
      SELECT * FROM promotions 
      ORDER BY created_at DESC
    `);
    res.json(promotions);
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create promotion
router.post('/promotions', adminAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      discount_percentage,
      min_purchase,
      max_discount,
      start_date,
      end_date,
      type,
      status,
      image_url
    } = req.body;

    const [result] = await pool.query(`
      INSERT INTO promotions (
        title, description, discount_percentage, min_purchase, 
        max_discount, start_date, end_date, type, status, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title, description, discount_percentage, min_purchase,
      max_discount, start_date, end_date, type, status || 'active', image_url
    ]);

    res.status(201).json({
      message: 'Promotion created successfully',
      promotionId: result.insertId
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update promotion
router.put('/promotions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      discount_percentage,
      min_purchase,
      max_discount,
      start_date,
      end_date,
      type,
      status,
      image_url
    } = req.body;

    await pool.query(`
      UPDATE promotions SET 
        title = ?, description = ?, discount_percentage = ?, 
        min_purchase = ?, max_discount = ?, start_date = ?, 
        end_date = ?, type = ?, status = ?, image_url = ?
      WHERE id = ?
    `, [
      title, description, discount_percentage, min_purchase,
      max_discount, start_date, end_date, type, status, image_url, id
    ]);

    res.json({ message: 'Promotion updated successfully' });
  } catch (error) {
    console.error('Error updating promotion:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete promotion
router.delete('/promotions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM promotions WHERE id = ?', [id]);
    res.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all reviews for admin
router.get('/reviews', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, product_id, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let queryParams = [];
    
    if (status) {
      whereClause += ' AND r.status = ?';
      queryParams.push(status);
    }
    
    if (product_id) {
      whereClause += ' AND r.product_id = ?';
      queryParams.push(product_id);
    }
    
    if (search) {
      whereClause += ' AND (u.username LIKE ? OR p.name LIKE ? OR r.review_text LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const [reviews] = await pool.query(`
      SELECT r.*, u.username, p.name as product_name, p.image_url as product_image
      FROM product_reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);
    
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total
      FROM product_reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      WHERE ${whereClause}
    `, queryParams);
    
    res.json({
      reviews,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit)
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update review status
router.put('/reviews/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    await pool.query(
      'UPDATE product_reviews SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    
    res.json({ message: 'Review status updated successfully' });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete review
router.delete('/reviews/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM product_reviews WHERE id = ?', [id]);
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get review statistics
router.get('/reviews/stats', adminAuth, async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_reviews,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reviews,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_reviews,
        AVG(rating) as average_rating
      FROM product_reviews
    `);
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint untuk mengambil pengaturan Tripay
router.get('/settings/tripay', adminAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM tripay_settings WHERE id = 1'
    );
    
    if (rows.length === 0) {
      // Jika belum ada pengaturan, return default
      return res.json({
        tripay_api_key: '',
        tripay_private_key: '',
        tripay_merchant_code: '',
        tripay_callback_url: '',
        tripay_environment: 'sandbox'
      });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching Tripay settings:', error);
    res.status(500).json({ message: 'Gagal mengambil pengaturan Tripay' });
  }
});

// Endpoint untuk menyimpan pengaturan Tripay
router.post('/settings/tripay', adminAuth, async (req, res) => {
  try {
    const {
      tripay_api_key,
      tripay_private_key,
      tripay_merchant_code,
      tripay_callback_url,
      tripay_environment
    } = req.body;

    // Cek apakah sudah ada pengaturan
    const [existing] = await pool.execute(
      'SELECT id FROM tripay_settings WHERE id = 1'
    );

    if (existing.length === 0) {
      // Insert baru
      await pool.execute(
        `INSERT INTO tripay_settings 
         (id, tripay_api_key, tripay_private_key, tripay_merchant_code, tripay_callback_url, tripay_environment, updated_at) 
         VALUES (1, ?, ?, ?, ?, ?, NOW())`,
        [tripay_api_key, tripay_private_key, tripay_merchant_code, tripay_callback_url, tripay_environment]
      );
    } else {
      // Update existing
      await pool.execute(
        `UPDATE tripay_settings SET 
         tripay_api_key = ?, tripay_private_key = ?, tripay_merchant_code = ?, 
         tripay_callback_url = ?, tripay_environment = ?, updated_at = NOW() 
         WHERE id = 1`,
        [tripay_api_key, tripay_private_key, tripay_merchant_code, tripay_callback_url, tripay_environment]
      );
    }

    res.json({ message: 'Pengaturan Tripay berhasil disimpan' });
  } catch (error) {
    console.error('Error saving Tripay settings:', error);
    res.status(500).json({ message: 'Gagal menyimpan pengaturan Tripay' });
  }
});

// Endpoint untuk test koneksi Tripay
router.post('/settings/tripay/test', adminAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM tripay_settings WHERE id = 1'
    );
    
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Pengaturan Tripay belum dikonfigurasi' });
    }
    
    const settings = rows[0];
    const baseUrl = settings.tripay_environment === 'production' 
      ? 'https://tripay.co.id/api' 
      : 'https://tripay.co.id/api-sandbox';
    
    // Test dengan mengambil daftar channel pembayaran
    const response = await axios.get(`${baseUrl}/merchant/payment-channel`, {
      headers: {
        'Authorization': `Bearer ${settings.tripay_api_key}`
      }
    });
    
    res.json({ message: 'Koneksi ke Tripay berhasil', data: response.data });
  } catch (error) {
    console.error('Error testing Tripay connection:', error);
    res.status(500).json({ message: 'Koneksi ke Tripay gagal' });
  }
});

module.exports = router;