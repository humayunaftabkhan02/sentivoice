import React, { useEffect, useState } from "react";
import AdminSidebar from "../Components/AdminSidebar/AdminSidebar";
import { api } from "../utils/api";
import { 
  FaUserTie, 
  FaEnvelope, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaTimesCircle,
  FaEye,
  FaSpinner,
  FaExclamationTriangle,
  FaCheck,
  FaClock,
  FaUserCheck,
  FaInfoCircle,
  FaChevronLeft,
  FaChevronRight,
  FaSearch
} from "react-icons/fa";

export default function TherapistApproval() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(null);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [pendingCounts, setPendingCounts] = useState({
    approvals: 0,
    payments: 0,
    notifications: 0
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt"); // createdAt, name, email
  const [sortOrder, setSortOrder] = useState("desc"); // asc, desc

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get("/admin/pending-therapists");
      setPending(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to fetch pending therapists");
      console.error('Error fetching pending therapists:', err);
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

  const handleApprove = async (therapist) => {
    try {
      setApproving(therapist.username);
      await api.put(`/admin/approve-therapist/${therapist.username}`);
      
      // Show success message
      setSuccessMessage(`Therapist ${therapist.info?.firstName && therapist.info?.lastName 
        ? `${therapist.info.firstName} ${therapist.info.lastName}` 
        : therapist.username} has been approved successfully!`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      // Refresh data after a short delay
      setTimeout(() => {
      fetchPending();
        fetchPendingCounts();
        setApproving(null);
      }, 1000);
    } catch (err) {
      setError("Failed to approve therapist");
      setApproving(null);
      console.error('Error approving therapist:', err);
    }
  };

  const handleViewDetails = (therapist) => {
    setSelectedTherapist(therapist);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter and sort therapists
  const filteredAndSortedTherapists = pending
    .filter(therapist => {
      const searchLower = searchTerm.toLowerCase();
      const name = therapist.info?.firstName && therapist.info?.lastName
        ? `${therapist.info.firstName} ${therapist.info.lastName}`.toLowerCase()
        : therapist.username.toLowerCase();
      const email = therapist.email.toLowerCase();
      const username = therapist.username.toLowerCase();
      
      return name.includes(searchLower) || 
             email.includes(searchLower) || 
             username.includes(searchLower);
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "name":
          aValue = a.info?.firstName && a.info?.lastName
            ? `${a.info.firstName} ${a.info.lastName}`
            : a.username;
          bValue = b.info?.firstName && b.info?.lastName
            ? `${b.info.firstName} ${b.info.lastName}`
            : b.username;
          break;
        case "email":
          aValue = a.email;
          bValue = b.email;
          break;
        case "createdAt":
        default:
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedTherapists.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTherapists = filteredAndSortedTherapists.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    fetchPending();
    fetchPendingCounts();
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const apiOrigin = import.meta.env.VITE_API_ORIGIN || import.meta.env.VITE_API_URL || "http://localhost:3000";

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AdminSidebar 
        current="approval" 
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
                Therapist Approvals
              </h1>
              <p className="text-gray-600">
                Review and approve new therapist applications
              </p>
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-3xl font-bold text-amber-600">{pendingCounts.approvals}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <FaUserTie className="text-2xl text-amber-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-3xl font-bold text-blue-600">{pending.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FaUserCheck className="text-2xl text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved Today</p>
                  <p className="text-3xl font-bold text-green-600">0</p>
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

        {/* Success Message Display */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6 flex items-center space-x-3">
            <FaCheckCircle className="text-green-500" />
            <div>
              <strong>Success:</strong> {successMessage}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <h2 className="text-xl font-semibold text-gray-900">
                Pending Applications ({filteredAndSortedTherapists.length})
              </h2>
              
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                {/* Search */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search therapists..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Sort */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="email-asc">Email A-Z</option>
                  <option value="email-desc">Email Z-A</option>
                </select>
                
                <button
                  onClick={fetchPending}
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
                  <p className="text-gray-600">Loading applications...</p>
                </div>
              </div>
            ) : filteredAndSortedTherapists.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="text-3xl text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No matching applications found' : 'All Caught Up!'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms or filters.'
                    : 'No pending therapist applications at the moment.'
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
                  >
                    Clear Search
                  </button>
                )}
                <button
                  onClick={fetchPending}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaSpinner className="w-4 h-4 mr-2" />
                  Check for New Applications
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {currentTherapists.map((therapist, index) => (
                    <div key={therapist.username} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                              <FaUserTie className="text-white text-lg" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {therapist.info?.firstName && therapist.info?.lastName
                                  ? `${therapist.info.firstName} ${therapist.info.lastName}`
                                  : therapist.username}
                              </h3>
                              <p className="text-sm text-gray-500">@{therapist.username}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                <FaClock className="w-3 h-3 mr-1" />
                                Pending
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <FaEnvelope className="text-gray-400" />
                              <span>{therapist.email}</span>
                            </div>
                            {therapist.info?.specialization && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <FaUserTie className="text-gray-400" />
                                <span>{therapist.info.specialization}</span>
                              </div>
                            )}
                            {therapist.info?.bio && (
                              <div className="mb-4">
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {therapist.info.bio}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 ml-6">
                          <button
                            onClick={() => handleViewDetails(therapist)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <FaEye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          
                          <button
                            onClick={() => handleApprove(therapist)}
                            disabled={approving === therapist.username}
                            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                              approving === therapist.username
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {approving === therapist.username ? (
                              <FaSpinner className="animate-spin w-4 h-4" />
                            ) : (
                              <FaCheck className="w-4 h-4" />
                            )}
                            <span>{approving === therapist.username ? 'Approving...' : 'Approve'}</span>
                          </button>
                          {therapist.info?.cvDocument && (
                            <a
                              href={`${apiOrigin.replace(/\/$/, "")}/${therapist.info.cvDocument.replace(/^\//, "").replace(/\\/g, "/")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                            >
                              <FaEye className="w-4 h-4 mr-2" />
                              View CV / Document
                            </a>
                          )}
                        </div>
                      </div>
              </div>
            ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedTherapists.length)} of {filteredAndSortedTherapists.length} applications
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
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
                              className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
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
                        className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>Next</span>
                        <FaChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Therapist Details Modal */}
        {selectedTherapist && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Therapist Details
                  </h3>
                  <button
                    onClick={() => setSelectedTherapist(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimesCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <FaUserTie className="text-white text-2xl" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">
                      {selectedTherapist.info?.firstName && selectedTherapist.info?.lastName
                        ? `${selectedTherapist.info.firstName} ${selectedTherapist.info.lastName}`
                        : selectedTherapist.username}
                    </h4>
                    <p className="text-gray-600">@{selectedTherapist.username}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedTherapist.email}</p>
                  </div>
                  
                  {selectedTherapist.info?.specialization && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                      <p className="text-gray-900">{selectedTherapist.info.specialization}</p>
                    </div>
                  )}
                  
                  {selectedTherapist.info?.bio && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <p className="text-gray-900">{selectedTherapist.info.bio}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
                    <p className="text-gray-900">{formatDate(selectedTherapist.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedTherapist(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedTherapist);
                      setSelectedTherapist(null);
                    }}
                    disabled={approving === selectedTherapist.username}
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                      approving === selectedTherapist.username
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {approving === selectedTherapist.username ? (
                      <FaSpinner className="animate-spin w-4 h-4" />
                    ) : (
                      <FaCheck className="w-4 h-4" />
                    )}
                    <span>{approving === selectedTherapist.username ? 'Approving...' : 'Approve Therapist'}</span>
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