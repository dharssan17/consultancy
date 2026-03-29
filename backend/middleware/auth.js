const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        console.error('[AUTH] User not found for token:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      if (!req.user.isActive) {
        console.error('[AUTH] User account is deactivated:', req.user._id);
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated',
        });
      }

      // Ensure role is set (for existing users without role)
      if (!req.user.role) {
        console.log('[AUTH] User missing role, assigning default "data_entry":', req.user._id);
        req.user.role = 'data_entry';
        await req.user.save();
      }

      // Attach role to req.user for authorize middleware
      req.user.role = req.user.role || decoded.role || 'data_entry';

      console.log('[AUTH] User authenticated:', req.user._id, 'Role:', req.user.role);
      next();
    } catch (error) {
      console.error('[AUTH] Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      console.error('[AUTH] User or role missing in authorize middleware');
      return res.status(403).json({
        success: false,
        message: 'User role not found',
      });
    }

    if (!roles.includes(req.user.role)) {
      console.error('[AUTH] Unauthorized access attempt:', {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
      });
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    console.log('[AUTH] Authorized access:', {
      userId: req.user._id,
      role: req.user.role,
      path: req.path,
    });
    next();
  };
};

