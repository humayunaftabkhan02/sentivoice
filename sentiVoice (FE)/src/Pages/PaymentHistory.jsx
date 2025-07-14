import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import AdminSidebar from "../Components/AdminSidebar/AdminSidebar";
import { 
  FaUndoAlt, 
  FaEye, 
  FaDownload, 
  FaSearch, 
  FaFilter,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaMoneyBillWave,
  FaUser,
  FaUserTie,
  FaCalendarAlt,
  FaCreditCard,
  FaHistory,
  FaChartLine,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaTimes,
  FaCheck,
  FaBan,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaUniversity,
  FaPaypal,
  FaMobile,
  FaApple
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function PaymentHistory() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pendingCounts, setPendingCounts] = useState({
    approvals: 0,
    payments: 0,
    notifications: 0
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const apiOrigin = import.meta.env.VITE_API_ORIGIN || import.meta.env.VITE_API_URL || "http://localhost:3000";

    const fetchHistory = async () => {
      try {
        setLoading(true);
      setError(null);
        const data = await api.get("/admin/payment-history");
      setPayments(Array.isArray(data) ? data : []);
      } catch (err) {
      setError("Failed to fetch payment history");
        console.error("Failed to fetch payment history:", err);
      } finally {
        setLoading(false);
      }
    };

  const fetchPendingCounts = async () => {
    try {
      // Fetch pending therapist approvals
      const pendingApprovals = await api.get("/admin/pending-therapists");
      const approvalsCount = Array.isArray(pendingApprovals) ? pendingApprovals.length : 0;

      // Fetch pending payments
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

  const handleRefund = async (payment) => {
    const confirmed = window.confirm(
      `Are you sure you want to mark this payment as REFUNDED?\n\nPatient: ${payment.patientFullName}\nAmount: ${payment.amount} PKR\n\nThis action will be logged and cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      setProcessing(payment._id);
      await api.put(`/admin/payments/${payment._id}/refund`);
      
      // Show success feedback
      setTimeout(() => {
        fetchHistory();
        fetchPendingCounts();
        setProcessing(null);
      }, 1000);
    } catch (err) {
      setError("Failed to update refund status");
      setProcessing(null);
      console.error("Refund error:", err);
    }
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <FaCheckCircle className="text-green-600" />;
      case 'Declined':
        return <FaTimesCircle className="text-red-600" />;
      case 'Refunded':
        return <FaUndoAlt className="text-orange-600" />;
      case 'Pending':
        return <FaClock className="text-amber-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return "bg-green-100 text-green-800 border-green-200";
      case 'Declined':
        return "bg-red-100 text-red-800 border-red-200";
      case 'Refunded':
        return "bg-orange-100 text-orange-800 border-orange-200";
      case 'Pending':
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
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

  // Add booking status badge/icon logic
  const getBookingStatusIcon = (status) => {
    switch (status) {
      case 'Accepted':
        return <FaCheckCircle className="text-green-600" />;
      case 'Pending':
        return <FaClock className="text-amber-600" />;
      case 'Rejected':
        return <FaTimesCircle className="text-red-600" />;
      case 'Canceled':
        return <FaBan className="text-gray-500" />;
      case 'Finished':
        return <FaHistory className="text-blue-600" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };
  const getBookingStatusBadge = (status) => {
    switch (status) {
      case 'Accepted':
        return "bg-green-100 text-green-800 border-green-200";
      case 'Pending':
        return "bg-amber-100 text-amber-800 border-amber-200";
      case 'Rejected':
        return "bg-red-100 text-red-800 border-red-200";
      case 'Canceled':
        return "bg-gray-100 text-gray-800 border-gray-200";
      case 'Finished':
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Calculate statistics
  const stats = {
    total: payments.length,
    approved: payments.filter(p => p.status === 'Approved').length,
    declined: payments.filter(p => p.status === 'Declined').length,
    refunded: payments.filter(p => p.status === 'Refunded').length,
    totalAmount: payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    approvedAmount: payments
      .filter(p => p.status === 'Approved')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  };

  // Filter and search payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.patientFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.therapistFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.referenceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.method?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || payment.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Sort payments
  const sortedPayments = [...filteredPayments].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.bookingInfo?.date || 0);
        bValue = new Date(b.bookingInfo?.date || 0);
        break;
      case 'request':
        aValue = new Date(a.requestedAt || a.createdAt || 0);
        bValue = new Date(b.requestedAt || b.createdAt || 0);
        break;
      case 'amount':
        aValue = parseFloat(a.amount) || 0;
        bValue = parseFloat(b.amount) || 0;
        break;
      case 'patient':
        aValue = a.patientFullName?.toLowerCase() || '';
        bValue = b.patientFullName?.toLowerCase() || '';
        break;
      case 'therapist':
        aValue = a.therapistFullName?.toLowerCase() || '';
        bValue = b.therapistFullName?.toLowerCase() || '';
        break;
      default:
        aValue = new Date(a.bookingInfo?.date || 0);
        bValue = new Date(b.bookingInfo?.date || 0);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination logic
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPayments = sortedPayments.slice(startIndex, endIndex);

  // Reset to first page when search term or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // Update total pages when sorted payments change
  useEffect(() => {
    setTotalPages(Math.ceil(sortedPayments.length / pageSize));
  }, [sortedPayments, pageSize]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="text-gray-400" />;
    return sortOrder === 'asc' ? <FaSortUp className="text-blue-600" /> : <FaSortDown className="text-blue-600" />;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page
  };

  useEffect(() => {
    fetchHistory();
    fetchPendingCounts();
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AdminSidebar 
        current="payments" 
        pendingApprovals={pendingCounts.approvals}
        pendingPayments={pendingCounts.payments}
        notifications={pendingCounts.notifications}
      />
      
      <div className="flex-1 ml-64 p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Payment History
              </h1>
              <p className="text-gray-600">
                Complete transaction logs and payment records
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
                <div className="flex items-center space-x-2">
                  <FaHistory className="text-gray-400" />
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

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6">
            <div className="flex space-x-1">
              <button
                onClick={() => navigate('/payments')}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center justify-center space-x-2">
                  <FaMoneyBillWave className="w-4 h-4" />
                  <span>Payment Approvals</span>
                </div>
              </button>
              <button
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md transition-colors"
              >
                <div className="flex items-center justify-center space-x-2">
                  <FaHistory className="w-4 h-4" />
                  <span>Payment History</span>
                </div>
              </button>
              <button
                onClick={() => navigate('/payment-settings')}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center justify-center space-x-2">
                  <FaCreditCard className="w-4 h-4" />
                  <span>Payment Settings</span>
                </div>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FaChartLine className="text-2xl text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <FaCheckCircle className="text-2xl text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-3xl font-bold text-emerald-600">{stats.totalAmount.toLocaleString()} PKR</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <FaMoneyBillWave className="text-2xl text-emerald-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved Amount</p>
                  <p className="text-3xl font-bold text-green-600">{stats.approvedAmount.toLocaleString()} PKR</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <FaCheckCircle className="text-2xl text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center space-x-3">
            <FaExclamationTriangle className="text-red-500" />
            <div>
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <h2 className="text-xl font-semibold text-gray-900">
                Payment Records ({sortedPayments.length})
              </h2>
              
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                {/* Search */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="Approved">Approved</option>
                  <option value="Declined">Declined</option>
                  <option value="Refunded">Refunded</option>
                  <option value="Refund Pending">Refund Pending</option>
                  <option value="Pending">Pending</option>
                </select>
                
                <button
                  onClick={fetchHistory}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  <FaSpinner className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? 'Loading...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
        {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading payment history...</p>
                </div>
              </div>
            ) : sortedPayments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaHistory className="text-3xl text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm || filterStatus !== "all" ? 'No matching payments found' : 'No Payment History'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterStatus !== "all" 
                    ? 'Try adjusting your search terms or filters.'
                    : 'No payment records available at the moment.'
                  }
                </p>
                {(searchTerm || filterStatus !== "all") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("all");
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
          <div className="space-y-4">
                  {/* Sortable Headers */}
                  <div className="grid grid-cols-14 gap-4 px-4 py-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
                    <div className="col-span-2">
                      <button 
                        onClick={() => handleSort('patient')}
                        className="flex items-center space-x-1 hover:text-blue-600"
                      >
                        <span>Patient</span>
                        {getSortIcon('patient')}
                      </button>
                    </div>
                    <div className="col-span-2">
                      <button 
                        onClick={() => handleSort('therapist')}
                        className="flex items-center space-x-1 hover:text-blue-600"
                      >
                        <span>Therapist</span>
                        {getSortIcon('therapist')}
                      </button>
                    </div>
                    <div className="col-span-2">
                      <button 
                        onClick={() => handleSort('date')}
                        className="flex items-center space-x-1 hover:text-blue-600"
                      >
                        <span>Appt. Date</span>
                        {getSortIcon('date')}
                      </button>
                    </div>
                    <div className="col-span-2">
                      <button 
                        onClick={() => handleSort('request')}
                        className="flex items-center space-x-1 hover:text-blue-600"
                      >
                        <span>Request Date</span>
                        {getSortIcon('request')}
                      </button>
                    </div>
                    <div className="col-span-2">
                      <button 
                        onClick={() => handleSort('amount')}
                        className="flex items-center space-x-1 hover:text-blue-600"
                      >
                        <span>Amount</span>
                        {getSortIcon('amount')}
                      </button>
                    </div>
                    <div className="col-span-1 text-center">Payment Status</div>
                    <div className="col-span-1 text-center">Booking Status</div>
                    <div className="col-span-2 text-center">Actions</div>
                  </div>

                  {paginatedPayments.map((payment) => {
                    const safeUrl = `${apiOrigin}/${payment.receiptUrl.replace(/\\/g, "/")}`;
                    return (
                      <div key={payment._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="grid grid-cols-14 gap-4 items-center">
                          <div className="col-span-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <FaUser className="text-white text-sm" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {payment.patientFullName || 'Patient'}
                                </h3>
                                <p className="text-sm text-gray-500">Ref: {payment.referenceNo}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-span-2">
                            <div className="flex items-center space-x-2">
                              <FaUserTie className="text-gray-400" />
                              <span className="text-sm text-gray-700">{payment.therapistFullName || 'N/A'}</span>
                            </div>
                          </div>
                          
                          <div className="col-span-2">
                            <div className="flex items-center space-x-2">
                              <FaCalendarAlt className="text-gray-400" />
                              <span className="text-sm text-gray-700">
                                {formatDate(payment.bookingInfo?.date)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="col-span-2">
                            <span className="text-sm text-gray-700">
                              {formatDate(payment.requestedAt || payment.createdAt)}
                              {" "}
                              <span className="text-xs text-gray-400">{payment.requestedAt ? new Date(payment.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                            </span>
                          </div>
                          
                          <div className="col-span-2">
                            <div className="flex items-center space-x-2">
                              {getPaymentMethodIcon(payment.method)}
                              <span className="font-semibold text-green-600">
                                {payment.amount} PKR
                              </span>
                            </div>
                          </div>
                          
                          <div className="col-span-1 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(payment.status)}`}>
                              {getStatusIcon(payment.status)}
                              <span className="ml-1">{payment.status}</span>
                            </span>
                          </div>
                          <div className="col-span-1 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBookingStatusBadge(payment.bookingStatus)}`}>
                              {getBookingStatusIcon(payment.bookingStatus)}
                              <span className="ml-1">{payment.bookingStatus || 'N/A'}</span>
                            </span>
                          </div>
                          
                          <div className="col-span-2 flex items-center justify-center space-x-2">
                            <a
                              href={safeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <FaEye className="w-3 h-3" />
                              <span>Receipt</span>
                            </a>
                            
                            <button
                              onClick={() => handleViewDetails(payment)}
                              className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <FaEye className="w-3 h-3" />
                              <span>Details</span>
                            </button>
                            
                            {payment.status === "Declined" && (
                        <button
                                onClick={() => handleRefund(payment)}
                                disabled={processing === payment._id}
                                className={`flex items-center space-x-1 px-3 py-1 text-xs font-medium text-white rounded-lg transition-colors ${
                                  processing === payment._id
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-orange-600 hover:bg-orange-700'
                                }`}
                              >
                                {processing === payment._id ? (
                                  <FaSpinner className="animate-spin w-3 h-3" />
                                ) : (
                                  <FaUndoAlt className="w-3 h-3" />
                                )}
                                <span>{processing === payment._id ? 'Processing...' : 'Refund'}</span>
                        </button>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-700">
                        Showing {startIndex + 1} to {Math.min(endIndex, sortedPayments.length)} of {sortedPayments.length} payments
                      </span>
                      <select
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={5}>5 per page</option>
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaAngleDoubleLeft className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-1 text-sm rounded-lg ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaChevronRight className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaAngleDoubleRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Payment Details Modal */}
        {selectedPayment && (
          <>
            {/* Overlay */}
            <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 animate-fadeIn" style={{ background: 'rgba(0,0,0,0.10)' }}>
              <div className="fixed left-64 top-0 w-[calc(100vw-16rem)] h-full flex items-center justify-center pointer-events-none">
                <div
                  className="relative bg-white bg-opacity-95 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-gray-300 p-6 transform transition-all duration-300 animate-scaleIn pointer-events-auto"
                  role="dialog"
                  aria-modal="true"
                  tabIndex={-1}
                >
                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedPayment(null)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl focus:outline-none focus:ring-2 focus:ring-red-400 rounded-full transition-colors duration-200"
                    aria-label="Close modal"
                  >
                    <FaTimes />
                  </button>
                  <div className="mb-4">
                    <h3 className="text-2xl font-semibold text-gray-900">Payment Details</h3>
                  </div>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <FaUser className="text-white text-2xl" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">
                        {selectedPayment.patientFullName || 'Patient'}
                      </h4>
                      <p className="text-gray-600">Reference: {selectedPayment.referenceNo}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                      <p className="text-gray-900">{selectedPayment.patientFullName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Therapist</label>
                      <p className="text-gray-900">{selectedPayment.therapistFullName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Appointment</label>
                      <p className="text-gray-900">
                        {formatDate(selectedPayment.bookingInfo?.date)} at {formatTime(selectedPayment.bookingInfo?.time)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                      <p className="text-gray-900">{selectedPayment.method?.toUpperCase() || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                      <p className="text-gray-900">{selectedPayment.referenceNo || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                      <p className="text-2xl font-bold text-green-600">{selectedPayment.amount} PKR</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(selectedPayment.status)}`}>
                        {getStatusIcon(selectedPayment.status)}
                        <span className="ml-2">{selectedPayment.status}</span>
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Receipt</label>
                      <a
                        href={`${apiOrigin}/${selectedPayment.receiptUrl.replace(/\\/g, "/")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                      >
                        <FaDownload className="w-4 h-4" />
                        <span>View Receipt</span>
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedPayment(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                    {selectedPayment.status === "Declined" && (
                      <button
                        onClick={() => {
                          handleRefund(selectedPayment);
                          setSelectedPayment(null);
                        }}
                        disabled={processing === selectedPayment._id}
                        className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                          processing === selectedPayment._id
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-orange-600 hover:bg-orange-700'
                        }`}
                      >
                        {processing === selectedPayment._id ? (
                          <FaSpinner className="animate-spin w-4 h-4" />
                        ) : (
                          <FaUndoAlt className="w-4 h-4" />
                        )}
                        <span>{processing === selectedPayment._id ? 'Processing...' : 'Mark as Refunded'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <style>{`
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              .animate-fadeIn { animation: fadeIn 0.2s ease; }
              @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
              .animate-scaleIn { animation: scaleIn 0.2s cubic-bezier(0.4,0,0.2,1); }
              body { overflow: hidden !important; }
            `}</style>
          </>
        )}
      </div>
    </div>
  );
}