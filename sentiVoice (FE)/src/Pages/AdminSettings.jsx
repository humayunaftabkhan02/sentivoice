import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import AdminSidebar from "../Components/AdminSidebar/AdminSidebar";

export default function AdminSystemSettings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [pendingCounts, setPendingCounts] = useState({
    approvals: 0,
    payments: 0,
    notifications: 0
  });

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'features', label: 'Features', icon: '🚀' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'maintenance', label: 'Maintenance', icon: '🛠️' },
    { id: 'advanced', label: 'Advanced', icon: '⚡' }
  ];

  const fetchPendingCounts = async () => {
    try {
      const pendingApprovals = await api.get("/admin/pending-therapists");
      const approvalsCount = Array.isArray(pendingApprovals) ? pendingApprovals.length : 0;
      const pendingPayments = await api.get("/admin/pending-payments");
      const paymentsCount = Array.isArray(pendingPayments) ? pendingPayments.length : 0;

      setPendingCounts({
        approvals: approvalsCount,
        payments: paymentsCount,
        notifications: 0
      });
    } catch (error) {
      console.error('Error fetching pending counts:', error);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.get("/admin/settings");
        setSettings(data);
      } catch (err) {
        setError("Failed to fetch settings");
      }
    };
    fetchSettings();
    fetchPendingCounts();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await api.put("/admin/settings", settings);
      setSuccess("Settings saved successfully!");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update settings");
    }
    setSaving(false);
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset all settings to defaults? This action cannot be undone.")) {
      return;
    }
    
    setSaving(true);
    try {
      await api.post("/admin/settings/reset");
      const data = await api.get("/admin/settings");
      setSettings(data);
      setSuccess("Settings reset to defaults successfully!");
    } catch (err) {
      setError("Failed to reset settings");
    }
    setSaving(false);
  };

  const handleExport = async () => {
    try {
      const response = await api.get("/admin/settings/export");
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'system-settings.json';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export settings");
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div className={`w-11 h-6 rounded-full peer transition duration-300 ${
        disabled ? 'bg-gray-200' : 'bg-gray-300 peer-checked:bg-blue-600'
      }`} />
      <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition duration-300 ${
        checked ? 'translate-x-5' : ''
      }`} />
    </label>
  );

  const NumberInput = ({ value, onChange, min, max, step = 1, disabled = false }) => (
    <input
      type="number"
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
    />
  );

  if (!settings) return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AdminSidebar current="settings" />
      <div className="flex-1 ml-64 p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AdminSidebar 
        current="settings" 
        pendingApprovals={pendingCounts.approvals}
        pendingPayments={pendingCounts.payments}
        notifications={pendingCounts.notifications}
      />
      
      <div className="flex-1 ml-64 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
            <p className="text-gray-600">Configure platform behavior, security, and features</p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="text-red-600">❌ {error}</div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="text-green-600">✅ {success}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium shadow transition duration-200"
            >
              {saving ? "Saving..." : "💾 Save Changes"}
            </button>
            
            <button
              onClick={handleReset}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium shadow transition duration-200"
            >
              🔄 Reset to Defaults
            </button>
            
            <button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium shadow transition duration-200"
            >
              📤 Export Settings
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Announcement Settings */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">📢 System Announcement</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Enable Announcement</span>
                          <ToggleSwitch
                            checked={settings.announcementEnabled}
                            onChange={(e) => updateSetting('announcementEnabled', e.target.checked)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Announcement Type</label>
                          <select
                            value={settings.announcementType}
                            onChange={(e) => updateSetting('announcementType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="info">ℹ️ Information</option>
                            <option value="warning">⚠️ Warning</option>
                            <option value="success">✅ Success</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Message</label>
                          <textarea
                            value={settings.announcement}
                            onChange={(e) => updateSetting('announcement', e.target.value)}
                            rows={3}
                            placeholder="Enter announcement message..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Maintenance Mode */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">🛠️ Maintenance Mode</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Enable Maintenance Mode</span>
                          <ToggleSwitch
                            checked={settings.maintenanceMode}
                            onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Maintenance Message</label>
                          <textarea
                            value={settings.maintenanceMessage}
                            onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
                            rows={3}
                            placeholder="Enter maintenance message..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Authentication Settings */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">🔐 Authentication</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Require Email Verification</span>
                          <ToggleSwitch
                            checked={settings.requireEmailVerification}
                            onChange={(e) => updateSetting('requireEmailVerification', e.target.checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Require Therapist Approval</span>
                          <ToggleSwitch
                            checked={settings.requireTherapistApproval}
                            onChange={(e) => updateSetting('requireTherapistApproval', e.target.checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">Session Timeout (minutes)</span>
                            <p className="text-xs text-gray-500">1-10080 (1 week max)</p>
                          </div>
                          <NumberInput
                            value={settings.sessionTimeoutMinutes}
                            onChange={(e) => updateSetting('sessionTimeoutMinutes', parseInt(e.target.value))}
                            min={1}
                            max={10080}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">Max Login Attempts</span>
                            <p className="text-xs text-gray-500">1-20 attempts</p>
                          </div>
                          <NumberInput
                            value={settings.maxLoginAttempts}
                            onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value))}
                            min={1}
                            max={20}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">Password Min Length</span>
                            <p className="text-xs text-gray-500">6-50 characters</p>
                          </div>
                          <NumberInput
                            value={settings.passwordMinLength}
                            onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value))}
                            min={6}
                            max={50}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Content Moderation */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">🛡️ Content Moderation</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Auto Moderation</span>
                          <ToggleSwitch
                            checked={settings.autoModerationEnabled}
                            onChange={(e) => updateSetting('autoModerationEnabled', e.target.checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Profanity Filter</span>
                          <ToggleSwitch
                            checked={settings.profanityFilterEnabled}
                            onChange={(e) => updateSetting('profanityFilterEnabled', e.target.checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Spam Protection</span>
                          <ToggleSwitch
                            checked={settings.spamProtectionEnabled}
                            onChange={(e) => updateSetting('spamProtectionEnabled', e.target.checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'features' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Core Features */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">🚀 Core Features</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Messaging System</span>
                          <ToggleSwitch
                            checked={settings.messagingEnabled}
                            onChange={(e) => updateSetting('messagingEnabled', e.target.checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Voice Analysis</span>
                          <ToggleSwitch
                            checked={settings.voiceAnalysisEnabled}
                            onChange={(e) => updateSetting('voiceAnalysisEnabled', e.target.checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Report Generation</span>
                          <ToggleSwitch
                            checked={settings.reportGenerationEnabled}
                            onChange={(e) => updateSetting('reportGenerationEnabled', e.target.checked)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Registration Settings */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">👥 Registration</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Patient Registration</span>
                          <ToggleSwitch
                            checked={settings.patientRegistrationEnabled}
                            onChange={(e) => updateSetting('patientRegistrationEnabled', e.target.checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Therapist Registration</span>
                          <ToggleSwitch
                            checked={settings.therapistRegistrationEnabled}
                            onChange={(e) => updateSetting('therapistRegistrationEnabled', e.target.checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Appointment Booking</span>
                          <ToggleSwitch
                            checked={settings.appointmentBookingEnabled}
                            onChange={(e) => updateSetting('appointmentBookingEnabled', e.target.checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Appointment Limits */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">📅 Appointment Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">Max Appointments/Day</span>
                            <p className="text-xs text-gray-500">Per therapist</p>
                          </div>
                          <NumberInput
                            value={settings.maxAppointmentsPerDay}
                            onChange={(e) => updateSetting('maxAppointmentsPerDay', parseInt(e.target.value))}
                            min={1}
                            max={50}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">Duration (minutes)</span>
                            <p className="text-xs text-gray-500">Default appointment length</p>
                          </div>
                          <NumberInput
                            value={settings.appointmentDurationMinutes}
                            onChange={(e) => updateSetting('appointmentDurationMinutes', parseInt(e.target.value))}
                            min={15}
                            max={480}
                            step={15}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">Cancellation Notice (hours)</span>
                            <p className="text-xs text-gray-500">Minimum notice required</p>
                          </div>
                          <NumberInput
                            value={settings.cancellationNoticeHours}
                            onChange={(e) => updateSetting('cancellationNoticeHours', parseInt(e.target.value))}
                            min={1}
                            max={168}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Appointment Controls */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">⚙️ Appointment Controls</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Allow Rescheduling</span>
                          <ToggleSwitch
                            checked={settings.allowRescheduling}
                            onChange={(e) => updateSetting('allowRescheduling', e.target.checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Allow Cancellation</span>
                          <ToggleSwitch
                            checked={settings.allowCancellation}
                            onChange={(e) => updateSetting('allowCancellation', e.target.checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Notification Channels */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">🔔 Notification Channels</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Email Notifications</span>
                          <ToggleSwitch
                            checked={settings.emailNotificationsEnabled}
                            onChange={(e) => updateSetting('emailNotificationsEnabled', e.target.checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">SMS Notifications</span>
                          <ToggleSwitch
                            checked={settings.smsNotificationsEnabled}
                            onChange={(e) => updateSetting('smsNotificationsEnabled', e.target.checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Push Notifications</span>
                          <ToggleSwitch
                            checked={settings.pushNotificationsEnabled}
                            onChange={(e) => updateSetting('pushNotificationsEnabled', e.target.checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'maintenance' && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-4">⚠️ Maintenance Mode</h3>
                    <p className="text-yellow-700 mb-4">
                      When maintenance mode is enabled, only administrators can access the system. 
                      All other users will see the maintenance message.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Enable Maintenance Mode</span>
                        <ToggleSwitch
                          checked={settings.maintenanceMode}
                          onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Maintenance Message</label>
                        <textarea
                          value={settings.maintenanceMessage}
                          onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
                          rows={4}
                          placeholder="Enter maintenance message to display to users..."
                          className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* System Limits */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">📊 System Limits</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">Max Users/Therapist</span>
                            <p className="text-xs text-gray-500">Patient limit per therapist</p>
                          </div>
                          <NumberInput
                            value={settings.maxUsersPerTherapist}
                            onChange={(e) => updateSetting('maxUsersPerTherapist', parseInt(e.target.value))}
                            min={1}
                            max={200}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">Max Therapists/Patient</span>
                            <p className="text-xs text-gray-500">Therapist limit per patient</p>
                          </div>
                          <NumberInput
                            value={settings.maxTherapistsPerPatient}
                            onChange={(e) => updateSetting('maxTherapistsPerPatient', parseInt(e.target.value))}
                            min={1}
                            max={20}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">Max Message Length</span>
                            <p className="text-xs text-gray-500">Characters per message</p>
                          </div>
                          <NumberInput
                            value={settings.maxMessageLength}
                            onChange={(e) => updateSetting('maxMessageLength', parseInt(e.target.value))}
                            min={100}
                            max={5000}
                            step={100}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">Max File Size (MB)</span>
                            <p className="text-xs text-gray-500">Upload file size limit</p>
                          </div>
                          <NumberInput
                            value={settings.maxFileSizeMB}
                            onChange={(e) => updateSetting('maxFileSizeMB', parseInt(e.target.value))}
                            min={1}
                            max={50}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Analytics & Monitoring */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">📈 Analytics & Monitoring</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Analytics Collection</span>
                          <ToggleSwitch
                            checked={settings.analyticsEnabled}
                            onChange={(e) => updateSetting('analyticsEnabled', e.target.checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Error Logging</span>
                          <ToggleSwitch
                            checked={settings.errorLoggingEnabled}
                            onChange={(e) => updateSetting('errorLoggingEnabled', e.target.checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Performance Monitoring</span>
                          <ToggleSwitch
                            checked={settings.performanceMonitoringEnabled}
                            onChange={(e) => updateSetting('performanceMonitoringEnabled', e.target.checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}