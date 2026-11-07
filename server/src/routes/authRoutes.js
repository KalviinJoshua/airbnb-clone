const express = require('express');
const { registerUser } = require('../controllers/authController.js');

const router = express.Router();

// POST /register - create a new user account
router.post('/register', registerUser);

module.exports = router;
