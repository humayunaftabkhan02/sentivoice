const { body, param, validationResult } = require('express-validator');

// Helper function to validate phone numbers using libphonenumber-js
const validatePhoneNumber = (phone, countryCode) => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: "Phone number is required" };
  }

  try {
    // Add + prefix if not present
    const phoneWithPlus = phone.startsWith('+') ? phone : `+${phone}`;
    
    // Parse the phone number with the country code
    const phoneNumber = require('libphonenumber-js').parsePhoneNumberFromString(phoneWithPlus, countryCode);
    
    if (!phoneNumber) {
      return { isValid: false, error: "Invalid phone number format" };
    }

    // Check if the number is valid for the specific country
    if (!phoneNumber.isValid()) {
      return { isValid: false, error: "Phone number is not valid for the selected country" };
    }

    // Get the formatted international number
    const formattedNumber = phoneNumber.format('E.164'); // +1234567890 format

    // Additional validation for specific countries with known length requirements
    const nationalNumber = phoneNumber.nationalNumber;
    const cleanNumber = nationalNumber.replace(/\D/g, '');
    
    // Country-specific length validation
    const countryLengths = {
      'US': 10,
      'CA': 10,
      'GB': [10, 11],
      'NO': 8,
      'PK': 10,
      'AU': 9,
      'DE': [10, 11, 12],
      'FR': 10,
      'IN': 10,
      'BR': [10, 11],
      'IT': [9, 10],
      'ES': 9,
      'NL': 9,
      'SE': 9,
      'DK': 8,
      'FI': 9,
      'CH': 9,
      'AT': [10, 11, 12, 13],
      'BE': 9,
      'IE': 9,
      'NZ': 9,
      'ZA': 9,
      'MX': 10,
      'AR': 10,
      'CL': 9,
      'CO': 10,
      'PE': 9,
      'VE': 10,
      'EG': 10,
      'SA': 9,
      'AE': 9,
      'QA': 8,
      'KW': 8,
      'BH': 8,
      'OM': 8,
      'JO': 9,
      'LB': 8,
      'SY': 9,
      'IQ': 10,
      'IR': 10,
      'TR': 10,
      'IL': 9,
      'TH': 9,
      'VN': 10,
      'MY': 9,
      'SG': 8,
      'PH': 10,
      'ID': 9,
      'JP': 10,
      'KR': 10,
      'CN': 11,
      'TW': 9,
      'HK': 8,
      'MO': 8
    };

    const expectedLength = countryLengths[countryCode?.toUpperCase()];
    if (expectedLength && countryCode) {
      const countryCodeStr = String(countryCode).toUpperCase();
      if (Array.isArray(expectedLength)) {
        if (!expectedLength.includes(cleanNumber.length)) {
          return { 
            isValid: false, 
            error: `Phone number must be ${expectedLength.join(' or ')} digits for ${countryCodeStr}` 
          };
        }
      } else {
        if (cleanNumber.length !== expectedLength) {
          return { 
            isValid: false, 
            error: `Phone number must be exactly ${expectedLength} digits for ${countryCodeStr}` 
          };
        }
      }
    }

    return { isValid: true, error: null, formattedNumber: formattedNumber };

  } catch (error) {
    console.error('Phone validation error:', error);
    return { isValid: false, error: "Invalid phone number format" };
  }
};

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
  const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'live.com', 'sentivoice.com'];
  const disposableDomains = ['mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com'];
  
  return body(field)
    .trim()
    .toLowerCase()
    .isEmail()
    .normalizeEmail()
    .custom((value) => {
      const domain = value.split('@')[1];
      console.log('sanitizeEmail domain:', domain, 'allowed:', allowedDomains);
      if (!allowedDomains.includes(domain)) {
        throw new Error('Email domain is not supported');
      }
      if (disposableDomains.includes(domain)) {
        throw new Error('Temporary email addresses are not allowed');
      }
      return true;
    })
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
    .isLength({ min: 8, max: 50 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must be 8-50 characters with at least one uppercase letter, one lowercase letter, one number, and one symbol (@$!%*?&)');
};

// Validate role
const validateRole = (field) => {
  return body(field)
    .trim()
    .toLowerCase()
    .isIn(['patient', 'therapist', 'admin'])
    .withMessage('Invalid role. Must be patient, therapist, or admin');
};

// Profile update validation
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[A-Za-z]+(?:\s*[A-Za-z]+)*$/)
    .withMessage('First name can contain letters and spaces only'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[A-Za-z]+(?:\s*[A-Za-z]+)*$/)
    .withMessage('Last name can contain letters and spaces only'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const today = new Date();
      const birthDate = new Date(value);
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (birthDate > today) {
        throw new Error('Date of birth cannot be in the future');
      }
      if (age < 1) {
        throw new Error('Age must be at least 1 year');
      }
      if (age > 120) {
        throw new Error('Age cannot exceed 120 years');
      }
      return true;
    }),
  
  body('gender')
    .optional()
    .isIn(['Male', 'Female'])
    .withMessage('Gender must be either Male or Female'),
  
  body('contact')
    .optional()
    .custom((value) => {
      if (value) {
        const validation = validatePhoneNumber(value, 'US'); // Default to US for validation
        if (!validation.isValid) {
          throw new Error(validation.error);
        }
      }
      return true;
    }),
  
  body('phone')
    .optional()
    .custom((value) => {
      if (value) {
        const validation = validatePhoneNumber(value, 'US'); // Default to US for validation
        if (!validation.isValid) {
          throw new Error(validation.error);
        }
      }
      return true;
    })
];

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
  validateProfileUpdate,
  sanitizeText,
  validateObjectId,
  validateBodyObjectId,
  createRateLimit,
  validateFileUpload,
  body,
  param
}; 