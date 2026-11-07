const jwt = require('jsonwebtoken');

/**
 * authMiddleware
 * Express middleware to verify JWT from the Authorization header.
 * Attaches the decoded payload to req.user if valid.
 */
const authMiddleware = (req, res, next) => {
  // 1. Read Authorization header
  const authHeader = req.headers.authorization;

  // 2. Check if header exists and follows the 'Bearer <token>' format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Access denied. No token provided.',
    });
  }

  // 3. Extract the token
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      message: 'Access denied. Malformed token.',
    });
  }

  // 4. Safely check if JWT_SECRET is configured
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      message: 'Server error: JWT_SECRET is not configured.',
    });
  }

  // 5. Verify token and attach user payload to req.user
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token.',
    });
  }
};

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
