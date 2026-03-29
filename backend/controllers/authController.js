const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'data_entry',
    });

    // Generate token with role
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('[LOGIN] Login attempt for email:', email);

    // Validation
    if (!email || !password) {
      console.log('[LOGIN] Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('[LOGIN] User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    console.log('[LOGIN] User found:', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });

    // Check if user is active
    if (!user.isActive) {
      console.log('[LOGIN] User account is deactivated:', user._id);
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated',
      });
    }

    // Ensure user has a role (for existing users without role)
    if (!user.role) {
      console.log('[LOGIN] User missing role, assigning default "data_entry":', user._id);
      user.role = 'data_entry';
      await user.save();
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log('[LOGIN] Password mismatch for user:', user._id);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    console.log('[LOGIN] Password verified successfully');

    // Generate token with role (ensure role is set)
    const userRole = user.role || 'data_entry';
    const token = generateToken(user._id, userRole);

    console.log('[LOGIN] Login successful for user:', {
      id: user._id,
      username: user.username,
      role: userRole,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: userRole,
        },
        token,
      },
    });
  } catch (error) {
    console.error('[LOGIN] Login error:', error);
    console.error('[LOGIN] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

