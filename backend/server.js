const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to database (non-blocking)
connectDB().catch(err => {
  console.error('Database connection failed, but server will continue...');
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[SERVER] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/productions', require('./routes/productionRoutes'));
app.use('/api/deliveries', require('./routes/deliveryRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/yarn-suppliers', require('./routes/yarnSupplierRoutes'));
app.use('/api/yarn-purchases', require('./routes/yarnPurchaseRoutes'));
app.use('/api/yarn-returns', require('./routes/yarnReturnRoutes'));
// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.stack);
  console.error('[SERVER ERROR] Message:', err.message);
  console.error('[SERVER ERROR] Route:', req.method, req.path);
  
  const errorMessage = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'An error occurred while processing your request';
  
  res.status(err.status || 500).json({ 
    success: false, 
    message: errorMessage,
    ...(process.env.NODE_ENV === 'development' && { error: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[SERVER] ✅ Server running on port ${PORT}`);
  console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[SERVER] API Base URL: http://localhost:${PORT}/api`);
  console.log(`[SERVER] Health Check: http://localhost:${PORT}/api/health`);
});

