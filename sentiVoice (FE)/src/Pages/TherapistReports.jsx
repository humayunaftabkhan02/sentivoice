import React, { useEffect, useState } from "react";
import { FaUser, FaFileAlt, FaDownload, FaCalendarAlt, FaClock, FaFilter, FaSearch, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import TherapistSidebar from "../Components/TherapistSidebar/TherapistSidebar.jsx";
import NotificationBell from '../Components/NotificationBell/NotificationBell.jsx';
import MessageIcon from "../Components/MessageIcon/MessageIcon.jsx";
import UserTopBar from '../Components/UserTopBar';
import { api } from "../utils/api";

const TherapistReports = () => {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [patientFilter, setPatientFilter] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(10);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
      // Fetch user info for display name and profile picture
      api.get(`/user-info/${storedUsername}`)
        .then(data => {
          if (data.user?.info?.firstName && data.user?.info?.lastName) {
            setFullName(`${data.user.info.firstName} ${data.user.info.lastName}`);
          }
          const pic = data.user?.info?.profilePicture;
          if (pic) {
            if (pic.startsWith('data:image')) {
              setProfilePicture(pic);
            } else if (pic.startsWith('/uploads/')) {
              const filename = pic.split('/').pop();
              api.get(`/uploads/profile-pictures/${filename}`)
                .then(response => {
                  if (response.image) setProfilePicture(response.image);
                })
                .catch(() => setProfilePicture(null));
            } else {
              setProfilePicture(pic);
            }
          }
        })
        .catch(() => setProfilePicture(null));
      
      // Fetch reports
      fetchReports(storedUsername);
    }
  }, []);

  // Apply filters whenever filter states change
  useEffect(() => {
    applyFilters();
  }, [reports, dateFrom, dateTo, patientFilter]);

  const fetchReports = async (therapistUsername) => {
    try {
      setLoading(true);
      setError("");
      console.log("Fetching reports for therapist:", therapistUsername);
      const data = await api.get(`/reports/therapist/${therapistUsername}`);
      console.log("Reports data received:", data);
      
      // Handle both response formats
      const reportsData = data.reports || data || [];
      console.log("Processed reports:", reportsData);
      setReports(reportsData);
      
      if (reportsData.length === 0) {
        console.log("No reports found for therapist:", therapistUsername);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setError("Failed to fetch reports. Please try again.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.sentAt);
        const fromDate = new Date(dateFrom);
        return reportDate >= fromDate;
      });
    }

    if (dateTo) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.sentAt);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59); // Include the entire day
        return reportDate <= toDate;
      });
    }

    // Filter by patient name
    if (patientFilter.trim()) {
      filtered = filtered.filter(report => {
        const patientName = (report.patientName || report.patientUsername || "").toLowerCase();
        return patientName.includes(patientFilter.toLowerCase());
      });
    }

    setFilteredReports(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setPatientFilter("");
  };

  // Quick filter functions
  const setQuickFilter = (filterType) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filterType) {
      case 'today':
        setDateFrom(today.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        setDateFrom(yesterday.toISOString().split('T')[0]);
        setDateTo(yesterday.toISOString().split('T')[0]);
        break;
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        setDateFrom(startOfWeek.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case 'thisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        setDateFrom(startOfMonth.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        setDateFrom(lastMonth.toISOString().split('T')[0]);
        setDateTo(endOfLastMonth.toISOString().split('T')[0]);
        break;
      case 'last30Days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case 'last7Days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        setDateFrom(sevenDaysAgo.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      default:
        break;
    }
  };

  const downloadReport = async (reportId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/download/${reportId}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading report:", err);
      alert("Error downloading report: " + err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination logic
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getUniquePatients = () => {
    const patients = new Set();
    reports.forEach(report => {
      patients.add(report.patientName || report.patientUsername);
    });
    return Array.from(patients).sort();
  };

  const isQuickFilterActive = (filterType) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filterType) {
      case 'today':
        return dateFrom === today.toISOString().split('T')[0] && dateTo === today.toISOString().split('T')[0];
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return dateFrom === yesterday.toISOString().split('T')[0] && dateTo === yesterday.toISOString().split('T')[0];
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return dateFrom === startOfWeek.toISOString().split('T')[0] && dateTo === today.toISOString().split('T')[0];
      case 'thisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return dateFrom === startOfMonth.toISOString().split('T')[0] && dateTo === today.toISOString().split('T')[0];
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return dateFrom === lastMonth.toISOString().split('T')[0] && dateTo === endOfLastMonth.toISOString().split('T')[0];
      case 'last30Days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return dateFrom === thirtyDaysAgo.toISOString().split('T')[0] && dateTo === today.toISOString().split('T')[0];
      case 'last7Days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return dateFrom === sevenDaysAgo.toISOString().split('T')[0] && dateTo === today.toISOString().split('T')[0];
      default:
        return false;
    }
  };

  return (
    <div className="flex min-h-screen">
      <TherapistSidebar current="reports" />
      
      {/* Main Content */}
      <div className="flex-1 p-8 space-y-6 ml-64">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Reports
            </h1>
            <p className="text-gray-600">View and download your patient reports</p>
          </div>
          <UserTopBar username={username} fullName={fullName} role={"therapist"} profilePicture={profilePicture} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center">
              <FaFileAlt className="text-3xl text-blue-500 mr-4" />
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-800">{reports.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center">
              <FaCalendarAlt className="text-3xl text-green-500 mr-4" />
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-800">
                  {reports.filter(report => {
                    const reportDate = new Date(report.sentAt);
                    const now = new Date();
                    return reportDate.getMonth() === now.getMonth() && 
                           reportDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex items-center">
              <FaClock className="text-3xl text-purple-500 mr-4" />
              <div>
                <p className="text-sm text-gray-600">Recent Activity</p>
                <p className="text-2xl font-bold text-gray-800">
                  {reports.filter(report => {
                    const reportDate = new Date(report.sentAt);
                    const now = new Date();
                    const diffTime = Math.abs(now - reportDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 7;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">All Reports</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                <FaFilter className="mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
            
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                {/* Quick Filters */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Quick Filters
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'today', label: 'Today' },
                      { key: 'yesterday', label: 'Yesterday' },
                      { key: 'thisWeek', label: 'This Week' },
                      { key: 'thisMonth', label: 'This Month' },
                      { key: 'lastMonth', label: 'Last Month' },
                      { key: 'last7Days', label: 'Last 7 Days' },
                      { key: 'last30Days', label: 'Last 30 Days' }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setQuickFilter(key)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          isQuickFilterActive(key)
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Date From */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Date To */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Patient Filter - Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Patient
                    </label>
                    <select
                      value={patientFilter}
                      onChange={(e) => setPatientFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Patients</option>
                      {getUniquePatients().map((patient, index) => (
                        <option key={index} value={patient}>
                          {patient}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Showing {filteredReports.length} of {reports.length} reports
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading reports...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <p className="text-red-600 mb-2">{error}</p>
              <button
                onClick={() => fetchReports(username)}
                className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Try Again
              </button>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {reports.length === 0 ? 'No Reports Available' : 'No Reports Match Filters'}
              </h3>
              <p className="text-gray-500 mb-4">
                {reports.length === 0 
                  ? 'Reports will appear here when patients complete voice analysis sessions or when you send manual reports.'
                  : 'Try adjusting your filters to see more results.'
                }
              </p>
              {reports.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {currentReports.map((report, index) => (
                  <div key={report._id || index} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <FaUser className="text-blue-500 mr-3" />
                          <h3 className="text-lg font-semibold text-gray-800">
                            Report from {report.patientName || report.patientUsername}
                          </h3>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          <FaCalendarAlt className="mr-2" />
                          <span>{formatDate(report.sentAt)}</span>
                          <FaClock className="ml-4 mr-2" />
                          <span>{formatTime(report.sentAt)}</span>
                        </div>
                        
                        {report.message && (
                          <div className="mt-3 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                            <p className="text-sm font-medium text-blue-800 mb-1">Patient Message:</p>
                            <p className="text-sm text-blue-700">{report.message}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-6 flex flex-col items-end space-y-3 min-w-0">
                        <button
                          onClick={() => downloadReport(report._id, report.fileName)}
                          className="flex items-center bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <FaDownload className="mr-2" />
                          Download PDF
                        </button>
                        <div className="text-xs text-gray-500 text-center max-w-48 break-words">
                          {report.fileName}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {indexOfFirstReport + 1} to {Math.min(indexOfLastReport, filteredReports.length)} of {filteredReports.length} reports
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaChevronLeft className="mr-1" />
                        Previous
                      </button>
                      
                      <div className="flex space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                          <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              currentPage === number
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {number}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <FaChevronRight className="ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TherapistReports; 