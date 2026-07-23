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

const app = express();

// Middlewares
app.use(cors());
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

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Financial Management API Service is healthy and running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

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
  console.error('[Global Error Handler]:', err.stack);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
