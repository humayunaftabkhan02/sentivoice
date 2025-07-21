import React, { useState, useEffect } from "react";
import { 
  FaUser, 
  FaCalendarAlt, 
  FaClock, 
  FaNotesMedical, 
  FaHeart, 
  FaBrain, 
  FaChartLine, 
  FaBell, 
  FaEnvelope, 
  FaDownload, 
  FaEdit, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationTriangle,
  FaUserMd,
  FaCalendarCheck,
  FaClipboardList,
  FaChartBar,
  FaShieldAlt,
  FaGraduationCap,
  FaHandHoldingHeart,
  FaPlus,
  FaMinus,
  FaEye,
  FaHistory,
  FaChevronLeft,
  FaChevronRight,
  FaQuoteLeft,
  FaCheck,
  FaExclamationTriangle as FaExclamationTriangleIcon
} from 'react-icons/fa';
import logo from '../assets/logo.png'
import LogoutIcon from '../Components/LogOutIcon/LogOutIcon.jsx';
import NotificationBell from '../Components/NotificationBell/NotificationBell.jsx'
import { useNavigate } from "react-router-dom";
import RescheduleModal from "../Components/RescheduleModal/RescheduleModal.jsx";
import CancelModal from "../Components/CancelModal/CancelModal.jsx";
import MessageIcon from "../Components/MessageIcon/MessageIcon.jsx";
import SendReportModal from "../Components/SendReportModal/SendReportModal.jsx";
import { generateAndSendPatientReport } from "../utils/generatePDF.js";
import { api } from "../utils/api";
import PatientSidebar from "../Components/PatientSidebar/PatientSidebar.jsx";
import { useSessionCheck } from "../utils/useSessionCheck.js";
import UserTopBar from '../Components/UserTopBar';
import ReportsFromTherapist from "../Components/ReportsFromTherapist/ReportsFromTherapist.jsx";

const P_Dashboard = () => {
  // Add session check hook
  useSessionCheck();
  
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [user, setUser] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [reschedulingApp, setReschedulingApp] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [cancelAppId, setCancelAppId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSendReportModal, setShowSendReportModal] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [selectedTherapistFullName, setSelectedTherapistFullName] = useState("");
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelError, setCancelError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success'); // 'success' or 'error'
  const [modalMessage, setModalMessage] = useState('');

  const emotionEmojiMap = {
    Happy: "😊",
    Sad: "😢",
    Angry: "😠",
    Calm: "😌",
    Surprised: "😲",
    Neutral: "😐"
  };

  const navigate = useNavigate();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination states
  const [therapyPlanPage, setTherapyPlanPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const itemsPerPage = 5;

  // Get last session date from finished appointments
  const getLastSessionDate = () => {
    if (!appointments || appointments.length === 0) return null;
    
    const finishedAppointments = appointments.filter(app => app.status === 'Finished');
    if (finishedAppointments.length === 0) return null;
    
    // Sort by date and time to get the most recent
    const sortedFinished = finishedAppointments.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateB - dateA; // Most recent first
    });
    
    return `${sortedFinished[0].date} ${sortedFinished[0].time}`;
  };

  const lastSessionDate = getLastSessionDate();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedFirstName = localStorage.getItem("firstName");
    const storedLastName = localStorage.getItem("lastName");
    const storedFullName = localStorage.getItem("fullName");
    
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
    }
  }, []);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");
    if (storedUsername) setUsername(storedUsername);
    if (storedRole) setRole(storedRole);

    // Once we have them, fetch appointments and user data
    if (storedUsername && storedRole === "patient") {
      fetchAppointments(storedUsername);
      fetchUserData(storedUsername); // Fetch user data
    }
  }, []);

  const fetchAppointments = async (uname) => {
    try {
      const data = await api.get(`/api/appointments?username=${uname}&role=patient`);
      setAppointments(data.appointments || []);
      setAppointmentHistory(data.appointments || []); // Store all appointments for PDF generation
    } catch (err) {
      console.error("Error fetching patient appointments:", err);
    }
  };

  const fetchUserData = async (uname) => {
    try {
      const data = await api.get(`/api/user-info/${uname}`);
      if (data.user) {
        setUser(data.user);
        const pic = data.user.info?.profilePicture;
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
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
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

  // Cancel Appointment
  const cancelAppointment = async (appointmentId, reason) => {
    try {
      await api.put(`/api/appointments/${appointmentId}/cancel`, { reason });
      setModalType('success');
      setModalMessage('Appointment canceled.');
      setShowModal(true);
      fetchAppointments(username);
      setShowCancelModal(false);
      setCancelAppId(null);
      setCancelError("");
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
      // Try to extract backend error message
      let msg = "Failed to cancel.";
      if (err && err.response && err.response.data && err.response.data.error) {
        msg = err.response.data.error;
      } else if (err && err.message) {
        msg = err.message;
      }
      setCancelError(msg);
      setModalType('error');
      setModalMessage(msg);
      setShowModal(true);
    }
  };  

  // Reschedule Appointment
  const rescheduleAppointment = (appointment) => {
    setReschedulingApp(appointment);
  };
  
  const handleConfirmReschedule = async (newDate, newTime, reason) => {
    try {
      await api.put(`/api/appointments/${reschedulingApp._id}/reschedule`, {
        newDate,
        newTime,
        reason,
        reschedulerRole: "patient",
      });
      setModalType('success');
      setModalMessage('Appointment rescheduled!');
      setShowModal(true);
      fetchAppointments(username);
    } catch (err) {
      console.error("Failed to reschedule appointment:", err);
      setModalType('error');
      setModalMessage('Reschedule failed.');
      setShowModal(true);
    }
    setReschedulingApp(null);
  };
  
  // Accept
  const acceptAppointment = async (appointmentId) => {
    try {
      await api.put(`/api/appointments/${appointmentId}/accept`);
      setModalType('success');
      setModalMessage('Appointment accepted.');
      setShowModal(true);
      fetchAppointments(username);
    } catch (err) {
      console.error("Failed to accept appointment:", err);
      setModalType('error');
      setModalMessage('Failed to accept appointment.');
      setShowModal(true);
    }
  };

  // Reject
  const rejectAppointment = async (appointmentId) => {
    try {
      await api.put(`/api/appointments/${appointmentId}/reject`, { reason: "Rejected by patient" });
      setModalType('success');
      setModalMessage('Appointment rejected.');
      setShowModal(true);
      fetchAppointments(username);
    } catch (err) {
      console.error("Failed to reject appointment:", err);
      setModalType('error');
      setModalMessage('Failed to reject appointment.');
      setShowModal(true);
    }
  };

  // Handle sending report to therapist
  const handleSendReportToTherapist = (therapistUsername, therapistFullName) => {
    setSelectedTherapist(therapistUsername);
    setSelectedTherapistFullName(therapistFullName);
    setShowSendReportModal(true);
  };

  const handleConfirmSendReport = async (message) => {
    if (!user || !selectedTherapist) return;
    
    try {
      await generateAndSendPatientReport(user, appointmentHistory, selectedTherapist, message);
    } catch (error) {
      throw error; // Let the modal handle the error
    }
  };

  // Filter upcoming: pending or accepted
  const upcoming = appointments.filter(
    (app) => app.status === "Pending" || app.status === "Accepted"
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#EBEDE9]">
        <PatientSidebar current="dashboard" />
        <div className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#EBEDE9]">
      <PatientSidebar current="dashboard" />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {getGreeting()} <span className="text-blue-600">{fullName || username}!</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Welcome to your therapy dashboard</p>
          </div>
          <UserTopBar username={username} fullName={fullName} role={role} profilePicture={profilePicture} />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-blue-100 text-blue-600">
                <FaCalendarCheck className="text-lg sm:text-xl" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Upcoming Sessions</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{upcoming.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-purple-100 text-purple-600">
                <FaClipboardList className="text-lg sm:text-xl" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Therapy Steps</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{user?.info?.therapyPlan?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-orange-500 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-orange-100 text-orange-600">
                <FaUserMd className="text-lg sm:text-xl" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Last Completed Session</p>
                <p className="text-xs sm:text-sm font-bold text-gray-900">
                  {lastSessionDate ? formatDate(lastSessionDate).split(',')[0] : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card (moved to top) */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center mb-4">
            <FaHandHoldingHeart className="mr-2 text-orange-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/book-appointment")}
              className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-colors"
            >
              <FaPlus className="text-sm" />
              <span className="text-sm font-medium">Book Session</span>
            </button>
            <button
              onClick={() => navigate("/pa-appointment-history")}
              className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg transition-colors"
            >
              <FaHistory className="text-sm" />
              <span className="text-sm font-medium">View History</span>
            </button>
            <button
              onClick={() => navigate("/pa-messaging")}
              className="flex items-center justify-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-lg transition-colors"
            >
              <FaEnvelope className="text-sm" />
              <span className="text-sm font-medium">Messages</span>
            </button>
            <button
              onClick={() => navigate("/pa-settings")}
              className="flex items-center justify-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg transition-colors"
            >
              <FaUser className="text-sm" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </div>
        </div>
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6">
          {/* Left Column */}
          <div className="space-y-6 sm:space-y-8">
            {/* Last Session Summary Card */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                  <FaNotesMedical className="mr-2 text-blue-600" />
                  Last Session Summary
                </h2>
              </div>
              
              {lastSessionDate && user?.info?.pastSessionSummary?.emotion ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="text-3xl sm:text-4xl">
                      {emotionEmojiMap[user.info.pastSessionSummary.emotion] || "😐"}
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-semibold text-gray-800">
                        Primary Emotion: <span className="text-blue-600">
                          {user.info.pastSessionSummary.emotion}
                        </span>
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Detected on {formatDate(user.info.pastSessionSummary.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  {user.info.pastSessionSummary.note && (
                    <div className="relative bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 mb-2 shadow-sm">
                      <div className="flex items-center mb-2">
                        <FaQuoteLeft className="text-blue-400 mr-2 text-lg" />
                        <span className="font-semibold text-blue-700 text-xs sm:text-sm">Therapist's Note</span>
                      </div>
                      <p className="text-base sm:text-lg text-gray-800 italic pl-2">{user.info.pastSessionSummary.note}</p>
                    </div>
                  )}

                  {/* Diagnosis badge (modern style) */}
                  {user.info.diagnosis && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm font-semibold mt-2">
                      <FaNotesMedical className="mr-1 text-blue-500" />
                      Diagnosis: <span className="ml-1">{user.info.diagnosis}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <FaNotesMedical className="text-3xl sm:text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-gray-500">No session summary available</p>
                  <p className="text-xs sm:text-sm text-gray-400">Your therapist will add notes after your next session</p>
                </div>
              )}
            </div>

            {/* Therapy Plan Card */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                  <FaClipboardList className="mr-2 text-green-600" />
                  Therapy Plan
                </h2>
                <span className="text-xs sm:text-sm text-gray-500">
                  {user?.info?.therapyPlan?.length || 0} steps
                </span>
              </div>
              
              {user?.info?.therapyPlan && user.info.therapyPlan.length > 0 ? (
                <div className="space-y-3">
                  {user.info.therapyPlan
                    .slice((therapyPlanPage - 1) * itemsPerPage, therapyPlanPage * itemsPerPage)
                    .map((planItem, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                        {(therapyPlanPage - 1) * itemsPerPage + index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-gray-800 font-medium break-words">
                          {typeof planItem === 'string' ? planItem : planItem.step || 'No step description'}
                        </p>
                        {planItem.timestamp && (
                          <p className="text-xs text-gray-500 mt-1">
                            Added: {formatDate(planItem.timestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination for therapy plan */}
                  {user.info.therapyPlan.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t border-gray-200 space-y-2 sm:space-y-0">
                      <button
                        onClick={() => setTherapyPlanPage(prev => Math.max(1, prev - 1))}
                        disabled={therapyPlanPage === 1}
                        className="flex items-center px-3 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                      >
                        <FaChevronLeft className="mr-1" />
                        Previous
                      </button>
                      <span className="text-xs sm:text-sm text-gray-600">
                        Page {therapyPlanPage} of {Math.ceil(user.info.therapyPlan.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() => setTherapyPlanPage(prev => Math.min(Math.ceil(user.info.therapyPlan.length / itemsPerPage), prev + 1))}
                        disabled={therapyPlanPage >= Math.ceil(user.info.therapyPlan.length / itemsPerPage)}
                        className="flex items-center px-3 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                      >
                        Next
                        <FaChevronRight className="ml-1" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <FaClipboardList className="text-3xl sm:text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-gray-500">No therapy plan available</p>
                  <p className="text-xs sm:text-sm text-gray-400">Your therapist will create a personalized plan for you</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6 sm:space-y-8">
            {/* Upcoming Appointments Card */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                  <FaCalendarAlt className="mr-2 text-purple-600" />
                  Upcoming Appointments
                </h2>
                <span className="text-xs sm:text-sm text-gray-500">
                  {upcoming.length} appointment{upcoming.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {upcoming.length > 0 ? (
                <div className="space-y-3">
                  {upcoming
                    .slice((upcomingPage - 1) * itemsPerPage, upcomingPage * itemsPerPage)
                    .map((app) => (
                    <div key={app._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {app.date} at {app.time}
                          </p>
                          <p className="text-xs text-gray-500 font-medium mb-1">
                            Therapist: {app.therapistFullName || app.therapistUsername || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 font-medium mb-1">
                            Session Type: {app.sessionType === 'in-person' ? 'In-person' : app.sessionType === 'online' ? 'Online' : 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Status: <span className={`font-medium ${
                              app.status === 'Accepted' ? 'text-green-600' : 
                              app.status === 'Pending' ? 'text-yellow-600' : 'text-gray-600'
                            }`}>
                              {app.status}
                            </span>
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {app.status === "Pending" ? (
                            app.initiatorRole === "patient" ? (
                              <button
                                onClick={() => {
                                  setCancelAppId(app._id);
                                  setShowCancelModal(true);
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                              >
                                Cancel
                              </button>
                            ) : (
                              <>
                                <button
                                  className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm transition-colors"
                                  onClick={() => acceptAppointment(app._id)}
                                >
                                  Accept
                                </button>
                                <button
                                  className="bg-red-400 hover:bg-red-500 text-white py-1 px-3 rounded text-sm transition-colors"
                                  onClick={() => rejectAppointment(app._id)}
                                >
                                  Reject
                                </button>
                              </>
                            )
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setCancelAppId(app._id);
                                  setShowCancelModal(true);
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                              >
                                Cancel
                              </button>
                              {app.status === "Accepted" && (
                                <button
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                  onClick={() => rescheduleAppointment(app)}
                                >
                                  Reschedule
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination for upcoming appointments */}
                  {upcoming.length > itemsPerPage && (
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setUpcomingPage(prev => Math.max(1, prev - 1))}
                        disabled={upcomingPage === 1}
                        className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                      >
                        <FaChevronLeft className="mr-1" />
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {upcomingPage} of {Math.ceil(upcoming.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() => setUpcomingPage(prev => Math.min(Math.ceil(upcoming.length / itemsPerPage), prev + 1))}
                        disabled={upcomingPage >= Math.ceil(upcoming.length / itemsPerPage)}
                        className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                      >
                        Next
                        <FaChevronRight className="ml-1" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaCalendarAlt className="text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming appointments</p>
                  <p className="text-sm text-gray-400">Schedule your next session with your therapist</p>
                </div>
              )}
            </div>

            {/* Reports Sent by Therapist */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex items-center mb-4">
                <FaEnvelope className="text-green-500 mr-2 text-lg sm:text-xl" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Reports from Your Therapist</h2>
              </div>
              <ReportsFromTherapist username={username} />
            </div>
          </div>
        </div>

        {/* Modals */}
        {reschedulingApp && (
          <RescheduleModal
            appointment={reschedulingApp}
            onClose={() => setReschedulingApp(null)}
            onConfirm={handleConfirmReschedule}
            userRole="patient"
          />
        )}
        
        {showCancelModal && (
          <CancelModal
            onClose={() => {
              setShowCancelModal(false);
              setCancelError("");
            }}
            onConfirm={(reason) => cancelAppointment(cancelAppId, reason)}
            userRole="patient"
            errorMessage={cancelError}
          />
        )}
        
        {showSendReportModal && (
          <SendReportModal
            patientUsername={username}
            therapistUsername={selectedTherapist}
            therapistFullName={selectedTherapistFullName}
            onClose={() => setShowSendReportModal(false)}
            onSend={handleConfirmSendReport}
          />
        )}

        {/* Success/Error Modal */}
        {showModal && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100 relative animate-fade-in flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg ${modalType === 'success' ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-red-400 to-rose-500'}`}> 
                {modalType === 'success' ? (
                  <FaCheck className="text-white text-3xl" />
                ) : (
                  <FaExclamationTriangleIcon className="text-white text-3xl" />
                )}
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${modalType === 'success' ? 'text-green-700' : 'text-red-700'}`}>{modalType === 'success' ? 'Success' : 'Error'}</h2>
              <p className="text-gray-700 mb-6">{modalMessage}</p>
              <button
                className={`bg-gradient-to-r ${modalType === 'success' ? 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' : 'from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'} text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200 text-base`}
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default P_Dashboard;