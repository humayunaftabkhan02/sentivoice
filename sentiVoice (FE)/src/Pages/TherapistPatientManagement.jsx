import React, { useEffect, useState } from "react";
import {
  FaSearch,
  FaFilter,
  FaUser,
  FaCalendarAlt,
  FaFileAlt,
  FaChartLine,
  FaBell,
  FaEnvelope,
  FaEye,
  FaEdit,
  FaHistory,
  FaDownload,
  FaPlus,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaUserMd,
  FaPhone,
  FaEnvelope as FaEmail,
  FaBirthdayCake,
  FaNotesMedical,
  FaHeart,
  FaBrain,
  FaClipboardList,
  FaChartBar,
  FaCalendarCheck,
  FaUserFriends,
  FaShieldAlt,
  FaGraduationCap,
  FaHandHoldingHeart
} from "react-icons/fa";
import logo from "../assets/logo.png";
import Modal from "react-modal";
import LogoutIcon from '../Components/LogOutIcon/LogOutIcon.jsx';
import NotificationBell from '../Components/NotificationBell/NotificationBell.jsx'
import { useNavigate } from "react-router-dom";
import MessageIcon from "../Components/MessageIcon/MessageIcon.jsx";
import { generatePatientProfilePDF, generateAppointmentHistoryPDF } from '../utils/generatePDF';
import { api } from "../utils/api";
import TherapistSidebar from '../Components/TherapistSidebar/TherapistSidebar.jsx';
import { generateCompletePatientReport } from '../utils/generatePDF';
import UserTopBar from '../Components/UserTopBar';

const TherapistPatientManagement = () => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [fullName, setFullName] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [emotionFilter, setEmotionFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [viewProfileModalOpen, setViewProfileModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [manageProfileModalOpen, setManageProfileModalOpen] = useState(false);
  const [managePatient, setManagePatient] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  // Stats states
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    completedSessions: 0,
    upcomingAppointments: 0
  });

  // Pagination states for main patient list
  const [patientCurrentPage, setPatientCurrentPage] = useState(1);
  const [patientTotalPages, setPatientTotalPages] = useState(1);
  const patientsPerPage = 8;

  const navigate = useNavigate();

  const emotionEmojiMap = {
    Happy: "😊",
    Sad: "😢",
    Angry: "😠",
    Calm: "😌",
    Surprised: "😲"
  };
  
  const emotionOptions = Object.keys(emotionEmojiMap);

  // Utility to generate a unique id for therapy plan items
  const generatePlanId = () => Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      api.get(`/api/user-info/${storedUsername}`)
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
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');
    if (storedUsername) setUsername(storedUsername);
    if (storedRole) setRole(storedRole);

    if (storedUsername && storedRole === 'therapist') {
      fetchTherapistPatients(storedUsername);
    }
  }, []);

  // Apply filters whenever search or filter states change
  useEffect(() => {
    applyFilters();
  }, [patients, searchTerm, emotionFilter]);

  const fetchTherapistPatients = async (therapistUsername) => {
    try {
      const data = await api.get(`/api/therapist/${therapistUsername}/patients`);
      const patientsData = data.patients || [];
      console.log('🔍 Fetched patients data:', patientsData.map(p => ({
        username: p.username,
        therapyPlan: p.info?.therapyPlan,
        therapyPlanLength: p.info?.therapyPlan?.length || 0
      })));
      setPatients(patientsData);
      
      // Calculate stats
      const totalPatients = patientsData.length;
      const activePatients = patientsData.filter(p => p.info?.pastSessionSummary?.emotion).length;
      const completedSessions = patientsData.reduce((total, p) => {
        return total + (p.info?.pastSessionSummary ? 1 : 0);
      }, 0);
      
      setStats({
        totalPatients,
        activePatients,
        completedSessions,
        upcomingAppointments: 0 // This would need to be calculated from appointments
      });
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  };

  const applyFilters = () => {
    let filtered = patients.filter(patient => {
      // Name search
      const fullName = `${patient.info?.firstName || ''} ${patient.info?.lastName || ''}`.toLowerCase();
      const matchesSearch = searchTerm === '' || fullName.includes(searchTerm.toLowerCase());
      
      // Emotion filter
      if (emotionFilter !== "all") {
        return matchesSearch && 
          patient.info?.pastSessionSummary?.emotion === emotionFilter;
      }
      
      return matchesSearch;
    });

    setFilteredPatients(filtered);
    
    // Calculate pagination
    const totalPages = Math.ceil(filtered.length / patientsPerPage);
    setPatientTotalPages(totalPages);
    setPatientCurrentPage(1); // Reset to first page when filters change
  };

  // Get current page patients
  const getCurrentPagePatients = () => {
    const startIndex = (patientCurrentPage - 1) * patientsPerPage;
    const endIndex = startIndex + patientsPerPage;
    return filteredPatients.slice(startIndex, endIndex);
  };

  // Handle page change
  const handlePatientPageChange = (newPage) => {
    setPatientCurrentPage(newPage);
  };

  const updateSessionNote = async (appointmentId, note) => {
    try {
      await api.put(`/api/appointments/${appointmentId}/session-note`, { note });
      alert("Session note saved.");
      setAppointmentHistory((prev) =>
        prev.map((a) =>
          a._id === appointmentId
            ? {
                ...a,
                sessionNotes: [...(a.sessionNotes || []), { note, timestamp: new Date() }],
              }
            : a
        )
      );
    } catch (err) {
      console.error("Failed to save note:", err);
      alert("Failed to save note.");
    }
  };
  
  const handleDeleteNote = async (appointmentId, noteIndex) => {
    try {
      await api.delete(`/api/appointments/${appointmentId}/session-note/${noteIndex}`);
      alert("Note deleted successfully.");
      handleViewAppointmentHistory(selectedPatient, currentPage);
    } catch (err) {
      console.error("Error deleting note:", err);
      alert("Failed to delete note.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/');
  };

  // View Profile
  const handleViewProfile = (patient) => {
    setSelectedPatient(patient);
    setViewProfileModalOpen(true);
  };

  // Manage Profile
  const handleManageProfile = (patient) => {
    // Convert therapy plan objects to strings for frontend display
    const processedPatient = {
      ...patient,
      info: {
        ...patient.info,
        therapyPlan: (patient.info?.therapyPlan || []).map(item => {
          if (typeof item === 'string') {
            return { id: generatePlanId(), step: item, timestamp: new Date().toISOString() };
          }
          if (item && typeof item === 'object' && item.step) {
            return {
              id: item.id || generatePlanId(),
              step: item.step,
              timestamp: item.timestamp || new Date().toISOString()
            };
          }
          return { id: generatePlanId(), step: '', timestamp: new Date().toISOString() };
        })
      }
    };
    setManagePatient(processedPatient);
    setManageProfileModalOpen(true);
  };

  const handleViewAppointmentHistory = async (patient, page = 1) => {
    try {
      const data = await api.get(`/api/therapist/${username}/patient/${patient.username}/appointments?page=${page}`);
      setAppointmentHistory(data.appointments || []);
      setSelectedPatient(patient);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setHistoryModalOpen(true);
    } catch (err) {
      console.error("Error fetching history:", err);
      alert("Failed to fetch appointment history.");
    }
  };

  const handleManageSave = async () => {
    if (!managePatient) return;

    const { username: patientUsername } = managePatient;
    const { diagnosis, pastSessionSummary, therapyPlan } = managePatient.info || {};

    try {
      // Add timestamp to pastSessionSummary if it has new data
      const updatedPastSessionSummary = pastSessionSummary?.emotion || pastSessionSummary?.note ? {
        ...pastSessionSummary,
        timestamp: new Date().toISOString()
      } : pastSessionSummary;

      // Only send valid plan items (non-empty step)
      const updatedTherapyPlan = therapyPlan?.filter(item => item.step && item.step.trim() !== '');

      const data = await api.put(`/api/therapist/manage-patient/${patientUsername}`, { 
        diagnosis, 
        pastSessionSummary: updatedPastSessionSummary, 
        therapyPlan: updatedTherapyPlan 
      });
      
      alert("Patient info updated.");
      
      // Update the local state with the new patient data from the backend
      setPatients((prev) =>
        prev.map((p) => (p.username === patientUsername ? data.patient : p))
      );
      
      // Also update the managePatient state to reflect the saved data
      if (data.patient) {
        console.log('🔍 Updated patient data after save:', {
          username: data.patient.username,
          therapyPlan: data.patient.info?.therapyPlan,
          therapyPlanLength: data.patient.info?.therapyPlan?.length || 0
        });
        setManagePatient(data.patient);
      }
      
      // Refresh the patient data to ensure we have the latest information
      await fetchTherapistPatients(username);
      
      setManageProfileModalOpen(false);
    } catch (err) {
      console.error("Error updating patient info:", err);
      alert("Failed to update patient info");
    }
  };

  const getPatientProgress = (patient) => {
    const hasEmotion = patient.info?.pastSessionSummary?.emotion ? 1 : 0;
    const hasTherapyPlan = patient.info?.therapyPlan?.length > 0 ? 1 : 0;
    const hasDiagnosis = patient.info?.diagnosis ? 1 : 0;
    return Math.round(((hasEmotion + hasTherapyPlan + hasDiagnosis) / 3) * 100);
  };

  const handleExportCompleteReport = async (patient) => {
    try {
      // Fetch all appointment history for this patient (without pagination)
      const response = await api.get(`/api/appointments?username=${username}&role=therapist&patientUsername=${patient.username}&all=true`);
      const appointmentHistory = response.appointments || [];
      
      // Generate the complete report
      await generateCompletePatientReport(patient, appointmentHistory);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <TherapistSidebar current="patients" />

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 lg:ml-64">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Patient Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your patients and their therapy plans</p>
          </div>
          <UserTopBar username={username} fullName={fullName} role={"therapist"} profilePicture={profilePicture} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-blue-100">
                <FaUserFriends className="text-lg sm:text-xl lg:text-2xl text-blue-600" />
              </div>
              <div className="ml-2 sm:ml-3 lg:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
              </div>
            </div>
          </div>

          {/* Removed Active Patients card here */}

          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-purple-100">
                <FaChartLine className="text-lg sm:text-xl lg:text-2xl text-purple-600" />
              </div>
              <div className="ml-2 sm:ml-3 lg:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Completed Sessions</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.completedSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 border-l-4 border-orange-500 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-orange-100">
                <FaCalendarCheck className="text-lg sm:text-xl lg:text-2xl text-orange-600" />
              </div>
              <div className="ml-2 sm:ml-3 lg:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Upcoming Appointments</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients by name..."
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 sm:px-4 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
              >
                <FaFilter className="mr-1 sm:mr-2" />
                Filters
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Primary Emotion</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    value={emotionFilter}
                    onChange={(e) => setEmotionFilter(e.target.value)}
                  >
                    <option value="all">All Emotions</option>
                    {emotionOptions.map(emotion => (
                      <option key={emotion} value={emotion}>
                        {emotionEmojiMap[emotion]} {emotion}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Patients Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {getCurrentPagePatients().map((patient) => {
            const progress = getPatientProgress(patient);
            
            return (
              <div
                key={patient._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                {/* Patient Header */}
                <div className="p-4 sm:p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-base sm:text-lg">
                        {patient.info?.firstName?.charAt(0) || patient.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-2 sm:ml-3">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                          {patient.info?.firstName && patient.info?.lastName
                            ? `${patient.info.firstName} ${patient.info.lastName}`
                            : patient.username}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">ID: {patient._id.slice(-8)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3 sm:mb-4">
                    <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1">
                      <span>Profile Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="space-y-1.5 sm:space-y-2">
                    {patient.info?.pastSessionSummary?.emotion && (
                      <div className="flex items-center text-xs sm:text-sm">
                        <FaHeart className="text-red-500 mr-1.5 sm:mr-2" />
                        <span className="text-gray-600">
                          <span className="font-semibold mr-1">Emotion:</span> {emotionEmojiMap[patient.info.pastSessionSummary.emotion]} {patient.info.pastSessionSummary.emotion}
                        </span>
                      </div>
                    )}
                    {patient.info?.diagnosis && (
                      <div className="flex items-center text-xs sm:text-sm">
                        <FaNotesMedical className="text-blue-500 mr-1.5 sm:mr-2" />
                        <span className="text-gray-600"><span className="font-semibold mr-1">Diagnosis:</span> {patient.info.diagnosis}</span>
                      </div>
                    )}
                    {patient.info?.therapyPlan?.length > 0 && (
                      <div className="flex items-center text-xs sm:text-sm">
                        <FaClipboardList className="text-green-500 mr-1.5 sm:mr-2" />
                        <span className="text-gray-600"><span className="font-semibold mr-1">Therapy Plan:</span> {patient.info.therapyPlan.length} plan items</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-3 sm:p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    <button
                      onClick={() => handleViewProfile(patient)}
                      className="flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs sm:text-sm font-medium"
                    >
                      <FaEye className="mr-1 text-xs sm:text-sm" />
                      View
                    </button>
                    <button
                      onClick={() => handleManageProfile(patient)}
                      className="flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-xs sm:text-sm font-medium"
                    >
                      <FaEdit className="mr-1 text-xs sm:text-sm" />
                      Manage
                    </button>
                    <button
                      onClick={() => handleViewAppointmentHistory(patient)}
                      className="flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-xs sm:text-sm font-medium"
                    >
                      <FaHistory className="mr-1 text-xs sm:text-sm" />
                      History
                    </button>
                    <button
                      onClick={() => handleExportCompleteReport(patient)}
                      className="flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-xs sm:text-sm font-medium"
                    >
                      <FaDownload className="mr-1 text-xs sm:text-sm" />
                      Export Profile
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Patient List Pagination */}
        {patientTotalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 sm:space-x-4 mt-6 sm:mt-8">
            <button
              disabled={patientCurrentPage <= 1}
              className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors text-sm"
              onClick={() => handlePatientPageChange(patientCurrentPage - 1)}
            >
              <FaTimes className="mr-1 sm:mr-2 rotate-45 text-xs sm:text-sm" />
              Previous
            </button>
            <span className="text-xs sm:text-sm text-gray-600 px-2 sm:px-3">
              Page {patientCurrentPage} of {patientTotalPages}
            </span>
            <button
              disabled={patientCurrentPage >= patientTotalPages}
              className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors text-sm"
              onClick={() => handlePatientPageChange(patientCurrentPage + 1)}
            >
              Next
              <FaTimes className="ml-1 sm:ml-2 -rotate-45 text-xs sm:text-sm" />
            </button>
          </div>
        )}

        {/* Empty State */}
        {getCurrentPagePatients().length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaUser className="text-2xl sm:text-3xl text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-sm sm:text-base text-gray-600">
              {searchTerm || emotionFilter !== "all" 
                ? "Try adjusting your search or filters."
                : patientTotalPages > 1 
                  ? "No patients on this page."
                  : "You don't have any patients yet."}
            </p>
          </div>
        )}
      </div>

      {/* Modal: View Profile */}
      <Modal
        isOpen={viewProfileModalOpen}
        onRequestClose={() => setViewProfileModalOpen(false)}
        ariaHideApp={false}
        style={{
          overlay: { 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000 
          },
          content: {
            zIndex: 1001,
            width: "90%",
            maxWidth: "600px",
            height: "auto",
            maxHeight: "80vh",
            margin: "auto",
            padding: "0",
            borderRadius: "16px",
            border: "none",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          },
        }}
      >
        {selectedPatient && (
          <div className="bg-white rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-6 sm:py-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center text-lg sm:text-2xl font-bold">
                    {selectedPatient.info?.firstName?.charAt(0) || selectedPatient.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">
                      {selectedPatient.info?.firstName && selectedPatient.info?.lastName
                        ? `${selectedPatient.info.firstName} ${selectedPatient.info.lastName}`
                        : selectedPatient.username}
                    </h2>
                    <p className="text-blue-100 text-sm sm:text-base">Patient Profile</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewProfileModalOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <FaTimes className="text-lg sm:text-xl" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <FaUser className="text-blue-600 mr-2 sm:mr-3" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Full Name</p>
                      <p className="font-semibold text-sm sm:text-base">
                        {selectedPatient.info?.firstName && selectedPatient.info?.lastName
                          ? `${selectedPatient.info.firstName} ${selectedPatient.info.lastName}`
                          : selectedPatient.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <FaBirthdayCake className="text-green-600 mr-2 sm:mr-3" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Age</p>
                      <p className="font-semibold text-sm sm:text-base">{selectedPatient.info?.age || "Not specified"}</p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <FaPhone className="text-purple-600 mr-2 sm:mr-3" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Contact</p>
                      <p className="font-semibold text-sm sm:text-base">{selectedPatient.info?.contact || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <FaNotesMedical className="text-red-600 mr-2 sm:mr-3" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Diagnosis</p>
                      <p className="font-semibold text-sm sm:text-base">{selectedPatient.info?.diagnosis || "Not specified"}</p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <FaHeart className="text-pink-600 mr-2 sm:mr-3" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Primary Emotion</p>
                      <p className="font-semibold text-sm sm:text-base">
                        {selectedPatient.info?.pastSessionSummary?.emotion 
                          ? `${emotionEmojiMap[selectedPatient.info.pastSessionSummary.emotion]} ${selectedPatient.info.pastSessionSummary.emotion}`
                          : "Not assessed"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <FaClipboardList className="text-orange-600 mr-2 sm:mr-3" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Therapy Plan</p>
                      <p className="font-semibold text-sm sm:text-base">{selectedPatient.info?.therapyPlan?.length || 0} items</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Therapy Plan */}
              {selectedPatient.info?.therapyPlan?.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center">
                    <FaClipboardList className="mr-1.5 sm:mr-2 text-orange-600" />
                    Therapy Plan
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    {selectedPatient.info.therapyPlan.map((plan, index) => (
                      <div key={plan.id} className="flex items-start p-2.5 sm:p-3 bg-orange-50 rounded-lg">
                        <span className="text-orange-600 mr-2 sm:mr-3 mt-1">•</span>
                        <span className="text-gray-700 text-sm sm:text-base">
                          {plan.step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Therapist Notes */}
              {selectedPatient.info?.pastSessionSummary?.note && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center">
                    <FaNotesMedical className="mr-1.5 sm:mr-2 text-blue-600" />
                    Therapist Notes
                  </h3>
                  <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-700 text-sm sm:text-base">{selectedPatient.info.pastSessionSummary.note}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setViewProfileModalOpen(false);
                    handleManageProfile(selectedPatient);
                  }}
                  className="flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  <FaEdit className="mr-1.5 sm:mr-2" />
                  Edit Profile
                </button>
                <button
                  onClick={() => setViewProfileModalOpen(false)}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Appointment History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onRequestClose={() => setHistoryModalOpen(false)}
        ariaHideApp={false}
        style={{
          overlay: { 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000 
          },
          content: {
            zIndex: 1001,
            width: "90%",
            maxWidth: "800px",
            height: "auto",
            maxHeight: "80vh",
            margin: "auto",
            padding: "0",
            borderRadius: "16px",
            border: "none",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          },
        }}
      >
        <div className="bg-white rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 sm:px-6 py-4 sm:py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Appointment History</h2>
                <p className="text-purple-100 text-sm sm:text-base">
                  {selectedPatient?.info?.firstName} {selectedPatient?.info?.lastName}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setHistoryModalOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <FaTimes className="text-lg sm:text-xl" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {appointmentHistory.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <FaCalendarAlt className="text-3xl sm:text-4xl text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                <p className="text-sm sm:text-base text-gray-600">This patient hasn't had any appointments yet.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {appointmentHistory.map((app) => (
                  <div key={app._id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-sm transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                        <div className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-medium ${
                          app.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                          app.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {app.status}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          <FaCalendarAlt className="inline mr-1" />
                          {app.date} at {app.time}
                          <span className="ml-2 text-xs text-gray-500">
                            Session Type: {app.sessionType === 'in-person' ? 'In-person' : app.sessionType === 'online' ? 'Online' : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <button
                        className="flex items-center justify-center px-2 py-1 sm:px-3 sm:py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs sm:text-sm"
                        onClick={() => {
                          setSelectedAppointmentId(app._id);
                          setNoteText("");
                          setNoteModalOpen(true);
                        }}
                      >
                        <FaEdit className="mr-1" />
                        Add Note
                      </button>
                    </div>

                    {app.sessionNotes?.length > 0 ? (
                      <div className="space-y-1.5 sm:space-y-2">
                        <h4 className="font-medium text-gray-900 flex items-center text-sm sm:text-base">
                          <FaNotesMedical className="mr-1.5 sm:mr-2 text-blue-600" />
                          Session Notes
                        </h4>
                        {app.sessionNotes.map((n, i) => (
                          <div key={i} className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-gray-700 text-sm sm:text-base">🗒️ {n.note}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(n.timestamp).toLocaleString()}
                                </p>
                              </div>
                              <button
                                className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                                onClick={() => handleDeleteNote(app._id, i)}
                              >
                                <FaTimes className="text-xs sm:text-sm" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs sm:text-sm">No session notes yet.</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 sm:mt-6 pt-4 border-t border-gray-200">
                <button
                  disabled={currentPage <= 1}
                  className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors text-sm"
                  onClick={() => handleViewAppointmentHistory(selectedPatient, currentPage - 1)}
                >
                  <FaTimes className="mr-1 sm:mr-2 rotate-45 text-xs sm:text-sm" />
                  Previous
                </button>
                <span className="text-xs sm:text-sm text-gray-600 px-2 sm:px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors text-sm"
                  onClick={() => handleViewAppointmentHistory(selectedPatient, currentPage + 1)}
                >
                  Next
                  <FaTimes className="ml-1 sm:ml-2 -rotate-45 text-xs sm:text-sm" />
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Session Notes Modal */}
      <Modal
        isOpen={noteModalOpen}
        onRequestClose={() => setNoteModalOpen(false)}
        ariaHideApp={false}
        style={{
          overlay: { 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000 
          },
          content: {
            zIndex: 1001,
            width: "90%",
            maxWidth: "500px",
            height: "auto",
            margin: "auto",
            padding: "0",
            borderRadius: "16px",
            border: "none",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          },
        }}
      >
        <div className="bg-white rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 px-4 sm:px-6 py-4 sm:py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Session Notes</h2>
                <p className="text-green-100 text-sm sm:text-base">Add or manage session notes</p>
              </div>
              <button
                onClick={() => setNoteModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <FaTimes className="text-lg sm:text-xl" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {/* Existing Notes */}
            <div className="mb-4 sm:mb-6">
              <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                <FaNotesMedical className="mr-1.5 sm:mr-2 text-green-600" />
                Existing Notes
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-1.5 sm:space-y-2">
                {appointmentHistory.find(app => app._id === selectedAppointmentId)?.sessionNotes?.length > 0 ? (
                  appointmentHistory.find(app => app._id === selectedAppointmentId)?.sessionNotes.map((n, i) => (
                    <div key={i} className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-gray-700 text-sm sm:text-base">🗒️ {n.note}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(n.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <button
                          className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                          onClick={() => handleDeleteNote(selectedAppointmentId, i)}
                        >
                          <FaTimes className="text-xs sm:text-sm" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-xs sm:text-sm">No notes yet.</p>
                )}
              </div>
            </div>

            {/* Add New Note */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                <FaPlus className="mr-1.5 sm:mr-2 text-green-600" />
                Add New Note
              </h3>
              <textarea
                className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm sm:text-base"
                rows="4"
                value={noteText}
                maxLength={200}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write a new session note (max 200 characters)..."
              />
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 space-y-2 sm:space-y-0">
                <span className="text-xs sm:text-sm text-gray-500">
                  {noteText.length}/200 characters
                </span>
                <div className="flex space-x-2 sm:space-x-3">
                  <button
                    className="flex-1 sm:flex-none px-3 py-2 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    onClick={() => setNoteModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    disabled={!noteText.trim()}
                    onClick={async () => {
                      await updateSessionNote(selectedAppointmentId, noteText);
                      setNoteModalOpen(false);
                      setNoteText("");
                      handleViewAppointmentHistory(selectedPatient, currentPage);
                    }}
                  >
                    <FaPlus className="mr-1.5 sm:mr-2" />
                    Add Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal: Manage Profile */}
      <Modal
        isOpen={manageProfileModalOpen}
        onRequestClose={() => setManageProfileModalOpen(false)}
        ariaHideApp={false}
        style={{
          overlay: { 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000 
          },
          content: {
            zIndex: 1001,
            width: "90%",
            maxWidth: "700px",
            height: "auto",
            maxHeight: "80vh",
            margin: "auto",
            padding: "0",
            borderRadius: "16px",
            border: "none",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          },
        }}
      >
        {managePatient && (
          <div className="bg-white rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-4 sm:py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold">
                    {managePatient.info?.firstName?.charAt(0) || managePatient.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Manage Patient Profile</h2>
                    <p className="text-indigo-100 text-sm sm:text-base">
                      {managePatient.info?.firstName} {managePatient.info?.lastName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setManageProfileModalOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <FaTimes className="text-lg sm:text-xl" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Diagnosis */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center">
                  <FaNotesMedical className="mr-1.5 sm:mr-2 text-indigo-600" />
                  Diagnosis
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                  value={managePatient.info?.diagnosis || ""}
                  onChange={(e) => setManagePatient({
                    ...managePatient,
                    info: {
                      ...managePatient.info,
                      diagnosis: e.target.value,
                    },
                  })}
                  placeholder="Enter patient diagnosis..."
                />
              </div>

              {/* Primary Emotion */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center">
                  <FaHeart className="mr-1.5 sm:mr-2 text-red-600" />
                  Primary Emotion
                </label>
                <select
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                  value={managePatient.info?.pastSessionSummary?.emotion || ""}
                  onChange={(e) =>
                    setManagePatient({
                      ...managePatient,
                      info: {
                        ...managePatient.info,
                        pastSessionSummary: {
                          ...managePatient.info?.pastSessionSummary,
                          emotion: e.target.value
                        }
                      }
                    })
                  }
                >
                  <option value="">Select Primary Emotion</option>
                  {emotionOptions.map((emotion) => (
                    <option key={emotion} value={emotion}>
                      {emotionEmojiMap[emotion]} {emotion}
                    </option>
                  ))}
                </select>
              </div>

              {/* Therapist Note */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <FaNotesMedical className="mr-2 text-blue-600" />
                  Therapist Note
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows="4"
                  value={managePatient.info?.pastSessionSummary?.note || ""}
                  onChange={(e) =>
                    setManagePatient({
                      ...managePatient,
                      info: {
                        ...managePatient.info,
                        pastSessionSummary: {
                          ...managePatient.info?.pastSessionSummary,
                          note: e.target.value
                        }
                      }
                    })
                  }
                  placeholder="Enter therapist notes and observations..."
                />
              </div>

              {/* Therapy Plan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FaClipboardList className="mr-2 text-green-600" />
                  Therapy Plan
                </label>
                <div className="space-y-3">
                  {managePatient.info?.therapyPlan?.map((plan, index) => (
                    <div key={plan.id || index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={plan.step}
                        onChange={(e) => {
                          const updatedPlans = [...managePatient.info.therapyPlan];
                          updatedPlans[index] = {
                            ...updatedPlans[index],
                            step: e.target.value,
                            timestamp: new Date().toISOString() // update timestamp on edit
                          };
                          setManagePatient({
                            ...managePatient,
                            info: {
                              ...managePatient.info,
                              therapyPlan: updatedPlans
                            }
                          });
                        }}
                        placeholder={`Therapy plan item ${index + 1}...`}
                      />
                      <span className="text-xs text-gray-400 min-w-[120px]">{plan.timestamp ? new Date(plan.timestamp).toLocaleString() : ''}</span>
                      <button
                        className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        onClick={() => {
                          const updatedPlans = [...managePatient.info.therapyPlan];
                          updatedPlans.splice(index, 1);
                          setManagePatient({
                            ...managePatient,
                            info: {
                              ...managePatient.info,
                              therapyPlan: updatedPlans
                            }
                          });
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                  <button
                    className="flex items-center px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    onClick={() => {
                      const updatedPlans = [...(managePatient.info?.therapyPlan || [])];
                      updatedPlans.push({ id: generatePlanId(), step: '', timestamp: new Date().toISOString() });
                      setManagePatient({
                        ...managePatient,
                        info: {
                          ...managePatient.info,
                          therapyPlan: updatedPlans
                        }
                      });
                    }}
                  >
                    <FaPlus className="mr-2" />
                    Add Therapy Plan Item
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setManageProfileModalOpen(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManageSave}
                  className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <FaCheck className="mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TherapistPatientManagement;