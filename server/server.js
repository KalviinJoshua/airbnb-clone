const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const validateEnv = require('./src/config/validateEnv');
const authRoutes = require('./src/routes/authRoutes');
const listingRoutes = require('./src/routes/listingRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');

// 1. Load environment variables first
dotenv.config();

// 2. Validate environment configuration immediately on startup
validateEnv();

const app = express();

// ---------------------------------------------------------------------------
// Production-Ready CORS Configuration
// ---------------------------------------------------------------------------

// Support single origin, comma-separated list of origins, or dev fallback
const rawCorsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = rawCorsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server health checks, curl, mobile apps)
      if (!origin) {
        return callback(null, true);
      }

      // Check against configured allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow wildcard ONLY in development
      if (!isProduction && allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      // Origin rejected
      const error = new Error(`CORS policy blocked access from origin: ${origin}`);
      error.statusCode = 403;
      return callback(error);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// ---------------------------------------------------------------------------
// Request Parsing
// ---------------------------------------------------------------------------

// 10kb body limit prevents oversized payload attacks
app.use(express.json({ limit: '10kb' }));

// ---------------------------------------------------------------------------
// Health Check Endpoints
// ---------------------------------------------------------------------------

// Basic API root response
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Airbnb Clone API is running.',
    docs: '/api/health',
  });
});

// Comprehensive health-check endpoint (for Render / uptime monitors)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  const healthData = {
    status: isDbConnected ? 'ok' : 'degraded',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: isDbConnected ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
  };

  const statusCode = isDbConnected ? 200 : 503;
  res.status(statusCode).json(healthData);
});

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);

// ---------------------------------------------------------------------------
// 404 Not Found Handler
// ---------------------------------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ---------------------------------------------------------------------------
// Global Error Handler
// ---------------------------------------------------------------------------

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  // In production, mask internal server errors and do not leak stack traces
  const response = {
    message:
      statusCode >= 500 && isProduction
        ? 'Internal Server Error. Please try again later.'
        : err.message || 'Internal Server Error',
  };

  // Include stack traces only in non-production environments
  if (!isProduction && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

// ---------------------------------------------------------------------------
// Server Startup & Graceful Shutdown
// ---------------------------------------------------------------------------

const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

// Graceful shutdown on termination signals
const handleGracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await mongoose.connection.close(false);
        console.log('MongoDB connection closed.');
      } catch (closeErr) {
        console.error('Error closing MongoDB connection:', closeErr);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

if (require.main === module) {
  startServer();
}

module.exports = app;
