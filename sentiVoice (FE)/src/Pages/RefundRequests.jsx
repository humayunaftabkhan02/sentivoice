import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import AdminSidebar from "../Components/AdminSidebar/AdminSidebar";
import {
  FaUndoAlt,
  FaEye,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUser,
  FaUserTie,
  FaCalendarAlt,
  FaCreditCard,
  FaBan,
  FaHistory,
  FaCheck,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight
} from "react-icons/fa";

export default function RefundRequests() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const [selected, setSelected] = useState(null);
  const [pendingCounts, setPendingCounts] = useState({
    approvals: 0,
    payments: 0,
    refunds: 0,
    notifications: 0
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRefunds, setTotalRefunds] = useState(0);
  const [pageSize] = useState(10); // Items per page

  const apiOrigin = import.meta.env.VITE_API_ORIGIN || import.meta.env.VITE_API_URL || "http://localhost:3000";

  const fetchRefunds = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get(`/api/admin/refund-requests?page=${page}&limit=${pageSize}`);
      
      if (data && typeof data === 'object' && 'refunds' in data) {
        // API returns paginated data
        setRefunds(Array.isArray(data.refunds) ? data.refunds : []);
        setTotalPages(data.totalPages || 1);
        setTotalRefunds(data.totalRefunds || 0);
        setCurrentPage(page);
      } else {
        // Fallback for non-paginated API
        setRefunds(Array.isArray(data) ? data : []);
        setTotalPages(1);
        setTotalRefunds(Array.isArray(data) ? data.length : 0);
        setCurrentPage(1);
      }
    } catch (err) {
      setError("Failed to fetch refund requests");
      setRefunds([]);
      setTotalPages(1);
      setTotalRefunds(0);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRefunded = async (payment) => {
    const confirmed = window.confirm(
      `Mark this payment as REFUNDED?\n\nPatient: ${payment.patientFullName}\nAmount: ${payment.amount} PKR` +
      (note ? `\nNote: ${note}` : "") +
      (reference ? `\nReference: ${reference}` : "")
    );
    if (!confirmed) return;
    try {
      setProcessing(payment._id);
      await api.put(`/api/admin/payments/${payment._id}/refund`, {
        refundNote: note,
        refundReference: reference
      });
      setTimeout(() => {
        fetchRefunds(currentPage); // Refresh current page
        fetchPendingCounts(); // Update sidebar badge counts
        setProcessing(null);
        setSelected(null);
        setNote("");
        setReference("");
      }, 1000);
    } catch (err) {
      setError("Failed to update refund status");
      setProcessing(null);
    }
  };

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

  useEffect(() => {
    fetchRefunds(currentPage);
    fetchPendingCounts();
  }, [currentPage]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "Refund Pending":
        return <FaUndoAlt className="text-orange-600" />;
      case "Refunded":
        return <FaCheckCircle className="text-green-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case "Refund Pending":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Refunded":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Pagination helper functions
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AdminSidebar 
        current="refunds" 
        pendingApprovals={pendingCounts.approvals}
        pendingPayments={pendingCounts.payments}
        pendingRefunds={pendingCounts.refunds}
        notifications={pendingCounts.notifications}
      />
      <div className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Refund Requests</h1>
            <p className="text-gray-600 text-sm sm:text-base">All payments pending refund action</p>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FaSpinner className="animate-spin text-3xl sm:text-4xl text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 text-sm sm:text-base">Loading refund requests...</p>
              </div>
            ) : refunds.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUndoAlt className="text-2xl sm:text-3xl text-orange-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Refund Requests</h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">No payments are currently pending refund.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="hidden lg:grid grid-cols-10 gap-4 px-4 py-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
                  <div className="col-span-2">Patient</div>
                  <div className="col-span-2">Therapist</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-1 text-center">Amount</div>
                  <div className="col-span-1 text-center">Status</div>
                  <div className="col-span-2 text-center">Actions</div>
                </div>
                {refunds.map((payment) => {
                  const safeUrl = `${apiOrigin}/${payment.receiptUrl.replace(/\\/g, "/")}`;
                  return (
                    <div key={payment._id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                      {/* Mobile Layout */}
                      <div className="lg:hidden space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full flex items-center justify-center">
                            <FaUser className="text-white text-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{payment.patientFullName || 'Patient'}</h3>
                            <p className="text-xs sm:text-sm text-gray-500">Ref: {payment.referenceNo}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600 text-sm sm:text-base">{payment.amount} PKR</div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(payment.status)}`}>
                              {getStatusIcon(payment.status)}
                              <span className="ml-1">{payment.status}</span>
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <FaUserTie className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{payment.therapistFullName || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FaCalendarAlt className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{payment.bookingInfo?.date || 'N/A'}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                          <a
                            href={safeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center space-x-1 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <FaEye className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>View Receipt</span>
                          </a>
                          <button
                            onClick={() => setSelected(payment)}
                            className="flex items-center justify-center space-x-1 px-3 py-2 text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            <FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Mark Refunded</span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Desktop Layout */}
                      <div className="hidden lg:grid grid-cols-10 gap-4 items-center">
                        <div className="col-span-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full flex items-center justify-center">
                              <FaUser className="text-white text-sm" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{payment.patientFullName || 'Patient'}</h3>
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
                            <span className="text-sm text-gray-700">{payment.bookingInfo?.date || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="col-span-1 text-center font-semibold text-green-600">{payment.amount} PKR</div>
                        <div className="col-span-1 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            <span className="ml-1">{payment.status}</span>
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
                            onClick={() => setSelected(payment)}
                            className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            <FaCheck className="w-3 h-3" />
                            <span>Mark Refunded</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && refunds.length > 0 && totalPages > 1 && (
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                {/* Results Info */}
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRefunds)} of {totalRefunds} refund requests
                </div>

                {/* Pagination Buttons */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {/* First Page */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="First page"
                  >
                    <FaAngleDoubleLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Previous page"
                  >
                    <FaChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>

                  {/* Page Numbers */}
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                      disabled={page === '...'}
                      className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm font-medium rounded-lg border transition-colors ${
                        page === currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : page === '...'
                          ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-default'
                          : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {/* Next Page */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Next page"
                  >
                    <FaChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Last page"
                  >
                    <FaAngleDoubleRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Modal for refund note/reference */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 animate-fadeIn p-4" style={{ background: 'rgba(0,0,0,0.10)' }}>
            <div className="fixed lg:left-64 top-0 w-full lg:w-[calc(100vw-16rem)] h-full flex items-center justify-center pointer-events-none">
              <div className="relative bg-white bg-opacity-95 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border-2 border-gray-300 p-4 sm:p-6 transform transition-all duration-300 animate-scaleIn pointer-events-auto">
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-xl sm:text-2xl focus:outline-none focus:ring-2 focus:ring-red-400 rounded-full transition-colors duration-200"
                  aria-label="Close modal"
                >
                  <FaTimes />
                </button>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Mark as Refunded</h3>
                <div className="mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Refund Note (optional)</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows={2}
                    placeholder="Reason or details for refund (optional)"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Refund Reference (optional)</label>
                  <input
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Transaction ID, reference, etc. (optional)"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={() => setSelected(null)}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleMarkRefunded(selected)}
                    disabled={processing === selected._id}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${processing === selected._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {processing === selected._id ? <FaSpinner className="animate-spin w-3 h-3 sm:w-4 sm:h-4 inline" /> : <FaCheck className="w-3 h-3 sm:w-4 sm:h-4 inline" />} Mark Refunded
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 