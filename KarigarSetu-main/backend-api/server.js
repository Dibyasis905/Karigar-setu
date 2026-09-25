require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const artisanRoutes = require('./routes/artisanRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',').map(s => s.trim()) : true,
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => {
  res.json({ success: true, name: 'KarigarSetu API', message: 'Backend is running', health: '/api/health' });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'KarigarSetu API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'not-connected'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artisans', artisanRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

async function startServer() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing. Create backend-api/.env from .env.example.');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing. Create backend-api/.env from .env.example.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);

  app.listen(PORT, () => {
    console.log(`KarigarSetu API running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
