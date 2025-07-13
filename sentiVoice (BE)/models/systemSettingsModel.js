const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema({
  // System Announcements
  announcement: { type: String, default: "" },
  announcementEnabled: { type: Boolean, default: false },
  announcementType: { type: String, enum: ['info', 'warning', 'success'], default: 'info' },
  
  // Feature Toggles
  messagingEnabled: { type: Boolean, default: true },
  therapistRegistrationEnabled: { type: Boolean, default: true },
  patientRegistrationEnabled: { type: Boolean, default: true },
  appointmentBookingEnabled: { type: Boolean, default: true },
  voiceAnalysisEnabled: { type: Boolean, default: true },
  reportGenerationEnabled: { type: Boolean, default: true },
  
  // Security Settings
  requireEmailVerification: { type: Boolean, default: true },
  requireTherapistApproval: { type: Boolean, default: true },
  sessionTimeoutMinutes: { type: Number, default: 1440 }, // 24 hours
  maxLoginAttempts: { type: Number, default: 5 },
  passwordMinLength: { type: Number, default: 8 },
  
  // Appointment Settings
  maxAppointmentsPerDay: { type: Number, default: 10 },
  appointmentDurationMinutes: { type: Number, default: 60 },
  allowRescheduling: { type: Boolean, default: true },
  allowCancellation: { type: Boolean, default: true },
  cancellationNoticeHours: { type: Number, default: 24 },
  
  // File Upload Settings
  maxFileSizeMB: { type: Number, default: 10 },
  allowedFileTypes: { type: [String], default: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'] },
  
  // Notification Settings
  emailNotificationsEnabled: { type: Boolean, default: true },
  smsNotificationsEnabled: { type: Boolean, default: false },
  pushNotificationsEnabled: { type: Boolean, default: false },
  
  // Maintenance Mode
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: "System is under maintenance. Please try again later." },
  
  // Analytics & Monitoring
  analyticsEnabled: { type: Boolean, default: true },
  errorLoggingEnabled: { type: Boolean, default: true },
  performanceMonitoringEnabled: { type: Boolean, default: true },
  
  // Content Moderation
  autoModerationEnabled: { type: Boolean, default: false },
  profanityFilterEnabled: { type: Boolean, default: true },
  spamProtectionEnabled: { type: Boolean, default: true },
  
  // System Limits
  maxUsersPerTherapist: { type: Number, default: 50 },
  maxTherapistsPerPatient: { type: Number, default: 5 },
  maxMessageLength: { type: Number, default: 1000 },
  maxReportSizeMB: { type: Number, default: 5 },
  
  // Backup & Recovery
  autoBackupEnabled: { type: Boolean, default: true },
  backupFrequencyHours: { type: Number, default: 24 },
  retentionDays: { type: Number, default: 30 },
  
  // API Settings
  apiRateLimitPerMinute: { type: Number, default: 100 },
  apiKeyRequired: { type: Boolean, default: false },
  
  // UI/UX Settings
  darkModeEnabled: { type: Boolean, default: false },
  accessibilityModeEnabled: { type: Boolean, default: false },
  language: { type: String, default: 'en' },
  timezone: { type: String, default: 'UTC' }
}, { timestamps: true });

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);