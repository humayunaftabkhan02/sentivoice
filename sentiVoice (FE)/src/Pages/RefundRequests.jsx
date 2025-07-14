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
  FaTimes
} from "react-icons/fa";

export default function RefundRequests() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const [selected, setSelected] = useState(null);

  const apiOrigin = import.meta.env.VITE_API_ORIGIN || import.meta.env.VITE_API_URL || "http://localhost:3000";

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get("/api/admin/refund-requests");
      setRefunds(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to fetch refund requests");
      setRefunds([]);
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
        fetchRefunds();
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

  useEffect(() => {
    fetchRefunds();
  }, []);

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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AdminSidebar current="refunds" />
      <div className="flex-1 ml-64 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund Requests</h1>
          <p className="text-gray-600">All payments pending refund action</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading refund requests...</p>
              </div>
            ) : refunds.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUndoAlt className="text-3xl text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Refund Requests</h3>
                <p className="text-gray-600 mb-4">No payments are currently pending refund.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-10 gap-4 px-4 py-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
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
                    <div key={payment._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="grid grid-cols-10 gap-4 items-center">
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
          </div>
        </div>
        {/* Modal for refund note/reference */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 animate-fadeIn" style={{ background: 'rgba(0,0,0,0.10)' }}>
            <div className="fixed left-64 top-0 w-[calc(100vw-16rem)] h-full flex items-center justify-center pointer-events-none">
              <div className="relative bg-white bg-opacity-95 rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-gray-300 p-6 transform transition-all duration-300 animate-scaleIn pointer-events-auto">
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl focus:outline-none focus:ring-2 focus:ring-red-400 rounded-full transition-colors duration-200"
                  aria-label="Close modal"
                >
                  <FaTimes />
                </button>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Mark as Refunded</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refund Note (optional)</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Reason or details for refund (optional)"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refund Reference (optional)</label>
                  <input
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Transaction ID, reference, etc. (optional)"
                  />
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => setSelected(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleMarkRefunded(selected)}
                    disabled={processing === selected._id}
                    className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${processing === selected._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {processing === selected._id ? <FaSpinner className="animate-spin w-4 h-4 inline" /> : <FaCheck className="w-4 h-4 inline" />} Mark Refunded
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