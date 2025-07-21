const jwt = require('jsonwebtoken');
const User = require('../models/dataModel');
const SystemSettings = require('../models/systemSettingsModel');

// JWT secret should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Warn if using default secret in production
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  WARNING: Using default JWT secret in production. Set JWT_SECRET environment variable!');
}

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      username: user.username, 
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      sessionVersion: user.sessionVersion || 0
    },
    JWT_SECRET,
    { 
      expiresIn: '24h',
      issuer: 'sentivoice-api',
      audience: 'sentivoice-users'
    }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'sentivoice-api',
      audience: 'sentivoice-users'
    });
  } catch (error) {
    return null;
  }
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    console.log('🔐 Authenticating request:', {
      method: req.method,
      url: req.url,
      headers: {
        authorization: req.headers.authorization ? 'Bearer [TOKEN]' : 'None',
        'content-type': req.headers['content-type']
      }
    });

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No Bearer token found');
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      console.log('❌ Invalid or expired token');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    console.log('✅ Token verified for user:', decoded.username);

    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('❌ User not found:', decoded.id);
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      console.log('❌ Email not verified for user:', user.username);
      return res.status(403).json({ error: 'Email not verified' });
    }

    // Check if therapist is approved
    if (user.role === 'therapist' && !user.isTherapistApproved) {
      console.log('❌ Therapist not approved:', user.username);
      return res.status(403).json({ error: 'Therapist account pending approval' });
    }

    // Check if user is suspended
    if (user.isActive === false) {
      console.log('❌ User suspended:', user.username);
      return res.status(403).json({ error: 'Your account has been suspended by an administrator. Please contact support for assistance.' });
    }

    // Check session version (for force logout)
    const tokenSessionVersion = decoded.sessionVersion || 0;
    const userSessionVersion = user.sessionVersion || 0;
    
    if (tokenSessionVersion < userSessionVersion) {
      console.log('❌ Session invalidated (user suspended/activated):', user.username);
      return res.status(401).json({ 
        error: 'Your session has been invalidated. Please log in again.',
        code: 'SESSION_INVALIDATED'
      });
    }

    console.log('✅ Authentication successful for user:', user.username);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('Authentication error:', error.message);
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (decoded) {
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.isEmailVerified) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Maintenance mode middleware
const checkMaintenanceMode = async (req, res, next) => {
  try {
    const settings = await SystemSettings.findOne();
    if (settings && settings.maintenanceMode) {
      // Check if user is admin (if authenticated)
      let isAdmin = false;
      if (req.user && req.user.role === 'admin') {
        isAdmin = true;
      }
      // Allow admin, block others
      if (!isAdmin) {
        return res.status(503).json({
          maintenance: true,
          message: settings.maintenanceMessage || 'System is under maintenance. Please try again later.'
        });
      }
    }
    next();
  } catch (err) {
    console.error('Error checking maintenance mode:', err);
    // Fail open (allow access) if error
    next();
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
  optionalAuth,
  JWT_SECRET,
  checkMaintenanceMode
}; 