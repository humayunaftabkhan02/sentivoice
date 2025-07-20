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
  
  body('email')
    .optional()
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Invalid email format')
    .custom((value) => {
      const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'live.com', 'sentivoice.com'];
      const disposableDomains = ['mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com'];
      console.log('validateProfileUpdate email:', value, 'allowed:', allowedDomains);
      if (!allowedDomains.some(domain => value.endsWith(domain))) {
        throw new Error('Email domain is not supported');
      }
      if (disposableDomains.some(domain => value.endsWith(domain))) {
        throw new Error('Temporary email addresses are not allowed');
      }
      return true;
    }),
  
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
  
  body('height')
    .optional()
    .isFloat({ min: 50, max: 250 })
    .withMessage('Height must be between 50-250 cm'),
  
  body('weight')
    .optional()
    .isFloat({ min: 20, max: 300 })
    .withMessage('Weight must be between 20-300 kg'),
  
  body('gender')
    .optional()
    .isIn(['Male', 'Female'])
    .withMessage('Gender must be either Male or Female'),
  
  body('contact')
    .optional()
    .custom((value) => {
      if (value) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          throw new Error('Invalid phone number format');
        }
      }
      return true;
    }),
  
  body('emergencyContact')
    .optional()
    .custom((value) => {
      if (value) {
        try {
          const contact = typeof value === 'string' ? JSON.parse(value) : value;
          if (contact.name && contact.name.length > 50) {
            throw new Error('Emergency contact name must be less than 50 characters');
          }
          if (contact.phone) {
            const phoneRegex = /^\+?[1-9]\d{1,14}$/;
            if (!phoneRegex.test(contact.phone.replace(/\s/g, ''))) {
              throw new Error('Invalid emergency contact phone number');
            }
          }
        } catch (e) {
          throw new Error('Invalid emergency contact data');
        }
      }
      return true;
    }),
  
  body('allergies')
    .optional()
    .custom((value) => {
      if (value) {
        try {
          const allergies = typeof value === 'string' ? JSON.parse(value) : value;
          if (!Array.isArray(allergies)) {
            throw new Error('Allergies must be an array');
          }
          for (const allergy of allergies) {
            if (allergy.length < 2 || allergy.length > 100) {
              throw new Error('Allergy must be 2-100 characters');
            }
          }
        } catch (e) {
          throw new Error('Invalid allergies data');
        }
      }
      return true;
    }),
  
  body('currentMedications')
    .optional()
    .custom((value) => {
      if (value) {
        try {
          const medications = typeof value === 'string' ? JSON.parse(value) : value;
          if (!Array.isArray(medications)) {
            throw new Error('Current medications must be an array');
          }
          for (const medication of medications) {
            if (medication.length < 2 || medication.length > 100) {
              throw new Error('Medication must be 2-100 characters');
            }
          }
        } catch (e) {
          throw new Error('Invalid medications data');
        }
      }
      return true;
    }),
  
  body('medicalConditions')
    .optional()
    .custom((value) => {
      if (value) {
        try {
          const conditions = typeof value === 'string' ? JSON.parse(value) : value;
          if (!Array.isArray(conditions)) {
            throw new Error('Medical conditions must be an array');
          }
          for (const condition of conditions) {
            if (condition.length < 2 || condition.length > 100) {
              throw new Error('Medical condition must be 2-100 characters');
            }
          }
        } catch (e) {
          throw new Error('Invalid medical conditions data');
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