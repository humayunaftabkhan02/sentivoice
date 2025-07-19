import React, { useState, useEffect } from "react";
import { 
  FaThLarge,
  FaCalendarPlus, 
  FaComments, 
  FaCog,
  FaUser,
  FaSignOutAlt,
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaClock,
  FaUserMd,
  FaPhone,
  FaCalendarAlt,
  FaCreditCard,
  FaMicrophone,
  FaUpload,
  FaTimes
} from 'react-icons/fa';
import logo from '../assets/logo.png';
import LogoutIcon from '../Components/LogOutIcon/LogOutIcon';
import NotificationBell from '../Components/NotificationBell/NotificationBell.jsx'
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import MessageIcon from "../Components/MessageIcon/MessageIcon.jsx";
import AudioRecorderComponent from "../Components/AudioRecorder/AudioRecorder.jsx";
import AudioQualityModal from "../Components/AudioQualityModal/AudioQualityModal.jsx";
import { api } from "../utils/api";
import PatientSidebar from '../Components/PatientSidebar/PatientSidebar.jsx';
import TherapistSelection from '../Components/TherapistSelection/TherapistSelection.jsx';
import UserTopBar from '../Components/UserTopBar';

const checkDuplicateBooking = async (patientUsername, therapistUsername) => {
  try {
    const data = await api.get(`/api/appointments?username=${patientUsername}&role=patient`);
    const existing = data.appointments?.find(
      (a) =>
        a.therapistUsername === therapistUsername &&
        ["Pending", "Accepted"].includes(a.status)
    );
    return !!existing;
  } catch (err) {
    console.error("Error checking duplicate appointment:", err);
    return false;
  }
};

// Utility: Convert "3:00 PM" to Date and generate 30-min time slots
const generateTimes = (start, end) => {
  const parseTime = (str) => {
    const [time, meridian] = str.split(" ");
    let [hour, minute] = time.split(":").map(Number);
    if (meridian === "PM" && hour < 12) hour += 12;
    if (meridian === "AM" && hour === 12) hour = 0;
    return new Date(1970, 0, 1, hour, minute);
  };

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const times = [];
  let current = parseTime(start);
  const endTime = parseTime(end);

  while (current < endTime) {
    times.push(formatTime(current));
    current = new Date(current.getTime() + 30 * 60000); // Add 30 mins
  }

  return times;
};

const BookAppointment = () => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [therapistUsername, setTherapistUsername] = useState("");
  const [sessionType, setSessionType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [savedFullName, setSavedFullName] = useState("");
  const [hasStoredFullName, setHasStoredFullName] = useState(false);
  const [phone, setPhone] = useState("");
  const [hasStoredPhone, setHasStoredPhone] = useState(false);
  const [therapistList, setTherapistList] = useState([]);  
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [slipFile, setSlipFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [paymentAccounts, setPaymentAccounts] = useState({});
  const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(true);

  // Voice recording state
  const [voiceRecording, setVoiceRecording] = useState(null);
  const [recordingSaved, setRecordingSaved] = useState(false);
  const [emotionDetected, setEmotionDetected] = useState(null);

  // Audio quality modal state
  const [showAudioQualityModal, setShowAudioQualityModal] = useState(false);
  const [audioQualityError, setAudioQualityError] = useState(null);

  // Validation
  const paymentOK = paymentMethod !== "" && referenceNo.trim().length >= 6 && slipFile !== null;
  const step1Valid = therapistUsername && sessionType && date && time && phone && fullName;
  const step2Valid = paymentOK;
  const step3Valid = recordingSaved;
  const canSubmit = step1Valid && step2Valid && step3Valid;

  const isValidName = (value) => /^[A-Za-z\s]+$/.test(value);

  const availableDays = [...new Set(availableSlots.map(slot => slot.day))];
  const getTimesForDay = () => {
    const slots = availableSlots.filter(
      (s) => s.day.toLowerCase() === selectedDay.toLowerCase()
    );
    const times = slots.flatMap((s) => generateTimes(s.start, s.end));
  
    const today = new Date().toISOString().split("T")[0];
    if (selectedDate === today) {
      const now = new Date();
      return times.filter((t) => {
        const [timePart, meridian] = t.split(" ");
        let [hour, minute] = timePart.split(":").map(Number);
        if (meridian === "PM" && hour !== 12) hour += 12;
        if (meridian === "AM" && hour === 12) hour = 0;
  
        const slotTime = new Date();
        slotTime.setHours(hour, minute, 0, 0);
  
        return slotTime > now;
      });
    }
  
    return times;
  };

  const navigate = useNavigate();

useEffect(() => {
  let interval;
  if (timerActive && timer > 0) {
    interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
  } else if (timer === 0) {
    setTimerActive(false);
  }
  return () => clearInterval(interval);
}, [timerActive, timer]);

  useEffect(() => {
    if (therapistUsername && date) {
              api.get(`/api/appointments/booked?therapist=${therapistUsername}&date=${date}`)
          .then(data => {
          setBookedSlots(data.bookedTimes || []);
        })
        .catch(console.error);
    }
  }, [therapistUsername, date]);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
      api.get(`/api/user-info/${storedUsername}`)
        .then((data) => {
          setPatientData(data.user);
          if (data.user?.info?.firstName && data.user?.info?.lastName) {
            const name = `${data.user.info.firstName} ${data.user.info.lastName}`;
            setFullName(name);
            setSavedFullName(name);
            setHasStoredFullName(true);
          }
          if (data.user?.info?.contact) {
            setPhone(data.user.info.contact);
            setHasStoredPhone(true);
          }
        });
    }
  }, []);
  
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
          api.get(`/api/user-info/${storedUsername}`)
      .then((data) => {
        if (data.user?.info?.firstName && data.user?.info?.lastName) {
          setFullName(`${data.user.info.firstName} ${data.user.info.lastName}`);
        }
      });
    }
  }, []);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");
    if (storedUsername) setUsername(storedUsername);
    if (storedRole) setRole(storedRole);
    
    // Fetch therapists
    api.get("/api/therapists")
      .then((data) => {
        setTherapistList(data.therapists || []);
      })
      .catch(console.error);
    
    // Fetch payment settings
    api.get("/api/payment-settings")
      .then((settings) => {
        setPaymentAccounts(settings);
      })
      .catch((error) => {
        console.error("Error fetching payment settings:", error);
        setPaymentAccounts({
          easypaisa: {
            name: "SentiVoice Easypaisa",
            number: "0345-0000000",
            amount: "2,500 PKR"
          },
          jazzcash: {
            name: "SentiVoice JazzCash",
            number: "0300-1111111",
            amount: "2,500 PKR"
          }
        });
      })
      .finally(() => {
        setLoadingPaymentSettings(false);
      });
  }, []);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
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

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step === 4) {
      setStep(3);
    } else if (step === 3) {
      setVoiceRecording(null);
      setRecordingSaved(false);
      setEmotionDetected(null);
      setStep(2);
    } else if (step === 2) {
      setPaymentMethod("");
      setReferenceNo("");
      setSlipFile(null);
      setUploadProgress(0);
      setStep(1);
    } else if (step === 1) {
      return;
    }
  };

  // Final submission - process everything at once
  const submitBooking = async () => {
    if (!canSubmit) return;

    try {
      // Convert voice recording to base64 if available
      let voiceRecordingData = null;
      let voiceFileName = null;
      
      if (voiceRecording) {
        try {
          console.log('Converting voice recording to base64...');
          console.log('Voice recording blob size:', voiceRecording.size);
          console.log('Voice recording blob type:', voiceRecording.type);
          
          const arrayBuffer = await voiceRecording.arrayBuffer();
          console.log('Array buffer size:', arrayBuffer.byteLength);
          
          // Fix: Convert to base64 in chunks to avoid stack overflow
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          const chunkSize = 8192; // Process in 8KB chunks
          
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, chunk);
          }
          
          const base64 = btoa(binary);
          voiceRecordingData = base64;
          voiceFileName = `voice_recording_${Date.now()}.wav`;
          
          console.log('Base64 conversion successful, length:', base64.length);
          console.log('Voice file name:', voiceFileName);
        } catch (error) {
          console.error('Error converting voice recording to base64:', error);
        }
      } else {
        console.log('No voice recording available');
      }

      // Step 1: Upload payment with voice recording data
      const fd = new FormData();
      fd.append("slip", slipFile);
      fd.append("patientUsername", username);
      fd.append("method", paymentMethod);
      fd.append("referenceNo", referenceNo);
      fd.append("therapistUsername", therapistUsername);
      fd.append("date", date);
      fd.append("time", time);
      // Normalize sessionType to 'in-person' or 'online'
      let normalizedSessionType = sessionType.trim().toLowerCase();
      if (normalizedSessionType === 'in-person session' || normalizedSessionType === 'in-person') normalizedSessionType = 'in-person';
      else if (normalizedSessionType === 'online session' || normalizedSessionType === 'online') normalizedSessionType = 'online';
      else normalizedSessionType = '';
      fd.append("sessionType", normalizedSessionType);
      
      // Add voice recording data if available
      if (voiceRecordingData && voiceFileName) {
        fd.append("voiceRecordingData", voiceRecordingData);
        fd.append("voiceFileName", voiceFileName);
        console.log('Voice recording data added to payment request');
      } else {
        console.log('No voice recording data to add to payment request');
      }

      // Debug: Log FormData contents
      console.log('🔍 FormData contents:');
      console.log('📄 Slip file:', slipFile ? `${slipFile.name} (${slipFile.size} bytes)` : 'No slip file');
      console.log('👤 Patient username:', username);
      console.log('💳 Payment method:', paymentMethod);
      console.log('🔢 Reference number:', referenceNo);
      console.log('👨‍⚕️ Therapist username:', therapistUsername);
      console.log('📅 Date:', date);
      console.log('⏰ Time:', time);
      console.log('📋 Session type:', normalizedSessionType);
      console.log('🎤 Voice recording data length:', voiceRecordingData ? voiceRecordingData.length : 0);
      console.log('📄 Voice file name:', voiceFileName);

      console.log('Submitting payment with FormData...');
      const paymentResponse = await api.post("/api/payments", fd);
      console.log('Payment response:', paymentResponse);

      // Success - show comprehensive message
      const therapistName = therapistList.find(t => t.username === therapistUsername)?.info?.firstName && 
        therapistList.find(t => t.username === therapistUsername)?.info?.lastName
        ? `Dr. ${therapistList.find(t => t.username === therapistUsername).info.firstName} ${therapistList.find(t => t.username === therapistUsername).info.lastName}`
        : `Dr. ${therapistUsername}`;

      const voiceText = voiceRecording ? '\n• Voice recording saved for analysis' : '\n• No voice recording provided';
      
      alert(
        `✅ Booking submitted successfully!\n\n` +
        `📅 Appointment Details:\n` +
        `• Date: ${date} at ${time}\n` +
        `• Therapist: ${therapistName}\n` +
        `• Session Type: ${sessionType}\n\n` +
        `💰 Payment Status:\n` +
        `• Payment uploaded and sent for admin approval\n` +
        `• You'll be notified once payment is verified\n\n` +
        `🎤 Voice Analysis:\n` +
        `${voiceText}\n` +
        `• Voice analysis will be processed after admin approval\n` +
        `• Report will be sent to therapist automatically\n\n` +
        `📋 Next Steps:\n` +
        `• Admin will review your payment\n` +
        `• Therapist will be notified once payment is approved\n` +
        `• Voice analysis report will be sent to therapist after admin approval\n` +
        `• You'll receive confirmation when everything is ready`
      );

      navigate("/patient-dashboard");
    } catch (err) {
      console.error("Booking submission failed:", err);
      alert("❌ Booking submission failed. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/');
  };

  const isValidDate = (selectedDateStr) => {
    const today = new Date();
    const selected = new Date(selectedDateStr);
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);
  
    if (selected < new Date().setHours(0,0,0,0)) {
      alert("❌ You cannot book for a past date.");
      return false;
    }
  
    if (selected > threeMonthsLater) {
      alert("❌ You can only book within 3 months from today.");
      return false;
    }
  
    return true;
  };  

  const handleReportSent = (emotion, therapistUsername, voiceBlob) => {
    // Store the voice recording blob for later processing
    if (voiceBlob) {
      setVoiceRecording(voiceBlob);
    }
    setRecordingSaved(true);
    
  };

  const handleAudioQualityError = (error) => {
    console.log('🎯 handleAudioQualityError called with:', error);
    setAudioQualityError(error);
    setShowAudioQualityModal(true);
    console.log('✅ Modal should now be visible');
  };

  const handleReRecord = () => {
    setShowAudioQualityModal(false);
    setAudioQualityError(null);
    setVoiceRecording(null);
    setRecordingSaved(false);
    // Go back to step 3 to re-record
    setStep(3);
  };

  const handleContinueAnyway = () => {
    setShowAudioQualityModal(false);
    setAudioQualityError(null);
    // Continue with the booking despite audio quality issues
  };

  const stepTitles = [
    "Appointment Details",
    "Payment Information", 
    "Voice Recording",
    "Submit Booking"
  ];

  const stepDescriptions = [
    "Select your therapist and session details",
    "Upload payment screenshot and details",
    "Record your voice for emotion analysis",
    "Review and submit your booking"
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <PatientSidebar current="appointments" />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              Book Your Session
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Schedule your therapy appointment in just a few steps</p>
          </div>
          <UserTopBar username={username} fullName={fullName} role={role} profilePicture={profilePicture} />
        </div>

        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile: Vertical Stack */}
          <div className="sm:hidden">
            <div className="flex flex-col items-center space-y-4">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center w-full max-w-xs">
                  <div className="flex items-center space-x-3 w-full">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 flex-shrink-0 ${
                        step >= stepNumber
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step > stepNumber ? (
                        <FaCheck className="text-white" />
                      ) : (
                        stepNumber
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`text-xs font-medium ${
                        step >= stepNumber ? "text-blue-600" : "text-gray-500"
                      }`}>
                        {stepTitles[stepNumber - 1]}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {stepDescriptions[stepNumber - 1]}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: Horizontal Layout */}
          <div className="hidden sm:flex items-center justify-center space-x-4 lg:space-x-8">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      step >= stepNumber
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step > stepNumber ? (
                      <FaCheck className="text-white" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-xs font-medium ${
                      step >= stepNumber ? "text-blue-600" : "text-gray-500"
                    }`}>
                      {stepTitles[stepNumber - 1]}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {stepDescriptions[stepNumber - 1]}
                    </div>
                  </div>
                </div>
                {stepNumber < 4 && (
                  <div
                    className={`w-12 lg:w-16 h-1 mx-4 transition-all duration-300 ${
                      step > stepNumber ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Booking Form */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
            {/* Step Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">
                    {stepTitles[step - 1]}
                  </h2>
                  <p className="text-blue-100 text-sm sm:text-base">
                    {stepDescriptions[step - 1]}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-blue-100 text-xs sm:text-sm">Step {step} of 4</div>
                  <div className="text-white font-semibold text-sm sm:text-base">
                    {Math.round((step / 4) * 100)}% Complete
                  </div>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="p-4 sm:p-6 lg:p-8">
            {step === 1 && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        <FaUser className="inline mr-2 text-blue-600" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                          hasStoredFullName 
                            ? 'bg-gray-50 border-gray-200 cursor-not-allowed' 
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                        value={fullName}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!hasStoredFullName && (val === "" || isValidName(val))) {
                            setFullName(val);
                          }
                        }}
                        readOnly={hasStoredFullName}
                      />
                      {!hasStoredFullName && fullName && !isValidName(fullName) && (
                        <p className="text-red-500 text-xs sm:text-sm mt-1">Only letters and spaces are allowed.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        <FaPhone className="inline mr-2 text-blue-600" />
                        Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="03XXXXXXXXX or +923XXXXXXXXX"
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                          hasStoredPhone 
                            ? 'bg-gray-50 border-gray-200 cursor-not-allowed' 
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!hasStoredPhone && /^(\+)?[0-9]*$/.test(val)) {
                            setPhone(val);
                          }
                        }}
                        readOnly={hasStoredPhone}
                      />
                      {!hasStoredPhone && phone && !/^((\+92)|(0))3[0-9]{9}$/.test(phone) && (
                        <p className="text-red-500 text-xs sm:text-sm mt-1">
                          Invalid phone number. Use 03XXXXXXXXX or +923XXXXXXXXX format.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Therapist Selection */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      <FaUserMd className="inline mr-2 text-blue-600" />
                      Select Therapist
                    </label>
                    <TherapistSelection
                      therapistList={therapistList}
                      selectedTherapist={therapistUsername}
                      onTherapistSelect={(username) => {
                        setTherapistUsername(username);
                        const selectedTherapist = therapistList.find(t => t.username === username);
                        // Set available slots based on current sessionType
                        if (selectedTherapist?.info?.availability) {
                          if (sessionType === 'in-person') {
                            setAvailableSlots(selectedTherapist.info.availability.inPerson || []);
                          } else if (sessionType === 'online') {
                            setAvailableSlots(selectedTherapist.info.availability.online || []);
                          } else {
                            setAvailableSlots([]);
                          }
                        } else {
                          setAvailableSlots([]);
                        }
                      }}
                      onAvailabilityUpdate={() => {}}
                    />
                  </div>

                  {/* Session Type */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      <FaComments className="inline mr-2 text-blue-600" />
                      Session Type
                    </label>
                    <select
                      value={sessionType}
                      onChange={(e) => {
                        setSessionType(e.target.value);
                        // Update available slots based on session type and selected therapist
                        const selectedTherapist = therapistList.find(t => t.username === therapistUsername);
                        if (selectedTherapist?.info?.availability) {
                          if (e.target.value === 'in-person' || e.target.value === 'In-person') {
                            setAvailableSlots(selectedTherapist.info.availability.inPerson || []);
                          } else if (e.target.value === 'online' || e.target.value === 'Online') {
                            setAvailableSlots(selectedTherapist.info.availability.online || []);
                          } else {
                            setAvailableSlots([]);
                          }
                        } else {
                          setAvailableSlots([]);
                        }
                      }}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      required
                    >
                      <option value="">Select Session Type</option>
                      <option value="online">Online</option>
                      <option value="in-person">In-person</option>
                    </select>
                  </div>

                  {/* Date and Time Selection */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        <FaCalendarAlt className="inline mr-2 text-blue-600" />
                        Appointment Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 border-gray-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                        value={date}
                        onChange={(e) => {
                          const selected = e.target.value;
                          setDate(selected);
                          setSelectedDate(selected);
                          const selectedDay = new Date(selected).toLocaleDateString("en-US", {
                            weekday: "long"
                          });
                          setSelectedDay(selectedDay);
                        }}
                        required
                        min={new Date().toISOString().split("T")[0]}
                        max={new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split("T")[0]}
                        onKeyDown={(e) => e.preventDefault()}
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        <FaClock className="inline mr-2 text-blue-600" />
                        Available Time
                      </label>
                      <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 border-gray-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                        required
                      >
                        <option value="">Select available time</option>
                        {getTimesForDay(selectedDay).map((slot, idx) => {
                          const isBooked = bookedSlots.includes(slot);
                          return (
                            <option key={idx} value={slot} disabled={isBooked}>
                              {isBooked ? `🛑 ${slot} (Booked)` : slot}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Continue Button */}
                  <div className="flex justify-end pt-4 sm:pt-6">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!therapistUsername || !sessionType || !date || !time || !phone) {
                          alert("Please fill out all required fields before proceeding.");
                          return;
                        }
                        
                        if (!/^((\+92)|(0))3[0-9]{9}$/.test(phone)) {
                          alert("Invalid phone number. Use 03XXXXXXXXX or +923XXXXXXXXX format.");
                          return;
                        }
                      
                        const hasDuplicate = await checkDuplicateBooking(username, therapistUsername);
                        if (hasDuplicate) {
                          alert("You already have a pending or accepted appointment with this therapist.");
                          return;
                        }
                      
                        nextStep();
                      }}
                      className="flex items-center px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      Continue to Payment
                      <FaArrowRight className="ml-2" />
                    </button>
                  </div>
              </div>
            )}

            {step === 2 && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Payment Method Selection */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      <FaCreditCard className="inline mr-2 text-blue-600" />
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        setReferenceNo("");
                        setSlipFile(null);
                        setUploadProgress(0);
                      }}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 border-gray-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      disabled={loadingPaymentSettings}
                    >
                      <option value="">
                        {loadingPaymentSettings ? "Loading payment methods..." : "Select payment method"}
                      </option>
                      {Object.keys(paymentAccounts).map((method) => (
                        <option key={method} value={method}>
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account Details */}
                  {paymentMethod && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <FaCreditCard className="mr-2 text-blue-600" />
                        Payment Account Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                          <div className="text-xs sm:text-sm text-gray-600 mb-1">Account Name</div>
                          <div className="font-semibold text-gray-800 text-sm sm:text-base">
                            {paymentAccounts[paymentMethod]?.name || 'N/A'}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                          <div className="text-xs sm:text-sm text-gray-600 mb-1">Account Number</div>
                          <div className="font-semibold text-gray-800 text-sm sm:text-base">
                            {paymentAccounts[paymentMethod]?.number || 'N/A'}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 sm:col-span-2 lg:col-span-1">
                          <div className="text-xs sm:text-sm text-gray-600 mb-1">Amount</div>
                          <div className="font-semibold text-green-600 text-sm sm:text-base">
                            {paymentAccounts[paymentMethod]?.amount || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reference Number */}
                  {paymentMethod && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Transaction Reference Number
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your transaction reference number"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 border-gray-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      />
                    </div>
                  )}

                  {/* File Upload */}
                  {paymentMethod && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        <FaUpload className="inline mr-2 text-blue-600" />
                        Payment Screenshot
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setSlipFile(file);
                              setUploadProgress(30);
                              setTimeout(() => setUploadProgress(70), 300);
                              setTimeout(() => setUploadProgress(100), 600);
                            } else {
                              setSlipFile(null);
                              setUploadProgress(0);
                            }
                          }}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <FaUpload className="mx-auto text-2xl sm:text-3xl text-gray-400 mb-4" />
                          <div className="text-gray-600 text-sm sm:text-base">
                            <span className="font-medium">Click to upload</span> or drag and drop
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 mt-1">
                            PNG, JPG, JPEG up to 10MB
                          </div>
                        </label>
                      </div>
                      
                      {/* Upload Progress */}
                      {uploadProgress > 0 && (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1">
                            <span>
                              {uploadProgress === 100 ? (
                                <span className="text-green-600 font-medium">Upload Complete</span>
                              ) : (
                                "Uploading..."
                              )}
                            </span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                uploadProgress === 100 ? 'bg-green-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          {uploadProgress === 100 && (
                            <div className="mt-2 text-xs sm:text-sm text-green-600 flex items-center">
                              <FaCheck className="mr-1" />
                              File uploaded successfully
                            </div>
                          )}
                        </div>
                      )}

                      {/* File Preview */}
                      {slipFile && (
                        <div className="mt-4 relative inline-block">
                          <img
                            src={URL.createObjectURL(slipFile)}
                            alt="Payment Receipt"
                            className="max-w-[150px] sm:max-w-[200px] rounded-lg border border-gray-300 shadow-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSlipFile(null);
                              setUploadProgress(0);
                              const fileInput = document.getElementById('file-upload');
                              if (fileInput) {
                                fileInput.value = '';
                              }
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                            title="Remove file"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between pt-4 sm:pt-6 space-y-3 sm:space-y-0">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm sm:text-base"
                    >
                      <FaArrowLeft className="mr-2" />
                      Back
                    </button>
                    
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!step2Valid}
                      className={`flex items-center justify-center px-6 sm:px-8 py-2 sm:py-3 font-semibold rounded-lg transition-all duration-200 text-sm sm:text-base ${
                        step2Valid 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {step2Valid ? (
                        <>
                          Continue to Emotion Assessment
                          <FaArrowRight className="ml-2" />
                        </>
                      ) : (
                        'Complete payment details to continue'
                      )}
                    </button>
                  </div>
              </div>
            )}

            {step === 3 && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Voice Recording Section */}
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <FaMicrophone className="text-xl sm:text-2xl text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                      Emotion Assessment
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
                      Help your therapist understand your emotional state by answering these questions through voice recording
                    </p>
                  </div>

                  {/* Emotion Assessment Questions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {/* Question 1 */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center mb-3 sm:mb-4">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm mr-2 sm:mr-3">
                          1
                        </div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-800">Current Mood</h4>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">
                        "How are you feeling right now? Describe your current emotional state and what might be contributing to it."
                      </p>
                      <div className="flex items-center text-xs sm:text-sm text-blue-600">
                        <FaMicrophone className="mr-2" />
                        <span>Voice response</span>
                      </div>
                    </div>

                    {/* Question 2 */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center mb-3 sm:mb-4">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm mr-2 sm:mr-3">
                          2
                        </div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-800">Recent Challenges</h4>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">
                        "What challenges or difficulties have you been facing recently? How have these affected your emotional well-being?"
                      </p>
                      <div className="flex items-center text-xs sm:text-sm text-green-600">
                        <FaMicrophone className="mr-2" />
                        <span>Voice response</span>
                      </div>
                    </div>

                    {/* Question 3 */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center mb-3 sm:mb-4">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm mr-2 sm:mr-3">
                          3
                        </div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-800">Coping Mechanisms</h4>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">
                        "What strategies or activities do you use to cope with stress or difficult emotions? How effective have they been?"
                      </p>
                      <div className="flex items-center text-xs sm:text-sm text-purple-600">
                        <FaMicrophone className="mr-2" />
                        <span>Voice response</span>
                      </div>
                    </div>

                    {/* Question 4 */}
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center mb-3 sm:mb-4">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm mr-2 sm:mr-3">
                          4
                        </div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-800">Therapy Goals</h4>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">
                        "What do you hope to achieve through therapy? What changes would you like to see in your emotional well-being?"
                      </p>
                      <div className="flex items-center text-xs sm:text-sm text-orange-600">
                        <FaMicrophone className="mr-2" />
                        <span>Voice response</span>
                      </div>
                    </div>
                  </div>

                  {/* Recording Instructions */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex items-start">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mr-2 sm:mr-3 mt-1">
                        <FaMicrophone />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Recording Instructions</h4>
                        <ul className="text-gray-700 space-y-1 text-xs sm:text-sm">
                          <li>• Find a quiet, comfortable space for recording</li>
                          <li>• Speak clearly and naturally - there's no right or wrong way to answer</li>
                          <li>• Take your time to think about each question</li>
                          <li>• Record for <strong>at least 10 seconds</strong> and <strong>under 2 minutes</strong> for optimal analysis</li>
                          <li>• Your voice recording will be analyzed for emotional patterns</li>
                          <li>• This information helps your therapist provide better care</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Audio Recorder */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <div className="text-center mb-4">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Ready to Record?</h4>
                      <p className="text-sm sm:text-base text-gray-600">
                        Click the record button below and answer all 4 questions in one continuous recording
                      </p>
                    </div>
                    
                    <div className="flex justify-center">
                      <AudioRecorderComponent
                        therapistUsername={therapistUsername}
                        therapistFullName={therapistList.find(t => t.username === therapistUsername)?.info?.firstName && therapistList.find(t => t.username === therapistUsername)?.info?.lastName
                          ? `Dr. ${therapistList.find(t => t.username === therapistUsername).info.firstName} ${therapistList.find(t => t.username === therapistUsername).info.lastName}`
                          : `Dr. ${therapistUsername}`}
                        patientData={patientData}
                        onReportSent={handleReportSent}
                        onAudioQualityError={handleAudioQualityError}
                      />
                    </div>
                  </div>

                  {recordingSaved && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <FaCheck className="text-green-600 mr-3 text-lg sm:text-xl" />
                        <div>
                          <span className="text-green-800 font-semibold text-sm sm:text-base">
                            Voice recording saved successfully
                          </span>
                          <p className="text-green-700 text-xs sm:text-sm mt-1">
                            Your emotional assessment has been recorded and will be analyzed for your therapist
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between pt-4 sm:pt-6 space-y-3 sm:space-y-0">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm sm:text-base"
                    >
                      <FaArrowLeft className="mr-2" />
                      Back
                    </button>
                    
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!step3Valid}
                      className={`flex items-center justify-center px-6 sm:px-8 py-2 sm:py-3 font-semibold rounded-lg transition-all duration-200 text-sm sm:text-base ${
                        step3Valid 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {step3Valid ? (
                        <>
                          Continue to Review
                          <FaArrowRight className="ml-2" />
                        </>
                      ) : (
                        'Record your voice to continue'
                      )}
                    </button>
                  </div>
              </div>
            )}

              {step === 4 && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Review Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FaCheck className="mr-2 text-blue-600" />
                      Review Your Booking
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {/* Appointment Details */}
                      <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">Appointment Details</h4>
                        <div className="space-y-2 text-xs sm:text-sm">
                          <div><span className="font-medium">Date:</span> {date}</div>
                          <div><span className="font-medium">Time:</span> {time}</div>
                          <div><span className="font-medium">Session Type:</span> {sessionType}</div>
                          <div><span className="font-medium">Therapist:</span> {
                            therapistList.find(t => t.username === therapistUsername)?.info?.firstName && 
                            therapistList.find(t => t.username === therapistUsername)?.info?.lastName
                              ? `Dr. ${therapistList.find(t => t.username === therapistUsername).info.firstName} ${therapistList.find(t => t.username === therapistUsername).info.lastName}`
                              : `Dr. ${therapistUsername}`
                          }</div>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">Payment Details</h4>
                        <div className="space-y-2 text-xs sm:text-sm">
                          <div><span className="font-medium">Method:</span> {paymentMethod}</div>
                          <div><span className="font-medium">Reference:</span> {referenceNo}</div>
                          <div><span className="font-medium">Amount:</span> {paymentAccounts[paymentMethod]?.amount || 'N/A'}</div>
                          <div className="text-green-600 font-medium">✓ Payment uploaded</div>
                        </div>
                      </div>
                    </div>

                    {/* Emotion Assessment Status */}
                    <div className="mt-4 bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">Emotion Assessment</h4>
                      <div className="text-xs sm:text-sm">
                        <div className="text-green-600 font-medium">✓ Voice recording saved</div>
                        <div className="text-gray-600 mt-1">Your responses to the 4 assessment questions will be analyzed for emotional patterns</div>
                        <div className="mt-2 text-xs text-gray-500">
                          Questions covered: Current Mood, Recent Challenges, Coping Mechanisms, Therapy Goals
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between pt-4 sm:pt-6 space-y-3 sm:space-y-0">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm sm:text-base"
                    >
                      <FaArrowLeft className="mr-2" />
                      Back
                    </button>
                    
                    <button
                      type="button"
                      onClick={submitBooking}
                      disabled={!canSubmit}
                      className={`flex items-center justify-center px-6 sm:px-8 py-2 sm:py-3 font-semibold rounded-lg transition-all duration-200 text-sm sm:text-base ${
                        canSubmit 
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {canSubmit ? (
                        <>
                          Submit Booking
                          <FaCheck className="ml-2" />
                        </>
                      ) : (
                        'Complete all steps to submit'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Audio Quality Modal */}
      <AudioQualityModal
        isOpen={showAudioQualityModal}
        onClose={handleContinueAnyway}
        onReRecord={handleReRecord}
        qualityAnalysis={audioQualityError?.quality_analysis}
        errorType={audioQualityError?.error_type}
      />
    </div>
  );
};

export default BookAppointment;