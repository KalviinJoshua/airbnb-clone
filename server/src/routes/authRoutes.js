const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController.js');

const router = express.Router();

// POST /register - create a new user account
router.post('/register', registerUser);

// POST /login - authenticate user and return token
router.post('/login', loginUser);

module.exports = router;
