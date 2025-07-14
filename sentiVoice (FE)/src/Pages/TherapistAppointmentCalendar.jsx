import React, { useEffect, useState } from "react";
import { 
  FaThLarge, 
  FaCalendarAlt, 
  FaUser, 
  FaComments, 
  FaCog, 
  FaSignOutAlt, 
  FaBell, 
  FaEnvelope,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
  FaEye,
  FaEdit,
  FaDownload,
  FaFilter,
  FaPlus
} from "react-icons/fa";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import logo from "../assets/logo.png";
import Modal from "react-modal";
import LogoutIcon from '../Components/LogOutIcon/LogOutIcon.jsx';
import NotificationBell from '../Components/NotificationBell/NotificationBell.jsx'
import { useNavigate } from 'react-router-dom';
import RescheduleModal from "../Components/RescheduleModal/RescheduleModal.jsx";
import CancelModal from "../Components/CancelModal/CancelModal.jsx";
import MessageIcon from "../Components/MessageIcon/MessageIcon.jsx";
import { api } from "../utils/api";
import TherapistSidebar from '../Components/TherapistSidebar/TherapistSidebar.jsx';
import UserTopBar from '../Components/UserTopBar';

// Utility to convert "HH:MM AM/PM" to 24-hour "HH:MM"
const parseTimeTo24Hour = (timeStr) => {
  const [time, ampm] = timeStr.split(" ");
  if (!time) return "00:00";
  let [hours, minutes] = time.split(":");
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);

  if (ampm && ampm.toUpperCase() === "PM" && hours < 12) {
    hours += 12;
  } else if (ampm && ampm.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const TherapistAppointmentCalendar = () => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [reschedulingApp, setReschedulingApp] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelAppId, setCancelAppId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState(null);

  // schedule modal
  const [scheduleModalIsOpen, setScheduleModalIsOpen] = useState(false);
  const [newPatientUsername, setNewPatientUsername] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  // event click
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentOptionsModalIsOpen, setAppointmentOptionsModalIsOpen] = useState(false);

  // reschedule modal
  const [rescheduleModalIsOpen, setRescheduleModalIsOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  // Calendar view state
  const [calendarView, setCalendarView] = useState("dayGridMonth");

  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
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
      fetchAppointments(storedUsername);
    }
  }, []);

  const fetchAppointments = async (therapistUsername) => {
    try {
      setLoading(true);
      const data = await api.get(`/api/appointments?username=${therapistUsername}&role=therapist`);
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/');
  };

  // Calculate appointment statistics
  const getAppointmentStats = () => {
    const total = appointments.length;
    const accepted = appointments.filter(a => a.status === 'Accepted').length;
    const pending = appointments.filter(a => a.status === 'Pending').length;
    const finished = appointments.filter(a => a.status === 'Finished').length;
    const cancelled = appointments.filter(a => a.status === 'Canceled').length;

    return { total, accepted, pending, finished, cancelled };
  };

  // SCHEDULE
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!newPatientUsername || !newDate || !newTime) return;

    try {
      await api.post('/api/appointments', {
        patientUsername: newPatientUsername,
        therapistUsername: username,
        date: newDate,
        time: newTime,
        initiatorRole: 'therapist'
      });
      alert("Appointment scheduled (Pending). The patient sees Accept/Reject.");
      setScheduleModalIsOpen(false);
      setNewPatientUsername("");
      setNewDate("");
      setNewTime("");
      fetchAppointments(username);
    } catch (err) {
      console.error("Error scheduling:", err);
      alert("Failed to schedule appointment");
    }
  };

  // EVENT CLICK => open options
  const handleEventClick = (info) => {
    const apptId = info.event.id;
    const found = appointments.find(a => a._id === apptId);
    setSelectedAppointment(found);
    setAppointmentOptionsModalIsOpen(true);
  };

  // CANCEL
  const openCancelModal = () => {
    if (selectedAppointment) {
      setCancelAppId(selectedAppointment._id);
      setShowCancelModal(true);
      setAppointmentOptionsModalIsOpen(false);
    }
  };
  
  const cancelAppointment = async (appointmentId, reason) => {
    try {
      await api.put(`/api/appointments/${appointmentId}/cancel`, { reason });
      alert("Appointment canceled.");
      fetchAppointments(username);
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Failed to cancel.");
    }
    setShowCancelModal(false);
    setCancelAppId(null);
  };

  // RESCHEDULE
  const handleReschedule = () => {
    if (selectedAppointment) {
      setReschedulingApp(selectedAppointment);
      setAppointmentOptionsModalIsOpen(false);
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

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    try {
      const res = await api.put(`/api/appointments/${selectedAppointment._id}/reschedule`, {
        newDate: rescheduleDate,
        newTime: rescheduleTime,
        reason: "Rescheduled by therapist",
        reschedulerRole: 'therapist'  // <--- important
      });
      if (res.ok) {
        alert("Appointment rescheduled (Pending). Patient must accept/reject.");
        setRescheduleModalIsOpen(false);
        setSelectedAppointment(null);
        fetchAppointments(username);
      } else {
        alert("Failed to reschedule.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const stats = getAppointmentStats();

  return (
    <div className="flex min-h-screen bg-[#EBEDE9]">
      <TherapistSidebar current="calendar" />
      
      {/* Main Content */}
      <div className="flex-1 p-8 space-y-6 ml-64">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Appointment Calendar
            </h1>
            <p className="text-gray-600">Manage and view your therapy appointments</p>
          </div>
          <UserTopBar username={username} fullName={fullName} role={"therapist"} profilePicture={profilePicture} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <FaCalendarAlt className="text-2xl text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <FaCheckCircle className="text-2xl text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-gray-900">{stats.accepted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <FaExclamationTriangle className="text-2xl text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-gray-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gray-100">
                <FaClock className="text-2xl text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Finished</p>
                <p className="text-2xl font-bold text-gray-900">{stats.finished}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <FaTimes className="text-2xl text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Canceled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Calendar View</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="ml-3 text-gray-600">Loading appointments...</p>
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
              initialView={calendarView}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
              }}
              height="auto"
              events={appointments
                .filter((appointment) => ["Accepted", "Pending", "Finished"].includes(appointment.status))
                .map((appointment) => {
                  let color = "#facc15"; // default = Pending (yellow)
                  if (appointment.status === "Accepted") color = "#4ade80"; // green
                  else if (appointment.status === "Finished") color = "#9ca3af"; // gray for Finished
                  return {
                    id: appointment._id,
                    title: `${appointment.patientFullName || appointment.patientUsername} @ ${appointment.time}`,
                    start: `${appointment.date}T${parseTimeTo24Hour(appointment.time)}`,
                    allDay: false,
                    backgroundColor: color,
                    borderColor: color,
                    textColor: '#ffffff',
                    extendedProps: {
                      status: appointment.status,
                      patientName: appointment.patientFullName || appointment.patientUsername,
                      time: appointment.time
                    }
                  };
                })}
              selectable={true}
              eventClick={handleEventClick}
              eventDisplay="block"
              dayMaxEvents={true}
              moreLinkClick="popover"
              eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
            />
          )}
        </div>
      </div>

      {/* Modal: Appointment Options */}
      <Modal
        isOpen={appointmentOptionsModalIsOpen}
        onRequestClose={() => setAppointmentOptionsModalIsOpen(false)}
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
        {selectedAppointment && (
          <div className="bg-white rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Appointment Details</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {selectedAppointment.patientFullName || selectedAppointment.patientUsername}
                  </p>
                </div>
                <button
                  onClick={() => setAppointmentOptionsModalIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold">{selectedAppointment.date}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-semibold">{selectedAppointment.time}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                  <p className="text-sm text-gray-600">Session Type</p>
                  <p className="font-semibold">
                    {selectedAppointment.sessionType === 'in-person' ? 'In-person' : selectedAppointment.sessionType === 'online' ? 'Online' : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Status</p>
                <div className="flex items-center mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedAppointment.status === 'Accepted' 
                      ? 'bg-green-100 text-green-800'
                      : selectedAppointment.status === 'Pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedAppointment.status}
                  </span>
                </div>
              </div>

              {selectedAppointment?.status !== "Finished" ? (
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={openCancelModal}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancel Appointment
                  </button>
                  <button
                    onClick={handleReschedule}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Reschedule
                  </button>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    This appointment is marked as finished and can no longer be modified.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Reschedule */}
      <Modal
        isOpen={rescheduleModalIsOpen}
        onRequestClose={() => setRescheduleModalIsOpen(false)}
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
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Reschedule Appointment</h2>
                <p className="text-blue-100 text-sm mt-1">
                  Update appointment date and time
                </p>
              </div>
              <button
                onClick={() => setRescheduleModalIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Date
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Time (e.g. 02:00 PM)
                </label>
                <input
                  type="text"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  required
                  placeholder="02:00 PM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => setRescheduleModalIsOpen(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      {reschedulingApp && (
        <RescheduleModal
          appointment={reschedulingApp}
          onClose={() => setReschedulingApp(null)}
          onConfirm={handleConfirmReschedule}
        />
      )}

      {showCancelModal && (
        <CancelModal
          onClose={() => setShowCancelModal(false)}
          onConfirm={(reason) => cancelAppointment(cancelAppId, reason)}
        />
      )}
    </div>
  );
};

export default TherapistAppointmentCalendar;