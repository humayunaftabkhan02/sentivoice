import React, { useEffect, useState } from "react";
import { FaUser, FaCalendarAlt, FaClock, FaUserFriends, FaCheckCircle, FaTimesCircle, FaEdit, FaTrash, FaChevronLeft, FaChevronRight, FaSearch } from "react-icons/fa";
import NotificationBell from '../Components/NotificationBell/NotificationBell.jsx'
import { useNavigate } from "react-router-dom";
import RescheduleModal from "../Components/RescheduleModal/RescheduleModal.jsx";
import CancelModal from "../Components/CancelModal/CancelModal.jsx";
import MessageIcon from "../Components/MessageIcon/MessageIcon.jsx";
import ProfileCompletionBanner from "../Components/ProfileCompletionBanner/ProfileCompletionBanner.jsx";
import UserTopBar from '../Components/UserTopBar';

import { api } from "../utils/api";
import TherapistSidebar from "../Components/TherapistSidebar/TherapistSidebar.jsx";
import { useSessionCheck } from "../utils/useSessionCheck.js";

// Helper for date parsing
function parseDateString(dateStr) {
  const [year, month, day] = dateStr.split("-").map((n) => parseInt(n, 10));
  return new Date(year, month - 1, day);
}

const TherapistDashboard = () => {
  // Add session check hook
  useSessionCheck();
  
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [reschedulingApp, setReschedulingApp] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [cancelAppId, setCancelAppId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);

  // Pagination states
  const [pendingPage, setPendingPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pendingSearch, setPendingSearch] = useState("");
  const [upcomingSearch, setUpcomingSearch] = useState("");
  const itemsPerPage = 5;

  // mini-calendar states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedFirstName = localStorage.getItem('firstName');
    const storedLastName = localStorage.getItem('lastName');
    const storedFullName = localStorage.getItem('fullName');
    
    if (storedUsername) {
      setUsername(storedUsername);
      
      // Set full name from localStorage
      if (storedFullName) {
        setFullName(storedFullName);
      } else if (storedFirstName && storedLastName) {
        setFullName(`${storedFirstName} ${storedLastName}`);
      } else if (storedFirstName) {
        setFullName(storedFirstName);
      } else {
        setFullName(storedUsername);
      }
      // Fetch profile picture
      api.get(`/api/user-info/${storedUsername}`)
        .then(data => {
          const pic = data.user?.info?.profilePicture;
          if (pic) {
            if (pic.startsWith('data:image')) {
              setProfilePicture(pic);
            } else if (pic.startsWith('/uploads/')) {
              const filename = pic.split('/').pop();
              api.get(`/api/uploads/profile-pictures/${filename}`)
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

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");
    if (storedUsername) setUsername(storedUsername);
    if (storedRole) setRole(storedRole);

    if (storedUsername && storedRole === "therapist") {
      fetchAppointments(storedUsername);
    }
  }, []);

  useEffect(() => {
    setCurrentDate(new Date(selectedYear, selectedMonth, 1));
  }, [selectedMonth, selectedYear]);

  const fetchAppointments = async (therapistUsername) => {
    try {
      const data = await api.get(`/api/appointments?username=${therapistUsername}&role=therapist`);
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error("Error fetching therapist appointments:", err);
    }
  };

  // Accept
  const acceptAppointment = async (appointmentId) => {
    try {
      await api.put(`/api/appointments/${appointmentId}/accept`);
      alert("Appointment accepted.");
      fetchAppointments(username);
    } catch (err) {
      console.error("Failed to accept appointment:", err);
      alert("Failed to accept appointment.");
    }
  };

  // Reject
  const rejectAppointment = async (appointmentId) => {
    try {
      await api.put(`/api/appointments/${appointmentId}/reject`, { reason: "Rejected by therapist" });
      alert("Appointment rejected.");
      fetchAppointments(username);
    } catch (err) {
      console.error("Failed to reject appointment:", err);
      alert("Failed to reject appointment.");
    }
  };

  // Cancel
  const cancelAppointment = async (appointmentId, reason) => {
    try {
      await api.put(`/api/appointments/${appointmentId}/cancel`, { reason });
      alert("Appointment canceled.");
      fetchAppointments(username);
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
      alert("Failed to cancel.");
    }
    setShowCancelModal(false);
    setCancelAppId(null);
  };  

  const rescheduleAppointment = async (appointment) => {
    try {
      const data = await api.get(`/api/therapist/${appointment.therapistUsername}/availability`);
      setAvailableSlots(data.slots || []);
      setReschedulingApp(appointment); // show modal
    } catch (err) {
      console.error("Error fetching availability:", err);
      alert("❌ Failed to load availability.");
    }
  };

  const handleConfirmReschedule = async (newDate, newTime, reason) => {
    try {
      await api.put(`/api/appointments/${reschedulingApp._id}/reschedule`, {
        newDate,
        newTime,
        reason,
        reschedulerRole: "therapist",
      });
      alert("✅ Appointment rescheduled.");
      fetchAppointments(username);
    } catch (err) {
      console.error("Reschedule error:", err);
      alert("❌ Reschedule failed.");
    }
    setReschedulingApp(null);
  };  

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("fullName");
    localStorage.removeItem("token");
    navigate("/");
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  const isToday = (day) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  // For the red dots on the mini calendar, let's gather all "Accepted" appointments in the current month
  const acceptedThisMonth = appointments.filter((app) => {
    if (app.status !== "Accepted") return false;
    const d = parseDateString(app.date);
    return (
      d.getMonth() === currentDate.getMonth() &&
      d.getFullYear() === currentDate.getFullYear()
    );
  });
  const daysWithAppointments = new Set(
    acceptedThisMonth.map((a) => parseDateString(a.date).getDate())
  );

  const handleDateChange = () => {
    setCurrentDate(new Date(selectedYear, selectedMonth, 1));
    setShowDatePicker(false);
  };
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString("default", { month: "long" })
  );

  // Separate and filter the data
  const pendingAppointments = appointments.filter((a) => a.status === "Pending");
  const upcomingAppointments = appointments.filter((a) => a.status === "Accepted");

  // Filter appointments based on search
  const filteredPending = pendingAppointments.filter(app => 
    (app.patientFullName || app.patientUsername || "").toLowerCase().includes(pendingSearch.toLowerCase()) ||
    app.date.includes(pendingSearch) ||
    app.time.includes(pendingSearch)
  );

  const filteredUpcoming = upcomingAppointments.filter(app => 
    (app.patientFullName || app.patientUsername || "").toLowerCase().includes(upcomingSearch.toLowerCase()) ||
    app.date.includes(upcomingSearch) ||
    app.time.includes(upcomingSearch)
  );

  // Pagination
  const pendingTotalPages = Math.ceil(filteredPending.length / itemsPerPage);
  const upcomingTotalPages = Math.ceil(filteredUpcoming.length / itemsPerPage);
  
  const paginatedPending = filteredPending.slice(
    (pendingPage - 1) * itemsPerPage,
    pendingPage * itemsPerPage
  );
  
  const paginatedUpcoming = filteredUpcoming.slice(
    (upcomingPage - 1) * itemsPerPage,
    upcomingPage * itemsPerPage
  );

  // Count in current month
  const getAppointmentCountThisMonth = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    return appointments.filter((app) => {
      const d = parseDateString(app.date);
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = parseDateString(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  };

  return (
    <div className="flex min-h-screen bg-[#EBEDE9] overflow-x-hidden">
      <TherapistSidebar current="dashboard" />

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-64 min-w-0">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Therapist Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Welcome to your therapist dashboard</p>
          </div>
          <UserTopBar username={username} fullName={fullName} role={"therapist"} profilePicture={profilePicture} />
        </div>

        {/* Profile Completion Banner */}
        <ProfileCompletionBanner username={username} role={role} />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Appointment Stats */}
          <div className="lg:col-span-2 bg-gradient-to-r from-blue-500 to-blue-300 p-4 sm:p-6 lg:p-8 rounded-lg text-white hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl sm:text-2xl font-bold">Appointments This Month</h3>
            <p className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mt-4">
              {getAppointmentCountThisMonth()}
            </p>
            <div className="flex flex-col sm:flex-row mt-4 sm:mt-6 space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-10">
              <div className="bg-white text-black p-3 sm:p-4 lg:p-5 rounded-md text-center flex-1 hover:shadow-md transition-shadow duration-200">
                <p className="text-lg sm:text-xl font-semibold">Pending</p>
                <p className="text-2xl sm:text-3xl font-bold">{pendingAppointments.length}</p>
              </div>
              <div className="bg-white text-black p-3 sm:p-4 lg:p-5 rounded-md text-center flex-1 hover:shadow-md transition-shadow duration-200">
                <p className="text-lg sm:text-xl font-semibold">Accepted</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {upcomingAppointments.length}
                </p>
              </div>
            </div>
          </div>

          {/* Mini Calendar */}
          <div className="bg-white p-4 sm:p-6 rounded-lg relative hover:shadow-lg transition-shadow duration-300">
            <div
              className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors duration-200"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <h3 className="text-lg sm:text-xl font-semibold text-center">
                {currentDate.toLocaleString("default", {
                  month: "long",
                })}{" "}
                {currentDate.getFullYear()}
              </h3>
            </div>
            {showDatePicker && (
              <div className="absolute top-12 left-0 bg-white p-4 shadow-md rounded-md w-64 z-10">
                <div className="flex justify-between mb-4">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="border rounded p-2 w-32"
                  >
                    {months.map((month, index) => (
                      <option key={index} value={index}>
                        {month}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="border rounded p-2 w-24 text-center"
                  />
                </div>
                <button
                  onClick={handleDateChange}
                  className="mt-2 w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
                >
                  Go
                </button>
              </div>
            )}
            <div className="grid grid-cols-7 gap-2 text-center font-semibold mt-3">
              {daysOfWeek.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 mt-3 text-center">
              {/* Blank cells before the 1st of the month */}
              {Array.from(
                { length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() },
                (_, i) => <div key={`blank-${i}`} />
              )}

              {/* Actual days of the month */}
              {Array.from(
                { length: getDaysInMonth(currentDate) },
                (_, i) => i + 1
              ).map((day) => {
                const hasAppt = daysWithAppointments.has(day);
                return (
                  <div
                    key={day}
                    className={`p-2 rounded-md cursor-pointer hover:bg-blue-200 relative transition-colors duration-200 ${
                      isToday(day) ? "bg-gray-300" : ""
                    }`}
                  >
                    {day}
                    {hasAppt && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pending Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Pending Appointments</h3>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search appointments..."
                    value={pendingSearch}
                    onChange={(e) => setPendingSearch(e.target.value)}
                    className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {paginatedPending.length === 0 ? (
              <div className="text-center py-8">
                <FaTimesCircle className="text-gray-400 text-4xl mx-auto mb-4" />
                <p className="text-gray-500">No pending appointments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedPending.map((app) => (
                  <div
                    key={app._id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 space-y-3 sm:space-y-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaUser className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {app.patientFullName || app.patientUsername}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(app.date)} @ {app.time}
                          </p>
                          <p className="text-xs text-gray-500">
                            Session Type: {app.sessionType === 'in-person' ? 'In-person' : app.sessionType === 'online' ? 'Online' : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      {app.initiatorRole === "therapist" ? (
                        <button
                          onClick={() => {
                            setCancelAppId(app._id);
                            setShowCancelModal(true);
                          }}
                          className="flex items-center justify-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 w-full sm:w-auto text-xs sm:text-sm"
                        >
                          <FaTrash className="text-xs sm:text-sm" />
                          <span>Cancel</span>
                        </button>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                          <button
                            onClick={() => acceptAppointment(app._id)}
                            className="flex items-center justify-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 w-full sm:w-auto text-xs sm:text-sm"
                          >
                            <FaCheckCircle className="text-xs sm:text-sm" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => rejectAppointment(app._id)}
                            className="flex items-center justify-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 w-full sm:w-auto text-xs sm:text-sm"
                          >
                            <FaTimesCircle className="text-xs sm:text-sm" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pendingTotalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {((pendingPage - 1) * itemsPerPage) + 1} to {Math.min(pendingPage * itemsPerPage, filteredPending.length)} of {filteredPending.length} appointments
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPendingPage(Math.max(1, pendingPage - 1))}
                    disabled={pendingPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <FaChevronLeft className="text-sm" />
                  </button>
                  <span className="px-3 py-1 text-sm font-medium">
                    {pendingPage} of {pendingTotalPages}
                  </span>
                  <button
                    onClick={() => setPendingPage(Math.min(pendingTotalPages, pendingPage + 1))}
                    disabled={pendingPage === pendingTotalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <FaChevronRight className="text-sm" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Upcoming Appointments</h3>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search appointments..."
                    value={upcomingSearch}
                    onChange={(e) => setUpcomingSearch(e.target.value)}
                    className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {paginatedUpcoming.length === 0 ? (
              <div className="text-center py-8">
                <FaCalendarAlt className="text-gray-400 text-4xl mx-auto mb-4" />
                <p className="text-gray-500">No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedUpcoming.map((app) => (
                  <div
                    key={app._id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200 space-y-3 sm:space-y-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <FaUser className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {app.patientFullName || app.patientUsername}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(app.date)} @ {app.time}
                          </p>
                          <p className="text-xs text-gray-500">
                            Session Type: {app.sessionType === 'in-person' ? 'In-person' : app.sessionType === 'online' ? 'Online' : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                      <button
                        onClick={() => rescheduleAppointment(app)}
                        className="flex items-center justify-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 w-full sm:w-auto text-xs sm:text-sm"
                      >
                        <FaEdit className="text-xs sm:text-sm" />
                        <span>Reschedule</span>
                      </button>
                      <button
                        onClick={() => {
                          setCancelAppId(app._id);
                          setShowCancelModal(true);
                        }}
                        className="flex items-center justify-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 w-full sm:w-auto text-xs sm:text-sm"
                      >
                        <FaTrash className="text-xs sm:text-sm" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {upcomingTotalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {((upcomingPage - 1) * itemsPerPage) + 1} to {Math.min(upcomingPage * itemsPerPage, filteredUpcoming.length)} of {filteredUpcoming.length} appointments
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setUpcomingPage(Math.max(1, upcomingPage - 1))}
                    disabled={upcomingPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <FaChevronLeft className="text-sm" />
                  </button>
                  <span className="px-3 py-1 text-sm font-medium">
                    {upcomingPage} of {upcomingTotalPages}
                  </span>
                  <button
                    onClick={() => setUpcomingPage(Math.min(upcomingTotalPages, upcomingPage + 1))}
                    disabled={upcomingPage === upcomingTotalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <FaChevronRight className="text-sm" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {reschedulingApp && (
        <RescheduleModal
          appointment={reschedulingApp}
          onClose={() => setReschedulingApp(null)}
          onConfirm={handleConfirmReschedule}
          userRole="therapist"
        />
      )}
      {showCancelModal && (
        <CancelModal
          onClose={() => setShowCancelModal(false)}
          onConfirm={(reason) => cancelAppointment(cancelAppId, reason)}
          userRole="therapist"
        />
      )}
    </div>
  );
};

export default TherapistDashboard;