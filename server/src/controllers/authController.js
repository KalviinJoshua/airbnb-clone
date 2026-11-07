const bcrypt = require('bcryptjs');
const User = require('../models/User.js');

/**
 * registerUser
 * Async controller for user registration.
 * Expects req.body with name, email, password.
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate that all fields are provided
    if (!name || !email || !password) {
      const error = new Error('Name, email, and password are required.');
      error.statusCode = 400;
      return next(error);
    }

    // 2. Validate password length (min 8 characters)
    if (password.length < 8) {
      const error = new Error('Password must be at least 8 characters long.');
      error.statusCode = 400;
      return next(error);
    }

    // Normalize email: trim whitespace and convert to lowercase
    const normalizedEmail = email.trim().toLowerCase();

    // 3. Check if the email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        message: 'Email already registered.',
      });
    }

    // 4. Hash the password with 12 salt rounds
    const hashedPassword = await bcrypt.hash(password, 12);

    // 5. Create and save the new user
    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    await newUser.save();

    // 6. Return 201 with user data (password excluded by schema)
    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    // Handle MongoDB duplicate-key error (11000) for the email unique index
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Email already registered.',
      });
    }
    // Pass all other errors to the error-handling middleware
    next(error);
  }
};

module.exports = {
  registerUser,
};
