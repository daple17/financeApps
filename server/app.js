const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const coaRoutes = require('./routes/coaRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const jobOrderRoutes = require('./routes/jobOrderRoutes');
const businessPartnerRoutes = require('./routes/masterData/businessPartnerRoutes');
const locationRoutes = require('./routes/masterData/locationRoutes');
const logisticsRoutes = require('./routes/masterData/logisticsRoutes');
const resourceRoutes = require('./routes/masterData/resourceRoutes');
const operationRoutes = require('./routes/operationRoutes');

const app = express();

// Middlewares
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL || false) // if not set, blocks CORS
    : '*',
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger (Development)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Base API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/coa', coaRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/approvals', approvalRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/job-orders', jobOrderRoutes);
app.use('/api/v1/master-data/business-partners', businessPartnerRoutes);
app.use('/api/v1/master-data/locations', locationRoutes);
app.use('/api/v1/master-data/logistics', logisticsRoutes);
app.use('/api/v1/master-data/resources', resourceRoutes);
app.use('/api/v1/operations', operationRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Financial Management API Service is healthy and running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, '../client/dist')));

// Global 404 Handler for API routes
app.use('/api', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot find route ${req.originalUrl} on this server`
  });
});

// Catch-all to serve React SPA for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Global Error Handler]:', err.stack);
  } else {
    console.error('[Global Error Handler]:', err.message);
  }
  
  const message = process.env.NODE_ENV === 'production' && !err.statusCode 
    ? 'Internal Server Error' 
    : err.message || 'Internal Server Error';

  res.status(err.statusCode || 500).json({
    status: 'error',
    message: message
  });
});

module.exports = app;
