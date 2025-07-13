const Settings = require("../models/systemSettingsModel");

exports.getSettings = async (_req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    // Update all settings from request body
    const updateData = req.body;
    
    // Validate numeric fields
    if (updateData.sessionTimeoutMinutes && (updateData.sessionTimeoutMinutes < 1 || updateData.sessionTimeoutMinutes > 10080)) {
      return res.status(400).json({ error: 'Session timeout must be between 1 and 10080 minutes' });
    }
    
    if (updateData.maxLoginAttempts && (updateData.maxLoginAttempts < 1 || updateData.maxLoginAttempts > 20)) {
      return res.status(400).json({ error: 'Max login attempts must be between 1 and 20' });
    }
    
    if (updateData.passwordMinLength && (updateData.passwordMinLength < 6 || updateData.passwordMinLength > 50)) {
      return res.status(400).json({ error: 'Password minimum length must be between 6 and 50 characters' });
    }

    // Update settings
    Object.assign(settings, updateData);
    await settings.save();

    res.json({ 
      message: "Settings updated successfully", 
      settings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// Get specific setting category
exports.getSettingsCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    let categorySettings = {};
    
    switch (category) {
      case 'security':
        categorySettings = {
          requireEmailVerification: settings.requireEmailVerification,
          requireTherapistApproval: settings.requireTherapistApproval,
          sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
          maxLoginAttempts: settings.maxLoginAttempts,
          passwordMinLength: settings.passwordMinLength
        };
        break;
      case 'features':
        categorySettings = {
          messagingEnabled: settings.messagingEnabled,
          therapistRegistrationEnabled: settings.therapistRegistrationEnabled,
          patientRegistrationEnabled: settings.patientRegistrationEnabled,
          appointmentBookingEnabled: settings.appointmentBookingEnabled,
          voiceAnalysisEnabled: settings.voiceAnalysisEnabled,
          reportGenerationEnabled: settings.reportGenerationEnabled
        };
        break;
      case 'appointments':
        categorySettings = {
          maxAppointmentsPerDay: settings.maxAppointmentsPerDay,
          appointmentDurationMinutes: settings.appointmentDurationMinutes,
          allowRescheduling: settings.allowRescheduling,
          allowCancellation: settings.allowCancellation,
          cancellationNoticeHours: settings.cancellationNoticeHours
        };
        break;
      case 'notifications':
        categorySettings = {
          emailNotificationsEnabled: settings.emailNotificationsEnabled,
          smsNotificationsEnabled: settings.smsNotificationsEnabled,
          pushNotificationsEnabled: settings.pushNotificationsEnabled
        };
        break;
      case 'maintenance':
        categorySettings = {
          maintenanceMode: settings.maintenanceMode,
          maintenanceMessage: settings.maintenanceMessage
        };
        break;
      default:
        return res.status(400).json({ error: 'Invalid category' });
    }

    res.json(categorySettings);
  } catch (error) {
    console.error('Error fetching settings category:', error);
    res.status(500).json({ error: 'Failed to fetch settings category' });
  }
};

// Reset settings to defaults
exports.resetSettings = async (_req, res) => {
  try {
    await Settings.deleteMany({});
    const defaultSettings = await Settings.create({});
    res.json({ 
      message: "Settings reset to defaults successfully", 
      settings: defaultSettings 
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
};

// Export settings
exports.exportSettings = async (_req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    const exportData = {
      settings: settings.toObject(),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="system-settings.json"');
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting settings:', error);
    res.status(500).json({ error: 'Failed to export settings' });
  }
};