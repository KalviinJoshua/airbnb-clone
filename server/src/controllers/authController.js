const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

/**
 * loginUser
 * Async controller for user authentication.
 * Expects req.body with email, password.
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate that both email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.',
      });
    }

    // 2. Normalize email: convert to lowercase and trim whitespace
    const normalizedEmail = email.trim().toLowerCase();

    // 3. Find user by email and explicitly select the password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    // 4. Compare provided password with hashed password in database
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    // 5. Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: 'JWT_SECRET is not configured on the server.',
      });
    }

    // 6. Generate JWT token with user ID and role, expiring in 7 days
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 7. Return 200 with token and user details (excluding password)
    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // Pass unexpected errors to the global error-handling middleware
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
};
