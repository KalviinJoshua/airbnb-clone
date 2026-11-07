const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

// Load environment variables first — must happen before anything reads process.env
dotenv.config();

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// Restrict CORS to the frontend origin defined in .env (open to all in dev fallback)
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Parse JSON request bodies — 10kb limit prevents oversized payload attacks
app.use(express.json({ limit: '10kb' }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Health check — confirms the API is reachable
app.get('/', (req, res) => {
  res.json({ message: 'Airbnb Clone API is running.' });
});

// 404 handler — catches any request to an undefined route
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// Global error handler — catches errors passed via next(err) from any route
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
  });
});

// ---------------------------------------------------------------------------
// Start server only after a successful database connection
// ---------------------------------------------------------------------------

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB(); // If this fails, process.exit(1) is called inside connectDB
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
