import React, { useState, useEffect } from "react";
import { 
  FaUser, 
  FaCalendarAlt, 
  FaClock, 
  FaUserMd, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaHourglassHalf,
  FaEye,
  FaDownload,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaSort
} from 'react-icons/fa';
import NotificationBell from '../Components/NotificationBell/NotificationBell.jsx';
import MessageIcon from "../Components/MessageIcon/MessageIcon.jsx";
import { api } from "../utils/api";
import PatientSidebar from '../Components/PatientSidebar/PatientSidebar.jsx';
import { useNavigate } from 'react-router-dom';
import UserTopBar from '../Components/UserTopBar';

const AppointmentHistory = () => {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
      fetchAppointments(storedUsername);
      fetchUserData(storedUsername);
      api.get(`/user-info/${storedUsername}`)
        .then(data => {
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
    }
  }, []);

  const fetchAppointments = async (uname) => {
    try {
      setLoading(true);
      const data = await api.get(`/appointments?username=${uname}&role=patient`);
      setAppointments(data.appointments || []);
      
      // Debug: Log unique status values to identify spelling inconsistencies
      const uniqueStatuses = [...new Set(data.appointments?.map(a => a.status) || [])];
      console.log('Appointment statuses found:', uniqueStatuses);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async (uname) => {
    try {
      const data = await api.get(`/user-info/${uname}`);
      if (data.user?.info?.firstName && data.user?.info?.lastName) {
        setFullName(`${data.user.info.firstName} ${data.user.info.lastName}`);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  // Filter and sort appointments
  const filteredAppointments = appointments
    .filter(appt => {
      const matchesSearch = 
        appt.therapistFullName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter !== "all") {
        if (statusFilter === "Canceled") {
          matchesStatus = appt.status === "Canceled" || appt.status === "Cancelled";
        } else {
          matchesStatus = appt.status === statusFilter;
        }
      }
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case "therapist":
          comparison = (a.therapistFullName || "").localeCompare(b.therapistFullName || "");
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "time":
          comparison = a.time.localeCompare(b.time);
          break;
        default:
          comparison = new Date(a.date) - new Date(b.date);
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Finished":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Canceled":
      case "Cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Accepted":
        return <FaCheckCircle className="text-green-600" />;
      case "Rejected":
        return <FaTimesCircle className="text-red-600" />;
      case "Pending":
        return <FaHourglassHalf className="text-yellow-600" />;
      case "Finished":
        return <FaCheckCircle className="text-blue-600" />;
      case "Canceled":
      case "Cancelled":
        return <FaTimesCircle className="text-gray-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const downloadAppointmentHistory = () => {
    const csvContent = [
      ['Date', 'Time', 'Therapist', 'Session Type', 'Status', 'Notes'].join(','),
      ...filteredAppointments.map(appt => [
        formatDate(appt.date),
        formatTime(appt.time),
        appt.therapistFullName,
        appt.sessionType === 'in-person' ? 'In-person' : appt.sessionType === 'online' ? 'Online' : 'N/A',
        appt.status,
        appt.notes || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointment_history_${username}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const stats = {
    total: appointments.length,
    accepted: appointments.filter(a => a.status === "Accepted").length,
    finished: appointments.filter(a => a.status === "Finished").length,
    pending: appointments.filter(a => a.status === "Pending").length,
    cancelled: appointments.filter(a => a.status === "Canceled" || a.status === "Cancelled").length
  };

  return (
    <div className="flex min-h-screen bg-[#EBEDE9]">
      <PatientSidebar current="stats" />
      
      {/* Main Content */}
      <div className="flex-1 ml-64 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800">
              Appointment History
            </h1>
            <p className="text-gray-600 mt-1">Track your therapy sessions and appointments</p>
          </div>
          <UserTopBar username={username} fullName={fullName} role={"patient"} profilePicture={profilePicture} />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FaCalendarAlt className="text-2xl text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
              </div>
              <FaCheckCircle className="text-2xl text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Finished</p>
                <p className="text-2xl font-bold text-blue-600">{stats.finished}</p>
              </div>
              <FaCheckCircle className="text-2xl text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <FaHourglassHalf className="text-2xl text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <FaTimesCircle className="text-2xl text-red-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by therapist, date, or time..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Finished">Finished</option>
                <option value="Rejected">Rejected</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>
            
            {/* Sort */}
            <div className="flex items-center space-x-2">
              <FaSort className="text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Date</option>
                <option value="therapist">Therapist</option>
                <option value="status">Status</option>
                <option value="time">Time</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
            
            {/* Export Button */}
            <button
              onClick={downloadAppointmentHistory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <FaDownload className="inline mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading appointments...</p>
            </div>
          ) : currentAppointments.length === 0 ? (
            <div className="p-8 text-center">
              <FaCalendarAlt className="text-4xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No appointments found</h3>
              <p className="text-gray-500">No appointments match your current filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Therapist
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentAppointments.map((appointment) => (
                      <tr key={appointment._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(appointment.date)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatTime(appointment.time)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <FaUserMd className="text-blue-600 text-sm" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {appointment.therapistFullName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {appointment.sessionType === 'in-person' ? 'In-person' : appointment.sessionType === 'online' ? 'Online' : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                            {getStatusIcon(appointment.status)}
                            <span className="ml-1">{appointment.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <FaEye className="inline mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(indexOfLastItem, filteredAppointments.length)}
                        </span>{' '}
                        of <span className="font-medium">{filteredAppointments.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaChevronLeft className="h-4 w-4" />
                        </button>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === page
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaChevronRight className="h-4 w-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Appointment Details Modal */}
        {showDetails && selectedAppointment && (
          <>
            {/* Overlay */}
            <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 animate-fadeIn" style={{ background: 'rgba(0,0,0,0.10)' }}>
              <div className="fixed left-64 top-0 w-[calc(100vw-16rem)] h-full flex items-center justify-center pointer-events-none">
                {/* Modal Content */}
                <div
                  className="relative bg-white bg-opacity-95 rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-gray-300 p-6 transform transition-all duration-300 animate-scaleIn pointer-events-auto"
                  role="dialog"
                  aria-modal="true"
                  tabIndex={-1}
                >
                {/* Close Button */}
                <button
                  onClick={() => setShowDetails(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl focus:outline-none focus:ring-2 focus:ring-red-400 rounded-full transition-colors duration-200"
                  aria-label="Close modal"
                >
                  <FaTimesCircle />
                </button>
                <div className="mb-4">
                  <h3 className="text-2xl font-semibold text-gray-900">Appointment Details</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedAppointment.date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <p className="text-sm text-gray-900">{formatTime(selectedAppointment.time)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Therapist</label>
                    <p className="text-sm text-gray-900">{selectedAppointment.therapistFullName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Session Type</label>
                    <p className="text-sm text-gray-900">{selectedAppointment.sessionType === 'in-person' ? 'In-person' : selectedAppointment.sessionType === 'online' ? 'Online' : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedAppointment.status)}`}>
                      {getStatusIcon(selectedAppointment.status)}
                      <span className="ml-1">{selectedAppointment.status}</span>
                    </span>
                  </div>
                  {selectedAppointment.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <p className="text-sm text-gray-900">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Close
                  </button>
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
};

export default AppointmentHistory; 