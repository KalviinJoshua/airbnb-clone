const express = require('express');
const {
  registerUser,
  loginUser,
  upgradeToHost,
} = require('../controllers/authController.js');
const authMiddleware = require('../middleware/authMiddleware.js');

const router = express.Router();

// POST /register - create a new user account (public registrations default to 'user')
router.post('/register', registerUser);

// POST /login - authenticate user and return token
router.post('/login', loginUser);

// POST /upgrade-to-host - administrative/authenticated elevation to 'host'
router.post('/upgrade-to-host', authMiddleware, upgradeToHost);

module.exports = router;
