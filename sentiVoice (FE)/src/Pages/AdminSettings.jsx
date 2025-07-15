import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import AdminSidebar from "../Components/AdminSidebar/AdminSidebar";
import { FaClock, FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaUser } from "react-icons/fa";

export default function AdminSystemSettings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [pendingCounts, setPendingCounts] = useState({
    approvals: 0,
    payments: 0,
    refunds: 0,
    notifications: 0
  });

  // Announcement states
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    message: '',
    type: 'info',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: ''
  });

  const fetchPendingCounts = async () => {
    try {
      const pendingApprovals = await api.get("/api/admin/pending-therapists");
      const approvalsCount = Array.isArray(pendingApprovals) ? pendingApprovals.length : 0;
      const pendingPayments = await api.get("/api/admin/pending-payments");
      const paymentsCount = Array.isArray(pendingPayments) ? pendingPayments.length : 0;
      const refundRes = await api.get("/api/admin/refund-requests-count");
      const refundsCount = refundRes.count || 0;
      setPendingCounts({
        approvals: approvalsCount,
        payments: paymentsCount,
        refunds: refundsCount,
        notifications: 0
      });
    } catch (error) {
      console.error('Error fetching pending counts:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const data = await api.get("/api/admin/announcements");
      setAnnouncements(data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.get("/api/admin/settings");
        setSettings(data);
      } catch (err) {
        setError("Failed to fetch settings");
      }
    };
    fetchSettings();
    fetchPendingCounts();
    fetchAnnouncements();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await api.put("/api/admin/settings", settings);
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
      await api.post("/api/admin/settings/reset");
      const data = await api.get("/api/admin/settings");
      setSettings(data);
      setSuccess("Settings reset to defaults successfully!");
    } catch (err) {
      setError("Failed to reset settings");
    }
    setSaving(false);
  };

  const handleExport = async () => {
    try {
      const response = await api.get("/api/admin/settings/export");
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

  // Announcement functions
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingAnnouncement) {
        await api.put(`/api/admin/announcements/${editingAnnouncement._id}`, announcementForm);
        setSuccess("Announcement updated successfully!");
      } else {
        await api.post("/api/admin/announcements", announcementForm);
        setSuccess("Announcement created successfully!");
      }
      
      setShowAnnouncementForm(false);
      setEditingAnnouncement(null);
      setAnnouncementForm({
        message: '',
        type: 'info',
        startDate: new Date().toISOString().slice(0, 16),
        endDate: ''
      });
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save announcement");
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      message: announcement.message,
      type: announcement.type,
      startDate: new Date(announcement.startDate).toISOString().slice(0, 16),
      endDate: announcement.endDate ? new Date(announcement.endDate).toISOString().slice(0, 16) : ''
    });
    setShowAnnouncementForm(true);
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      await api.delete(`/api/admin/announcements/${id}`);
      setSuccess("Announcement deleted successfully!");
      fetchAnnouncements();
    } catch (err) {
      setError("Failed to delete announcement");
    }
  };

  const handleToggleAnnouncement = async (id) => {
    try {
      await api.put(`/api/admin/announcements/${id}/toggle`);
      setSuccess("Announcement status updated!");
      fetchAnnouncements();
    } catch (err) {
      setError("Failed to update announcement status");
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'success': return 'bg-green-100 text-green-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No end date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        pendingRefunds={pendingCounts.refunds}
        notifications={pendingCounts.notifications}
      />
      
      <div className="flex-1 ml-64 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
              <p className="text-gray-600">Manage maintenance mode and announcements</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
                <div className="flex items-center space-x-2">
                  <FaClock className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
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

          {/* Action Button */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium shadow transition duration-200"
            >
              {saving ? "Saving..." : "💾 Save Changes"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Maintenance Mode */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden p-8">
              <h3 className="text-lg font-semibold mb-4">🛠️ Maintenance Mode</h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Enable Maintenance Mode</span>
                <ToggleSwitch
                  checked={settings.maintenanceMode}
                  onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
                />
              </div>
            </div>

            {/* Announcement Management */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">📢 Announcements</h3>
                <button
                  onClick={() => {
                    setShowAnnouncementForm(true);
                    setEditingAnnouncement(null);
                    setAnnouncementForm({
                      message: '',
                      type: 'info',
                      startDate: new Date().toISOString().slice(0, 16),
                      endDate: ''
                    });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow transition duration-200 flex items-center gap-2"
                >
                  <FaPlus /> New
                </button>
              </div>

              {/* Announcement Form */}
              {showAnnouncementForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">
                    {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                  </h4>
                  <form onSubmit={handleAnnouncementSubmit} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Message *</label>
                      <textarea
                        value={announcementForm.message}
                        onChange={(e) => setAnnouncementForm({...announcementForm, message: e.target.value})}
                        rows={2}
                        required
                        placeholder="Enter announcement message..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select
                          value={announcementForm.type}
                          onChange={(e) => setAnnouncementForm({...announcementForm, type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                        >
                          <option value="info">Info</option>
                          <option value="warning">Warning</option>
                          <option value="success">Success</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
                        <input
                          type="datetime-local"
                          value={announcementForm.endDate}
                          onChange={(e) => setAnnouncementForm({...announcementForm, endDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow transition duration-200"
                      >
                        {editingAnnouncement ? 'Update' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAnnouncementForm(false);
                          setEditingAnnouncement(null);
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow transition duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Announcements List */}
              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <p className="text-gray-500 text-sm">No announcements found.</p>
                ) : (
                  announcements.map((announcement) => (
                    <div key={announcement._id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(announcement.type)}`}>
                              {announcement.type.toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(announcement.isActive)}`}>
                              {announcement.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>
                          
                          <p className="text-gray-900 text-sm mb-1">{announcement.message}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <FaUser />
                              <span>{announcement.createdBy}</span>
                            </div>
                            {announcement.endDate && (
                              <div className="flex items-center gap-1">
                                <FaClock />
                                <span>Ends: {formatDate(announcement.endDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleToggleAnnouncement(announcement._id)}
                            className={`p-1 rounded transition-colors ${
                              announcement.isActive 
                                ? 'text-yellow-600 hover:bg-yellow-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={announcement.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {announcement.isActive ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                          </button>
                          
                          <button
                            onClick={() => handleEditAnnouncement(announcement)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteAnnouncement(announcement._id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}