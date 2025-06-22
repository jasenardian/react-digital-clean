const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const promotionRoutes = require('./routes/promotions');
const topupRoutes = require('./routes/topup');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');
const cmsRoutes = require('./routes/cms'); // Tambahkan ini
const reviewRoutes = require('./routes/reviews');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/topup', topupRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cms', cmsRoutes); // Tambahkan ini
app.use('/api/reviews', reviewRoutes);


// Test route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Second registration (line 46)
app.use('/api/admin', require('./routes/admin'));