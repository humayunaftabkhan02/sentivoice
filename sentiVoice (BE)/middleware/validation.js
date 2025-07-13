const { body, param, validationResult } = require('express-validator');



// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// Sanitize and validate email
const sanitizeEmail = (field) => {
  return body(field)
    .trim()
    .toLowerCase()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format');
};

// Sanitize and validate username
const sanitizeUsername = (field) => {
  return body(field)
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens');
};

// Sanitize and validate password
const sanitizePassword = (field) => {
  return body(field)
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be 8-128 characters with at least one uppercase letter, one lowercase letter, and one number');
};

// Validate role
const validateRole = (field) => {
  return body(field)
    .trim()
    .toLowerCase()
    .isIn(['patient', 'therapist', 'admin'])
    .withMessage('Invalid role. Must be patient, therapist, or admin');
};

// Sanitize text input
const sanitizeText = (field, maxLength = 1000) => {
  return body(field)
    .trim()
    .isLength({ max: maxLength })
    .escape()
    .withMessage(`Text must be less than ${maxLength} characters`);
};

// Validate MongoDB ObjectId (URL parameter)
const validateObjectId = (field) => {
  return param(field)
    .isMongoId()
    .withMessage('Invalid ID format');
};

// Validate MongoDB ObjectId (request body)
const validateBodyObjectId = (field) => {
  return body(field)
    .isMongoId()
    .withMessage('Invalid ID format');
};

// Rate limiting helper
const rateLimit = require('express-rate-limit');

const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// File upload validation
const validateFileUpload = (fieldName, allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg'], maxSize = 10 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only audio files are allowed.' });
    }

    if (req.file.size > maxSize) {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }

    next();
  };
};

module.exports = {
  validate,
  sanitizeEmail,
  sanitizeUsername,
  sanitizePassword,
  validateRole,
  sanitizeText,
  validateObjectId,
  validateBodyObjectId,
  createRateLimit,
  validateFileUpload,
  body,
  param
}; 