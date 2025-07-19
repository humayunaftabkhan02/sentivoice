import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import AdminSidebar from "../Components/AdminSidebar/AdminSidebar";
import { 
  FaMoneyBillWave,
  FaCreditCard,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus,
  FaTrash,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
  FaCog,
  FaHistory,
  FaDownload,
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaTimesCircle,
  FaCheck,
  FaBan,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaUniversity,
  FaPaypal,
  FaMobile,
  FaApple,
  FaClock
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function PaymentSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [pendingCounts, setPendingCounts] = useState({
    approvals: 0,
    payments: 0,
    refunds: 0,
    notifications: 0
  });

  // Form state for editing
  const [editForm, setEditForm] = useState({
    method: "",
    accountName: "",
    accountNumber: "",
    amount: "",
    instructions: "",
    isActive: true
  });

  // Form state for adding new payment method
  const [addForm, setAddForm] = useState({
    method: "",
    accountName: "",
    accountNumber: "",
    amount: "",
    instructions: "",
    isActive: true
  });

  const fetchPendingCounts = async () => {
    try {
      // Fetch pending therapist approvals
      const pendingApprovals = await api.get("/api/admin/pending-therapists");
      const approvalsCount = Array.isArray(pendingApprovals) ? pendingApprovals.length : 0;

      // Fetch pending payments
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

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get("/api/admin/payment-settings");
      setSettings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to fetch payment settings");
      console.error("Settings fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const initializeSettings = async () => {
    try {
      setLoading(true);
      await api.post("/api/admin/payment-settings/initialize");
      setSuccess("Default payment settings initialized successfully");
      fetchSettings();
    } catch (err) {
      setError("Failed to initialize payment settings");
      console.error("Initialization error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setting) => {
    setEditingId(setting._id);
    setEditForm({
      method: setting.method,
      accountName: setting.accountName,
      accountNumber: setting.accountNumber,
      amount: setting.amount.toString(),
      instructions: setting.instructions || "",
      isActive: setting.isActive
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      method: "",
      accountName: "",
      accountNumber: "",
      amount: "",
      instructions: "",
      isActive: true
    });
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
    setAddForm({
      method: "",
      accountName: "",
      accountNumber: "",
      amount: "",
      instructions: "",
      isActive: true
    });
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setAddForm({
      method: "",
      accountName: "",
      accountNumber: "",
      amount: "",
      instructions: "",
      isActive: true
    });
  };

  const handleAdd = async () => {
    try {
      setLoading(true);
      await api.post("/api/admin/payment-settings", addForm);
      setSuccess("Payment method added successfully");
      setShowAddForm(false);
      fetchSettings();
    } catch (err) {
      setError("Failed to add payment method");
      console.error("Add error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.put(`/api/admin/payment-settings/${editingId}`, editForm);
      setSuccess("Payment setting updated successfully");
      setEditingId(null);
      fetchSettings();
    } catch (err) {
      setError("Failed to update payment setting");
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (settingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this payment setting? This action cannot be undone."
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      await api.delete(`/api/admin/payment-settings/${settingId}`);
      setSuccess("Payment setting deleted successfully");
      fetchSettings();
    } catch (err) {
      setError("Failed to delete payment setting");
      console.error("Delete error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method.toLowerCase()) {
      case 'easypaisa':
        return <FaMoneyBillWave className="text-green-500" />;
      case 'jazzcash':
        return <FaMoneyBillWave className="text-orange-500" />;
      case 'bank_transfer':
        return <FaUniversity className="text-blue-500" />;
      case 'credit_card':
        return <FaCreditCard className="text-purple-500" />;
      case 'paypal':
        return <FaPaypal className="text-blue-600" />;
      case 'stripe':
        return <FaCreditCard className="text-indigo-500" />;
      case 'razorpay':
        return <FaCreditCard className="text-pink-500" />;
      case 'paytm':
        return <FaMobile className="text-blue-500" />;
      case 'phonepe':
        return <FaMobile className="text-purple-500" />;
      case 'gpay':
        return <FaMobile className="text-green-600" />;
      case 'apple_pay':
        return <FaApple className="text-gray-800" />;
      case 'other':
        return <FaCreditCard className="text-gray-500" />;
      default:
        return <FaCreditCard className="text-gray-500" />;
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive 
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  useEffect(() => {
    fetchSettings();
    fetchPendingCounts();
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AdminSidebar 
        current="payments" 
        pendingApprovals={pendingCounts.approvals}
        pendingPayments={pendingCounts.payments}
        pendingRefunds={pendingCounts.refunds}
        notifications={pendingCounts.notifications}
      />
      
      <div className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Payment Settings
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Manage payment method configurations and account details
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-lg px-3 sm:px-4 py-2 shadow-sm border">
                <div className="flex items-center space-x-2">
                  <FaClock className="text-gray-400" />
                  <span className="text-xs sm:text-sm text-gray-600">
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

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1">
              <button
                onClick={() => navigate('/payments')}
                className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  <FaMoneyBillWave className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Payment Approvals</span>
                </div>
              </button>
              <button
                onClick={() => navigate('/payment-history')}
                className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  <FaHistory className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Payment History</span>
                </div>
              </button>
              <button
                className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-md transition-colors"
              >
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  <FaCreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Payment Settings</span>
                </div>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Methods</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">{settings.length}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                  <FaCreditCard className="text-xl sm:text-2xl text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Active Methods</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">
                    {settings.filter(s => s.isActive).length}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                  <FaCheckCircle className="text-xl sm:text-2xl text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Inactive Methods</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-600">
                    {settings.filter(s => !s.isActive).length}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
                  <FaTimesCircle className="text-xl sm:text-2xl text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center space-x-3">
            <FaExclamationTriangle className="text-red-500" />
            <div>
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6 flex items-center space-x-3">
            <FaCheckCircle className="text-green-500" />
            <div>
              <strong>Success:</strong> {success}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Payment Method Configurations ({settings.length})
              </h2>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={fetchSettings}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  <FaSpinner className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? 'Loading...' : 'Refresh'}</span>
                </button>
                
                <button
                  onClick={handleShowAddForm}
                  disabled={loading || showAddForm}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Add Payment Method</span>
                </button>
                
                {settings.length === 0 && (
                  <button
                    onClick={initializeSettings}
                    disabled={loading}
                    className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Initialize Default Settings</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading payment settings...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Add New Payment Method Form - Appears at the top */}
                {showAddForm && (
                  <div 
                    className="border-2 border-green-200 rounded-lg p-4 sm:p-6 bg-green-50 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FaPlus className="text-green-600 w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-green-800">
                          Add New Payment Method
                        </h3>
                      </div>
                      <button
                        onClick={handleCancelAdd}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Payment Method *
                          </label>
                          <select
                            value={addForm.method}
                            onChange={(e) => setAddForm({...addForm, method: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                          >
                            <option value="">Select Payment Method</option>
                            <option value="easypaisa">Easypaisa</option>
                            <option value="jazzcash">JazzCash</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="paypal">PayPal</option>
                            <option value="stripe">Stripe</option>
                            <option value="razorpay">Razorpay</option>
                            <option value="paytm">Paytm</option>
                            <option value="phonepe">PhonePe</option>
                            <option value="gpay">Google Pay</option>
                            <option value="apple_pay">Apple Pay</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            value={addForm.isActive.toString()}
                            onChange={(e) => setAddForm({...addForm, isActive: e.target.value === 'true'})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Account Name *
                          </label>
                          <input
                            type="text"
                            value={addForm.accountName}
                            onChange={(e) => setAddForm({...addForm, accountName: e.target.value})}
                            placeholder="e.g., SentiVoice Easypaisa"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Account Number *
                          </label>
                          <input
                            type="text"
                            value={addForm.accountNumber}
                            onChange={(e) => setAddForm({...addForm, accountNumber: e.target.value})}
                            placeholder="e.g., 0345-0000000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Amount (PKR) *
                          </label>
                          <input
                            type="number"
                            value={addForm.amount}
                            onChange={(e) => setAddForm({...addForm, amount: e.target.value})}
                            placeholder="e.g., 2500"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Instructions
                        </label>
                        <textarea
                          value={addForm.instructions}
                          onChange={(e) => setAddForm({...addForm, instructions: e.target.value})}
                          rows={3}
                          placeholder="Enter payment instructions for users..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-green-200">
                        <button
                          onClick={handleCancelAdd}
                          className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAdd}
                          disabled={loading || !addForm.method || !addForm.accountName || !addForm.accountNumber || !addForm.amount}
                          className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white rounded-lg transition-colors ${
                            loading || !addForm.method || !addForm.accountName || !addForm.accountNumber || !addForm.amount
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {loading ? (
                            <FaSpinner className="animate-spin w-3 h-3 sm:w-4 sm:h-4" />
                          ) : (
                            <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                          <span>{loading ? 'Adding...' : 'Add Payment Method'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Existing Payment Methods */}
                {settings.map((setting) => (
                  <div key={setting._id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                    {editingId === setting._id ? (
                      // Edit Form
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                          <div className="flex items-center space-x-3">
                            {getPaymentMethodIcon(setting.method)}
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                              {setting.method.toUpperCase()}
                            </h3>
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                            <button
                              onClick={handleSave}
                              disabled={loading}
                              className="flex items-center justify-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {loading ? (
                                <FaSpinner className="animate-spin w-3 h-3 sm:w-4 sm:h-4" />
                              ) : (
                                <FaSave className="w-3 h-3 sm:w-4 sm:h-4" />
                              )}
                              <span>{loading ? 'Saving...' : 'Save'}</span>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center justify-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <FaTimes className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Account Name
                            </label>
                            <input
                              type="text"
                              value={editForm.accountName}
                              onChange={(e) => setEditForm({...editForm, accountName: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Account Number
                            </label>
                            <input
                              type="text"
                              value={editForm.accountNumber}
                              onChange={(e) => setEditForm({...editForm, accountNumber: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Amount (PKR)
                            </label>
                            <input
                              type="number"
                              value={editForm.amount}
                              onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Status
                            </label>
                            <select
                              value={editForm.isActive.toString()}
                              onChange={(e) => setEditForm({...editForm, isActive: e.target.value === 'true'})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Instructions
                          </label>
                          <textarea
                            value={editForm.instructions}
                            onChange={(e) => setEditForm({...editForm, instructions: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                            placeholder="Enter payment instructions for users..."
                          />
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
                          <div className="flex items-center space-x-3">
                            {getPaymentMethodIcon(setting.method)}
                            <div>
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                {setting.method.toUpperCase()}
                              </h3>
                              <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium border ${getStatusBadge(setting.isActive)}`}>
                                {setting.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                            <button
                              onClick={() => handleEdit(setting)}
                              className="flex items-center justify-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <FaEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>Edit</span>
                            </button>
                            
                            <button
                              onClick={() => handleDelete(setting._id)}
                              disabled={loading}
                              className="flex items-center justify-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                              <FaTrash className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Account Name</label>
                            <p className="text-xs sm:text-sm text-gray-900 break-words">{setting.accountName}</p>
                          </div>
                          
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Account Number</label>
                            <p className="text-xs sm:text-sm text-gray-900 font-mono break-all">{setting.accountNumber}</p>
                          </div>
                          
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Amount</label>
                            <p className="text-lg sm:text-2xl font-bold text-green-600">{setting.amount.toLocaleString()} PKR</p>
                          </div>
                          
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                            <p className="text-xs sm:text-sm text-gray-900">
                              {new Date(setting.updatedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        {setting.instructions && (
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Instructions</label>
                            <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 p-3 rounded-lg break-words">
                              {setting.instructions}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 