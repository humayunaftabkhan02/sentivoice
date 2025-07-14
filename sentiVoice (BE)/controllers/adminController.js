/* controllers/adminController.js */
const User = require('../models/dataModel');

/* GET  /api/admin/pending-therapists  */
exports.listPendingTherapists = async (_req, res) => {
  try {
    const pending = await User.find({
     role: 'therapist',
     isTherapistApproved: { $ne: true },   // false OR undefined
     isEmailVerified: true                 // Only show verified therapists
    }).select('-password');
    res.json(pending); // info.cvDocument will be included if present
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', err.message);
    }
    res.status(500).json({ error: 'Cannot fetch pending therapists' });
  }
};

/* GET  /api/admin/stats  – global counts for dashboard */
exports.getStats = async (_req, res) => {
  try {
    const patients            = await User.countDocuments({ role: 'patient' });
    const approvedTherapists  = await User.countDocuments({
      role: 'therapist',
      isTherapistApproved: true
    });
    const pendingTherapists   = await User.countDocuments({
      role: 'therapist',
      isTherapistApproved: { $ne: true },
      isEmailVerified: true    // Only count verified therapists
    });

    res.json({ patients, approvedTherapists, pendingTherapists });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', err.message);
    }
    res.status(500).json({ error: 'Stats query failed' });
  }
};

// GET /api/admin/user-stats - Enhanced user statistics
exports.getUserStats = async (_req, res) => {
  try {
    const total = await User.countDocuments({ role: { $in: ["patient", "therapist"] } });
    const patients = await User.countDocuments({ role: 'patient' });
    const therapists = await User.countDocuments({ role: 'therapist' });
    const pending = await User.countDocuments({
      role: 'therapist',
      isTherapistApproved: { $ne: true },
      isEmailVerified: true    // Only count verified therapists
    });
    const active = await User.countDocuments({
      $and: [
        { isActive: { $ne: false } }, // Not suspended
        {
          $or: [
            { role: 'patient' },
            { role: 'therapist', isTherapistApproved: true }
          ]
        }
      ]
    });

    res.json({
      total,
      patients,
      therapists,
      pending,
      active
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
};

// GET /api/admin/users
// Query param: ?role=patient or ?role=therapist (optional)
exports.getAllUsers = async (req, res) => {
  try {
    const role = req.query.role;
    const filter = role ? { role } : { role: { $in: ["patient", "therapist"] } };

    const users = await User.find(filter).lean();

    const formatted = users.map(u => {
      const registeredOn = u.createdAt
        ? new Date(u.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          })
        : "—";

      let status;
      if (u.isActive === false) {
        status = "Suspended";
      } else if (u.role === "therapist") {
        status = u.isTherapistApproved === true ? "Active" : "Pending";
      } else {
        status = "Active";
      }

      console.log(`📋 User ${u.username}:`, {
        isActive: u.isActive,
        status: status,
        role: u.role,
        isTherapistApproved: u.isTherapistApproved
      });

      return {
        username: u.username,
        fullName:
          u.info?.firstName && u.info?.lastName
            ? `${u.info.firstName} ${u.info.lastName}`
            : u.username,
        role: u.role,
        specialization:
          u.role === "therapist" ? u.info?.specialization || "N/A" : undefined,
        email: u.info?.email,
        contact: u.info?.contact,
        address: u.info?.address,
        registeredOn,
        status,
        isActive: u.isActive === true // Only true if explicitly set to true
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// GET /api/admin/users/:username - Get detailed user information
exports.getUserDetails = async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username }).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userDetails = {
      username: user.username,
      fullName: user.info?.firstName && user.info?.lastName
        ? `${user.info.firstName} ${user.info.lastName}`
        : user.username,
      role: user.role,
      specialization: user.info?.specialization,
      email: user.info?.email,
      contact: user.info?.contact,
      address: user.info?.address,
      registeredOn: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          })
        : "—",
      status: user.isActive === false 
        ? "Suspended"
        : user.role === "therapist"
          ? user.isTherapistApproved === true ? "Active" : "Pending"
          : "Active",
      isActive: user.isActive === true
    };

    res.json(userDetails);
  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};

/* PUT  /api/admin/approve-therapist/:username  */
exports.approveTherapist = async (req, res) => {
  try {
    const { username } = req.params;
    const doc = await User.findOneAndUpdate(
      { username, role: 'therapist' },
      { isTherapistApproved: true },
      { new: true }
    ).select('-password');

    if (!doc)
      return res.status(404).json({ error: 'Therapist not found' });

    res.json({ message: 'Therapist approved', therapist: doc });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', err.message);
    }
    res.status(500).json({ error: 'Approval failed' });
  }
};

// PUT /api/admin/users/:username/suspend - Suspend a user
exports.suspendUser = async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`🔄 Suspending user: ${username}`);
    
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`❌ User not found: ${username}`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`📋 User found:`, {
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      isTherapistApproved: user.isTherapistApproved
    });

    // Prevent suspending admin users
    if (user.role === 'admin') {
      console.log(`❌ Cannot suspend admin user: ${username}`);
      return res.status(403).json({ error: 'Cannot suspend admin users' });
    }

    console.log(`✅ Suspending user: ${username} (current isActive: ${user.isActive})`);
    user.isActive = false;
    user.sessionVersion = (user.sessionVersion || 0) + 1; // Invalidate all existing sessions
    user.lastSuspendedAt = new Date();
    await user.save();
    
    // Verify the save worked
    const updatedUser = await User.findOne({ username });
    console.log(`✅ User suspended successfully: ${username}`);
    console.log(`📋 Updated user data:`, {
      username: updatedUser.username,
      isActive: updatedUser.isActive,
      role: updatedUser.role,
      sessionVersion: updatedUser.sessionVersion,
      lastSuspendedAt: updatedUser.lastSuspendedAt
    });

    res.json({ 
      message: 'User suspended successfully',
      user: {
        username: user.username,
        fullName: user.info?.firstName && user.info?.lastName
          ? `${user.info.firstName} ${user.info.lastName}`
          : user.username,
        role: user.role,
        status: 'Suspended'
      }
    });
  } catch (err) {
    console.error('❌ Error suspending user:', err);
    res.status(500).json({ error: 'Failed to suspend user' });
  }
};

// PUT /api/admin/users/:username/activate - Activate a suspended user
exports.activateUser = async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = true;
    user.sessionVersion = (user.sessionVersion || 0) + 1; // Invalidate all existing sessions
    user.lastSuspendedAt = null; // Clear suspension timestamp
    await user.save();

    res.json({ 
      message: 'User activated successfully',
      user: {
        username: user.username,
        fullName: user.info?.firstName && user.info?.lastName
          ? `${user.info.firstName} ${user.info.lastName}`
          : user.username,
        role: user.role,
        status: user.role === "therapist"
          ? user.isTherapistApproved === true ? "Active" : "Pending"
          : "Active"
      }
    });
  } catch (err) {
    console.error('Error activating user:', err);
    res.status(500).json({ error: 'Failed to activate user' });
  }
};

// GET /api/auth/validate-session - Validate current user session
exports.validateSession = async (req, res) => {
  try {
    const user = req.user; // From auth middleware
    
    if (!user) {
      return res.status(401).json({ 
        valid: false, 
        error: 'No authenticated user',
        code: 'NO_USER'
      });
    }

    // Check if user is still active
    if (user.isActive === false) {
      return res.json({
        valid: false,
        error: 'Your account has been suspended by an administrator. Please contact support for assistance.',
        code: 'SUSPENDED'
      });
    }

    // Check if email is still verified
    if (!user.isEmailVerified) {
      return res.json({
        valid: false,
        error: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Check if therapist is still approved
    if (user.role === 'therapist' && !user.isTherapistApproved) {
      return res.json({
        valid: false,
        error: 'Therapist account pending approval',
        code: 'THERAPIST_NOT_APPROVED'
      });
    }

    // Session is valid
    res.json({
      valid: true,
      user: {
        username: user.username,
        role: user.role,
        sessionVersion: user.sessionVersion || 0
      }
    });
  } catch (err) {
    console.error('Error validating session:', err);
    res.status(500).json({ 
      valid: false, 
      error: 'Session validation failed',
      code: 'VALIDATION_ERROR'
    });
  }
};

