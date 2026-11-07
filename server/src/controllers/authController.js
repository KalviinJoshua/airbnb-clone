const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

/**
 * Helper to check whether an email or secret qualifies for host privileges
 */
const isAuthorizedForHostRole = (email, secretCode) => {
  // 1. Check if matching the configured host registration secret
  const configuredSecret = process.env.HOST_REGISTRATION_SECRET;
  if (configuredSecret && secretCode && secretCode.trim() === configuredSecret.trim()) {
    return true;
  }

  // 2. Check if the user's email is on the explicitly whitelisted host list
  const trustedEmailsRaw = process.env.TRUSTED_HOST_EMAILS || '';
  const trustedEmails = trustedEmailsRaw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (trustedEmails.length > 0 && trustedEmails.includes(email.toLowerCase())) {
    return true;
  }

  return false;
};

/**
 * registerUser
 * Controller for user registration.
 *
 * Security Fix: Public registration strictly defaults to 'user' (guest) role.
 * Host elevation requires either a valid hostSecretCode or an email pre-whitelisted
 * in TRUSTED_HOST_EMAILS in the environment configuration.
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, hostSecretCode } = req.body;

    // 1. Validate that all required fields are provided and are valid strings
    if (
      !name ||
      typeof name !== 'string' ||
      !email ||
      typeof email !== 'string' ||
      !password ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        message: 'Name, email, and password are required strings.',
      });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      return res.status(400).json({
        message: 'Name cannot be blank.',
      });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: 'Please provide a valid email address.',
      });
    }

    // 2. Validate password length (min 8 characters)
    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long.',
      });
    }

    // 3. Determine role safely:
    // Arbitrary role submissions cannot grant host access.
    // Host credentials must be verified before making any database queries.
    let assignedRole = 'user';

    if (role === 'host' || hostSecretCode) {
      if (isAuthorizedForHostRole(normalizedEmail, hostSecretCode)) {
        assignedRole = 'host';
      } else {
        // If the client explicitly requested host without valid credentials
        return res.status(403).json({
          message:
            'Host authorization failed. A valid host passcode or pre-approved email is required to register with the host role.',
        });
      }
    }

    // 4. Check if the email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        message: 'Email already registered.',
      });
    }

    // 5. Hash the password with 12 salt rounds
    const hashedPassword = await bcrypt.hash(password, 12);

    // 6. Create and save the new user
    const newUser = new User({
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
    });

    await newUser.save();

    // 7. Return 201 with created user data
    return res.status(201).json({
      message:
        assignedRole === 'host'
          ? 'Host account registered successfully.'
          : 'User registered successfully.',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Email already registered.',
      });
    }
    next(error);
  }
};

/**
 * loginUser
 * Controller for user authentication.
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate that both email and password are provided as strings
    if (
      !email ||
      typeof email !== 'string' ||
      !password ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        message: 'Email and password are required strings.',
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
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
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
    next(error);
  }
};

/**
 * upgradeToHost
 * Protected route controller allowing an authenticated guest user to elevate to the host role.
 * Requires either a valid hostSecretCode or an email listed in TRUSTED_HOST_EMAILS.
 */
const upgradeToHost = async (req, res, next) => {
  try {
    const { hostSecretCode } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User account not found.',
      });
    }

    if (user.role === 'host') {
      return res.status(200).json({
        message: 'Account is already configured as a Host.',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    // Validate authorization
    if (!isAuthorizedForHostRole(user.email, hostSecretCode)) {
      return res.status(403).json({
        message:
          'Invalid host passcode. Please verify your administrative host credentials to unlock hosting privileges.',
      });
    }

    // Elevate role
    user.role = 'host';
    await user.save();

    // Issue refreshed JWT token reflecting the updated role
    const newToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      message: 'Account successfully upgraded to Host! You can now create and manage property listings.',
      token: newToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  upgradeToHost,
};
