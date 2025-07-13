const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:     { type: String, required: true, enum: ['patient', 'therapist', 'admin'] },

    // ← NEW field – therapists start life un-approved
    isTherapistApproved: {
      type: Boolean,
      default: function () {
        return this.role !== 'therapist';
      }
    },

    // ← NEW fields for email verification
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      default: null
    },
    emailVerificationExpires: {
      type: Date,
      default: null
    },

    // ← NEW fields for password reset
    passwordResetToken: {
      type: String,
      default: null
    },
    passwordResetExpires: {
      type: Date,
      default: null
    },

    // ← NEW field for account suspension
    isActive: {
      type: Boolean,
      default: true
    },

    // ← NEW fields for session management
    sessionVersion: {
      type: Number,
      default: 0
    },
    lastSuspendedAt: {
      type: Date,
      default: null
    },

    info: {
      // Basic Information
      firstName: String,
      lastName: String,
      age: Number,
      gender: String,
      diagnosis: String,
      contact: String,

      // Patient-specific comprehensive fields
      dateOfBirth: String,
      bloodType: String,
      height: Number, // in cm
      weight: Number, // in kg
      allergies: [String],
      currentMedications: [String],
      medicalConditions: [String],
      previousTherapy: String,
      therapyGoals: String,
      
      // Emergency Contact Information
      emergencyContact: {
        name: { type: String, default: '' },
        relationship: { type: String, default: '' },
        phone: { type: String, default: '' }
      },

      // Insurance & Payment Information
      insuranceProvider: String,
      insuranceNumber: String,
      preferredPaymentMethod: String,

      // Preferences
      preferredLanguage: String,
      communicationPreferences: String,
      sessionPreferences: String,

      // Therapist Professional Information
      specialization: String,
      experience: String, // Years of experience
      education: String, // Educational background
      certifications: String, // Professional certifications and licenses
      bio: String, // Professional bio/description
      languages: String, // Languages spoken

      // Contact Information
      phone: String,
      address: String,

      // Profile Picture
      profilePicture: String, // Base64 encoded image or file path

      // Availability
      availableSlots: [
        {
          day: String,
          start: String,
          end: String
        }
      ],

      // Patient-specific fields
      pastSessionSummary: {
        emotion: { type: String, default: '' },
        note: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now }
      },

      therapyPlan: [
        {
          step: { type: String, default: '' },
          timestamp: { type: Date, default: Date.now }
        }
      ]
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);