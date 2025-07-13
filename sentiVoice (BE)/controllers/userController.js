// controllers/userController.js
const User   = require('../models/dataModel');
const bcrypt = require('bcrypt');
const emailService = require('../services/emailService');
const { generateToken } = require('../middleware/auth');

/* ──────────────────────────────────────────────────────────
   SIGN-UP
─────────────────────────────────────────────────────────── */
exports.signup = async (req, res) => {
  try {
    const { username, email, password, role, firstName, lastName } = req.body;

    /* 1️⃣  normalise role once … */
    const cleanRole = String(role || '').trim().toLowerCase();   // ‹— extra safety

    /* 2️⃣  duplicate-e-mail guard */
    if (await User.findOne({ email }))
      return res.status(409).json({ error: 'Email already in use' });

    /* 3️⃣  hash password */
    const hashed = await bcrypt.hash(password, 10);

    /* 4️⃣  generate verification token */
    const verificationToken = emailService.generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    /* 5️⃣  create user with verification fields
           ────────────────────────────────────────
           • every therapist gets isTherapistApproved:false
           • other roles omit the flag (so schema default applies) */
    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password: hashed,
      role    : cleanRole,
      isTherapistApproved: cleanRole === 'therapist' ? false : undefined,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      info: {
        firstName: firstName?.trim() || '',
        lastName: lastName?.trim() || ''
      }
    });

    await newUser.save();

    /* 6️⃣  send verification email */
    const emailSent = await emailService.sendVerificationEmail(
      email, 
      verificationToken, 
      username
    );

    if (!emailSent) {
      return res.status(201).json({
        message: 'Account created but verification email failed to send. Please contact support.',
        emailError: true
      });
    }

    return res.status(201).json({ 
      message: 'Account created successfully. Please check your email for verification.',
      email: email
    });

  } catch (err) {
            if (process.env.NODE_ENV === 'development') {
          console.error('Error signing up user:', err.message);
        }
    return res.status(500).json({ error: 'Error signing up user' });
  }
};

/* ──────────────────────────────────────────────────────────
   LOGIN
─────────────────────────────────────────────────────────── */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Use same error message to prevent user enumeration
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    /* ⛔ block unverified users */
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email address before logging in.',
        emailNotVerified: true,
        email: user.email
      });
    }

    /* ⛔ block therapists that are still pending */
    if (user.role === 'therapist' && user.isTherapistApproved === false)
      return res.status(403).json({ error: 'Your account is pending admin approval.' });

    /* ⛔ block suspended users */
    if (user.isActive === false)
      return res.status(403).json({ error: 'Your account has been suspended by an administrator. Please contact support for assistance.' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      // Use same error message to prevent user enumeration
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    
    // Create full name from firstName and lastName
    const fullName = user.info?.firstName && user.info?.lastName 
      ? `${user.info.firstName} ${user.info.lastName}`
      : user.info?.firstName || user.info?.lastName || user.username;
    
    return res.status(200).json({
      message : 'OK',
      role    : user.role,
      username: user.username,
      firstName: user.info?.firstName || '',
      lastName: user.info?.lastName || '',
      fullName: fullName,
      isTherapistApproved: user.isTherapistApproved,
      token   : token
    });

  } catch (err) {
            if (process.env.NODE_ENV === 'development') {
          console.error('Error logging in user:', err.message);
        }
    return res.status(500).json({ error: 'Error logging in user' });
  }
};

/* ──────────────────────────────────────────────────────────
   EMAIL VERIFICATION
─────────────────────────────────────────────────────────── */
exports.verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.body;

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Email verification attempt:', { email, token: token ? `${token.substring(0, 10)}...` : 'null' });
    }

    if (!token || !email) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Missing token or email:', { hasToken: !!token, hasEmail: !!email });
      }
      return res.status(400).json({ error: 'Token and email are required' });
    }

    // Find user by email and token
    const user = await User.findOne({
      email: email.toLowerCase(),
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 User lookup result:', { 
        found: !!user, 
        email: email.toLowerCase(),
        hasToken: !!user?.emailVerificationToken,
        tokenMatch: user?.emailVerificationToken === token,
        tokenExpired: user?.emailVerificationExpires < new Date()
      });
    }

    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired verification token' 
      });
    }

    // Update user as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Email verified successfully for:', email);
    }

    res.json({ 
      message: 'Email verified successfully',
      username: user.username,
      role: user.role
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Email verification error:', error.message);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/* ──────────────────────────────────────────────────────────
   RESEND VERIFICATION EMAIL
─────────────────────────────────────────────────────────── */
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = emailService.generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send new verification email
    const emailSent = await emailService.sendResendVerificationEmail(
      email, 
      verificationToken, 
      user.username
    );

    if (!emailSent) {
      return res.status(500).json({ 
        error: 'Failed to send verification email. Please try again later.' 
      });
    }

    res.json({ message: 'Verification email sent successfully' });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Resend verification error:', error.message);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/* ──────────────────────────────────────────────────────────
   FORGOT PASSWORD
─────────────────────────────────────────────────────────── */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({ 
        message: 'If an account with this email exists, a password reset link has been sent.' 
      });
    }

    // Generate password reset token
    const resetToken = emailService.generateVerificationToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send password reset email
    const emailSent = await emailService.sendPasswordResetEmail(
      email, 
      resetToken, 
      user.username
    );

    if (!emailSent) {
      return res.status(500).json({ 
        error: 'Failed to send password reset email. Please try again later.' 
      });
    }

    res.json({ 
      message: 'If an account with this email exists, a password reset link has been sent.' 
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Forgot password error:', error.message);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/* ──────────────────────────────────────────────────────────
   RESET PASSWORD
─────────────────────────────────────────────────────────── */
exports.resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
      return res.status(400).json({ error: 'Token, email, and new password are required' });
    }

    // Find user by email and token
    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired reset token' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({ 
      message: 'Password reset successfully. You can now login with your new password.' 
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Reset password error:', error.message);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/* ──────────────────────────────────────────────────────────
   PUBLIC PROFILE
─────────────────────────────────────────────────────────── */
exports.getUserInfo = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Debug: Log the therapy plan data
    console.log('🔍 getUserInfo - Therapy plan for user:', username, {
      therapyPlan: user.info?.therapyPlan,
      therapyPlanLength: user.info?.therapyPlan?.length || 0
    });
    
    // Ensure email is included in the response
    const userResponse = {
      ...user.toObject(),
      info: {
        ...user.info,
        email: user.email // Include email in user info
      }
    };
    
    return res.status(200).json({ user: userResponse });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching user info:', err.message);
    }
    return res.status(500).json({ error: 'Server error' });
  }
};

/* ──────────────────────────────────────────────────────────
   UPDATE PROFILE
─────────────────────────────────────────────────────────── */
exports.updateProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const data = req.body;

    console.log('🔍 Update Profile Request:');
    console.log('Username:', username);
    console.log('Request body:', data);
    console.log('Request files:', req.file);

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.info) user.info = {};

    /* Helper function to parse JSON strings from FormData */
    const parseFormDataField = (value) => {
      if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      }
      return value;
    };

    /* Update all profile fields */
    const fields = [
      'firstName', 'lastName', 'specialization', 'availableSlots',
      'age', 'gender', 'diagnosis', 'contact',
      // New therapist fields
      'experience', 'education', 'certifications', 'bio',
      'phone', 'address', 'languages',
      // New patient fields
      'dateOfBirth', 'bloodType', 'height', 'weight',
      'previousTherapy', 'therapyGoals', 'insuranceProvider',
      'insuranceNumber', 'preferredPaymentMethod', 'preferredLanguage',
      'communicationPreferences', 'sessionPreferences'
    ];
    
    fields.forEach(f => { 
      if (data[f] !== undefined) {
        user.info[f] = parseFormDataField(data[f]);
        console.log(`✅ Updated ${f}:`, user.info[f]);
      }
    });

    /* Handle arrays for patient medical information */
    if (data.allergies !== undefined) {
      const parsedAllergies = parseFormDataField(data.allergies);
      user.info.allergies = Array.isArray(parsedAllergies) ? parsedAllergies : [];
      console.log('✅ Updated allergies:', user.info.allergies);
    }

    if (data.currentMedications !== undefined) {
      const parsedMedications = parseFormDataField(data.currentMedications);
      user.info.currentMedications = Array.isArray(parsedMedications) ? parsedMedications : [];
      console.log('✅ Updated current medications:', user.info.currentMedications);
    }

    if (data.medicalConditions !== undefined) {
      const parsedConditions = parseFormDataField(data.medicalConditions);
      user.info.medicalConditions = Array.isArray(parsedConditions) ? parsedConditions : [];
      console.log('✅ Updated medical conditions:', user.info.medicalConditions);
    }

    /* Handle emergency contact information */
    if (data.emergencyContact !== undefined) {
      const parsedEmergencyContact = parseFormDataField(data.emergencyContact);
      user.info.emergencyContact = {
        name: parsedEmergencyContact.name || '',
        relationship: parsedEmergencyContact.relationship || '',
        phone: parsedEmergencyContact.phone || ''
      };
      console.log('✅ Updated emergency contact:', user.info.emergencyContact);
    }

    /* Handle profile picture upload */
    if (req.file) {
      // Store the file path for uploaded files
      user.info.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
      console.log('✅ Profile picture uploaded:', user.info.profilePicture);
    } else if (data.profilePicture && data.profilePicture.startsWith('data:image')) {
      // Handle base64 image data
      user.info.profilePicture = data.profilePicture;
      console.log('✅ Profile picture (base64) updated');
    }

    /* Handle availableSlots if sent as JSON string */
    if (typeof data.availableSlots === 'string') {
      try {
        user.info.availableSlots = JSON.parse(data.availableSlots);
        console.log('✅ Available slots updated:', user.info.availableSlots);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid availableSlots format' });
      }
    } else if (Array.isArray(data.availableSlots)) {
      user.info.availableSlots = data.availableSlots;
      console.log('✅ Available slots updated:', user.info.availableSlots);
    }

    /* Validate availableSlots if provided */
    if (user.info.availableSlots && Array.isArray(user.info.availableSlots) && user.info.availableSlots.length) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const valid = user.info.availableSlots.every(slot =>
        days.includes(slot.day) &&
        /\d{1,2}:\d{2} (AM|PM)/.test(slot.start) &&
        /\d{1,2}:\d{2} (AM|PM)/.test(slot.end)
      );
      if (!valid) {
        return res.status(400).json({ error: 'Invalid time slot format' });
      }
    }

    /* nested pastSessionSummary */
    if (data.pastSessionSummary) {
      const parsedSessionSummary = parseFormDataField(data.pastSessionSummary);
      const { emotion, note } = parsedSessionSummary;
      user.info.pastSessionSummary = {
        ...(emotion !== undefined && { emotion }),
        ...(note !== undefined && { note })
      };
    }

    console.log('💾 Saving user with updated info:', user.info);
    await user.save();
    
    // Generate new token with updated user info
    const newToken = generateToken(user);
    
    // Return user with email included
    const userResponse = {
      ...user.toObject(),
      info: {
        ...user.info,
        email: user.email
      }
    };
    
    console.log('✅ Profile updated successfully for user:', username);
    return res.status(200).json({ 
      message: 'Profile updated successfully', 
      user: userResponse,
      token: newToken 
    });

  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating profile:', err.message);
    }
    return res.status(500).json({ error: 'Server error' });
  }
};

/* ──────────────────────────────────────────────────────────
   ONLY APPROVED THERAPISTS WITH COMPLETE PROFILES ARE SHOWN TO PATIENTS
─────────────────────────────────────────────────────────── */
exports.getAllTherapists = async (_req, res) => {
  try {
    const therapists = await User.find({
      role: 'therapist',
      isTherapistApproved: true
    }).select('-password');

    // Filter therapists with complete profiles
    const therapistsWithCompleteProfiles = therapists.filter(therapist => {
      const info = therapist.info || {};
      
      // Required fields for a complete therapist profile
      const requiredFields = [
        'firstName',
        'lastName', 
        'phone',
        'address',
        'specialization',
        'experience',
        'education',
        'certifications',
        'languages',
        'bio'
      ];
      
      // Check if all required fields are filled
      const hasCompleteProfile = requiredFields.every(field => {
        const value = info[field];
        return value && value.toString().trim() !== '';
      });
      
      // Also check if email exists (stored at root level)
      const hasEmail = therapist.email && therapist.email.toString().trim() !== '';
      
      // Also check if they have at least one availability slot
      const hasAvailability = info.availableSlots && 
        Array.isArray(info.availableSlots) && 
        info.availableSlots.length > 0;
      
      return hasCompleteProfile && hasAvailability && hasEmail;
    });

    // Ensure profile pictures are included in the response
    const therapistsWithPictures = therapistsWithCompleteProfiles.map(therapist => {
      return therapist;
    });
    
    return res.status(200).json({ therapists: therapistsWithPictures });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching therapists:', err.message);
    }
    return res.status(500).json({ error: 'Server error' });
  }
};

/* ──────────────────────────────────────────────────────────
   CHECK IF THERAPIST HAS COMPLETE PROFILE
─────────────────────────────────────────────────────────── */
exports.checkTherapistProfileComplete = async (req, res) => {
  try {
    const { username } = req.params;
    
    const therapist = await User.findOne({ 
      username, 
      role: 'therapist' 
    });
    
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist not found' });
    }
    
    const info = therapist.info || {};
    
    // Required fields for a complete therapist profile
    const requiredFields = [
      'firstName',
      'lastName', 
      'phone',
      'address',
      'specialization',
      'experience',
      'education',
      'certifications',
      'languages',
      'bio'
    ];
    
    // Check if all required fields are filled
    const hasCompleteProfile = requiredFields.every(field => {
      const value = info[field];
      return value && value.toString().trim() !== '';
    });
    
    // Also check if email exists (stored at root level)
    const hasEmail = therapist.email && therapist.email.toString().trim() !== '';
    
    // Also check if they have at least one availability slot
    const hasAvailability = info.availableSlots && 
      Array.isArray(info.availableSlots) && 
      info.availableSlots.length > 0;
    
    const isComplete = hasCompleteProfile && hasAvailability && hasEmail;
    
    // Get missing fields for guidance
    const missingFields = [];
    requiredFields.forEach(field => {
      const value = info[field];
      if (!value || value.toString().trim() === '') {
        missingFields.push(field);
      }
    });
    
    // Check email separately since it's at root level
    if (!hasEmail) {
      missingFields.push('email');
    }
    
    if (!hasAvailability) {
      missingFields.push('availability');
    }
    
    return res.status(200).json({ 
      isComplete,
      hasCompleteProfile,
      hasAvailability,
      missingFields
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error checking therapist profile:', err.message);
    }
    return res.status(500).json({ error: 'Server error' });
  }
};