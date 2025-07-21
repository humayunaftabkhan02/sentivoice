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
  FaTimes,
  FaExclamationTriangle
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
import PhoneInput from "react-phone-input-2";
import { validatePhoneNumber, DEFAULT_COUNTRY } from "../utils/phoneValidation";

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

// [NEW] Utility to compare times (assumes 12-hour format with AM/PM)
function isTimeOverlap(time1, time2) {
  // Both times are strings like "03:00 PM"
  return time1 === time2;
}

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
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY);
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

  // Loading state for submission
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!canSubmit || isSubmitting) return;
    
    setIsSubmitting(true);

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

      // Success - show comprehensive message in modal
      const therapistName = therapistList.find(t => t.username === therapistUsername)?.info?.firstName && 
        therapistList.find(t => t.username === therapistUsername)?.info?.lastName
        ? `Dr. ${therapistList.find(t => t.username === therapistUsername).info.firstName} ${therapistList.find(t => t.username === therapistUsername).info.lastName}`
        : `Dr. ${therapistUsername}`;
      const voiceText = voiceRecording ? 'Voice recording saved for analysis' : 'No voice recording provided';
      setSuccessDetails({
        date,
        time,
        therapistName,
        sessionType,
        paymentMethod,
        referenceNo,
        amount: paymentAccounts[paymentMethod]?.amount || 'N/A',
        voiceText
      });
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Booking submission failed:", err);
      setErrorModalMessage('Booking submission failed. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
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
      setErrorModalMessage('You cannot book for a past date.');
      setShowErrorModal(true);
      return false;
    }
  
    if (selected > threeMonthsLater) {
      setErrorModalMessage('You can only book within 3 months from today.');
      setShowErrorModal(true);
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

  // [1] --- Add state for errors ---
  const [errors, setErrors] = useState({});

  // [2] --- Add min/max length for full name ---
  const MIN_NAME_LENGTH = 2;
  const MAX_NAME_LENGTH = 50;
  const isValidFullName = (value) => isValidName(value) && value.length >= MIN_NAME_LENGTH && value.length <= MAX_NAME_LENGTH;

  // [3] --- Add onBlur handlers for real-time validation ---
  const handleFullNameBlur = () => {
    if (!hasStoredFullName) {
      if (!fullName) {
        setErrors((prev) => ({ ...prev, fullName: 'Full name is required.' }));
      } else if (!isValidName(fullName)) {
        setErrors((prev) => ({ ...prev, fullName: 'Only letters and spaces are allowed.' }));
      } else if (fullName.length < MIN_NAME_LENGTH) {
        setErrors((prev) => ({ ...prev, fullName: `Full name must be at least ${MIN_NAME_LENGTH} characters.` }));
      } else if (fullName.length > MAX_NAME_LENGTH) {
        setErrors((prev) => ({ ...prev, fullName: `Full name must be at most ${MAX_NAME_LENGTH} characters.` }));
      } else {
        setErrors((prev) => ({ ...prev, fullName: undefined }));
      }
    }
  };

  const handlePhoneBlur = () => {
    if (!hasStoredPhone && phone) {
      const validation = validatePhoneNumber(phone, phoneCountry);
      setErrors((prev) => ({ ...prev, phone: validation.error }));
    }
  };

  // [NEW] Fetch patient appointments for selected date
  const fetchPatientAppointmentsForDate = async (date) => {
    if (!username || !date) return [];
    try {
      const data = await api.get(`/api/appointments?username=${username}&role=patient`);
      // Only consider appointments on the selected date and with status Pending/Accepted
      return (data.appointments || []).filter(a => a.date === date && ["Pending", "Accepted"].includes(a.status));
    } catch (err) {
      return [];
    }
  };

  const [patientAppointments, setPatientAppointments] = useState([]);

  // Add a new state for the success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

  // Add loading states for each step
  const [isStep1Loading, setIsStep1Loading] = useState(false);
  const [isStep2Loading, setIsStep2Loading] = useState(false);
  const [isStep3Loading, setIsStep3Loading] = useState(false);

  // In the BookAppointment component state:
  // Add a new error state for slip file size
  const [slipFileSizeError, setSlipFileSizeError] = useState("");

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

        {/* 48-hour Cancellation Policy Notice */}
        <div className="max-w-4xl mx-auto mb-4">
          <div className="flex items-center space-x-3 bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-sm">
            <FaExclamationTriangle className="text-amber-400 text-lg flex-shrink-0" />
            <div className="flex-1 text-sm text-amber-900 font-medium">
              <span className="font-semibold">Note:</span> Appointments can only be cancelled with at least 48 hours notice. Please keep this in mind before confirming your appointment.
            </div>
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
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2" htmlFor="fullName">
                        <FaUser className="inline mr-2 text-blue-600" />
          Full Name <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <input
          id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                          hasStoredFullName 
                            ? 'bg-gray-50 border-gray-200 cursor-not-allowed' 
              : errors.fullName ? 'border-red-500' : 'border-gray-300 hover:border-blue-400'
                        }`}
                        value={fullName}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!hasStoredFullName && (val === "" || isValidName(val))) {
                            setFullName(val);
              setErrors((prev) => ({ ...prev, fullName: undefined }));
                          }
                        }}
          onBlur={handleFullNameBlur}
                        readOnly={hasStoredFullName}
          aria-required="true"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                      />
        {!hasStoredFullName && errors.fullName && (
          <p id="fullName-error" className="text-red-500 text-xs sm:text-sm mt-1" role="alert">{errors.fullName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2" htmlFor="phone">
                        <FaPhone className="inline mr-2 text-blue-600" />
                        Phone Number <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <PhoneInput
                        country={DEFAULT_COUNTRY}
                        value={phone}
                        onChange={(phoneNumber, country) => {
                          if (!hasStoredPhone) {
                            setPhone(phoneNumber);
                            // Only store the country code string for validation
                            if (typeof country === 'string') {
                              setPhoneCountry(country);
                            } else if (country && typeof country.countryCode === 'string') {
                              setPhoneCountry(country.countryCode);
                            } else if (country && typeof country === 'object' && country.countryCode) {
                              setPhoneCountry(country.countryCode);
                            } else {
                              setPhoneCountry(DEFAULT_COUNTRY);
                            }
                            // Validate phone number
                            const validation = validatePhoneNumber(
                              phoneNumber,
                              typeof country === 'string'
                                ? country
                                : (country && country.countryCode)
                                ? country.countryCode
                                : DEFAULT_COUNTRY
                            );
                            setErrors((prev) => ({
                              ...prev,
                              phone: validation.error,
                            }));
                          }
                        }}
                        onBlur={handlePhoneBlur}
                        disabled={hasStoredPhone}
                        inputClass="w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        inputStyle={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb', height: '38px', fontSize: '15px' }}
                        containerClass="w-full"
                        buttonClass="border border-gray-300 rounded-l-lg bg-white h-[38px] w-[44px] flex items-center justify-center"
                        dropdownClass="border border-gray-300 rounded-lg shadow-lg"
                        enableSearch={true}
                        searchPlaceholder="Search country..."
                        placeholder="Enter your phone number"
                        buttonStyle={{
                          height: '38px',
                          width: '44px',
                          border: '1px solid #d1d5db',
                          borderRight: 'none',
                          borderRadius: '8px 0 0 8px',
                          backgroundColor: '#ffffff',
                        }}
                        aria-required="true"
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                      />
                      {!hasStoredPhone && errors.phone && (
                        <p id="phone-error" className="text-red-500 text-xs sm:text-sm mt-1" role="alert">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                  {/* Therapist Selection */}
                  <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2" htmlFor="therapist">
                      <FaUserMd className="inline mr-2 text-blue-600" />
        Select Therapist <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
      {/* TherapistSelection already handles selection, add aria-required and error if needed */}
                    <TherapistSelection
                      therapistList={therapistList}
                      selectedTherapist={therapistUsername}
                      onTherapistSelect={(username) => {
                        setTherapistUsername(username);
          setErrors((prev) => ({ ...prev, therapist: undefined }));
                        const selectedTherapist = therapistList.find(t => t.username === username);
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
        aria-required="true"
        aria-invalid={!!errors.therapist}
                    />
      {errors.therapist && (
        <p className="text-red-500 text-xs sm:text-sm mt-1" role="alert">{errors.therapist}</p>
      )}
                  </div>
                  {/* Session Type */}
                  <div>
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2" htmlFor="sessionType">
                      <FaComments className="inline mr-2 text-blue-600" />
        Session Type <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <select
        id="sessionType"
                      value={sessionType}
                      onChange={(e) => {
                        setSessionType(e.target.value);
          setErrors((prev) => ({ ...prev, sessionType: undefined }));
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
        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${errors.sessionType ? 'border-red-500' : 'border-gray-300 hover:border-blue-400'}`}
                      required
        aria-required="true"
        aria-invalid={!!errors.sessionType}
        aria-describedby={errors.sessionType ? 'sessionType-error' : undefined}
                    >
                      <option value="">Select Session Type</option>
                      <option value="online">Online</option>
                      <option value="in-person">In-person</option>
                    </select>
      {errors.sessionType && (
        <p id="sessionType-error" className="text-red-500 text-xs sm:text-sm mt-1" role="alert">{errors.sessionType}</p>
      )}
                  </div>
                  {/* Date and Time Selection */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2" htmlFor="date">
                        <FaCalendarAlt className="inline mr-2 text-blue-600" />
          Appointment Date <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <input
          id="date"
                        type="date"
          className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${errors.date ? 'border-red-500' : 'border-gray-300 hover:border-blue-400'}`}
                        value={date}
                        onChange={(e) => {
                          const selected = e.target.value;
                          setDate(selected);
                          setSelectedDate(selected);
            setErrors((prev) => ({ ...prev, date: undefined }));
                          const selectedDay = new Date(selected).toLocaleDateString("en-US", {
                            weekday: "long"
                          });
                          setSelectedDay(selectedDay);
                        }}
                        required
                        min={new Date().toISOString().split("T")[0]}
                        max={new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split("T")[0]}
                        onKeyDown={(e) => e.preventDefault()}
          onBlur={() => {
            if (!date) setErrors((prev) => ({ ...prev, date: 'Date is required.' }));
            else {
              // [NEW] Custom past date validation
              const today = new Date();
              const selected = new Date(date);
              today.setHours(0,0,0,0);
              selected.setHours(0,0,0,0);
              if (selected < today) {
                setErrors((prev) => ({ ...prev, date: 'You cannot book for a past date.' }));
              } else {
                setErrors((prev) => ({ ...prev, date: undefined }));
              }
            }
          }}
          aria-required="true"
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? 'date-error' : undefined}
        />
        {errors.date && (
          <p id="date-error" className="text-red-500 text-xs sm:text-sm mt-1" role="alert">{errors.date}</p>
        )}
                    </div>
                    <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2" htmlFor="time">
                        <FaClock className="inline mr-2 text-blue-600" />
          Available Time <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <select
          id="time"
                        value={time}
          onChange={(e) => {
            setTime(e.target.value);
            setErrors((prev) => ({ ...prev, time: undefined }));
          }}
          className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${errors.time ? 'border-red-500' : 'border-gray-300 hover:border-blue-400'}`}
                        required
          aria-required="true"
          aria-invalid={!!errors.time}
          aria-describedby={errors.time ? 'time-error' : undefined}
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
        {errors.time && (
          <p id="time-error" className="text-red-500 text-xs sm:text-sm mt-1" role="alert">{errors.time}</p>
        )}
                    </div>
                  </div>
                  {/* Continue Button */}
                  <div className="flex justify-end pt-4 sm:pt-6">
                    <button
                      type="button"
                      onClick={async () => {
                        if (isStep1Loading) return;
                        setIsStep1Loading(true);
                        let newErrors = {};
                        // Step-by-step validation for step 1 only
                        if (!fullName || !isValidFullName(fullName)) {
                          if (!fullName) newErrors.fullName = 'Full name is required.';
                          else if (!isValidName(fullName)) newErrors.fullName = 'Only letters and spaces are allowed.';
                          else if (fullName.length < MIN_NAME_LENGTH) newErrors.fullName = `Full name must be at least ${MIN_NAME_LENGTH} characters.`;
                          else if (fullName.length > MAX_NAME_LENGTH) newErrors.fullName = `Full name must be at most ${MAX_NAME_LENGTH} characters.`;
                        }
                        if (!phone) newErrors.phone = 'Phone number is required.';
                        else if (!hasStoredPhone) {
                          const validation = validatePhoneNumber(phone, phoneCountry);
                          if (!validation.isValid) {
                            newErrors.phone = validation.error;
                          }
                        }
                        if (!therapistUsername) newErrors.therapist = 'Please select a therapist.';
                        if (!sessionType) newErrors.sessionType = 'Please select a session type.';
                        if (!date) newErrors.date = 'Date is required.';
                        else {
                          const today = new Date();
                          const selected = new Date(date);
                          today.setHours(0,0,0,0);
                          selected.setHours(0,0,0,0);
                          if (selected < today) {
                            newErrors.date = 'You cannot book for a past date.';
                          }
                        }
                        if (!time) newErrors.time = 'Please select a time.';
                        // Overlapping appointment check
                        if (date && time) {
                          const appts = await fetchPatientAppointmentsForDate(date);
                          setPatientAppointments(appts);
                          const overlap = appts.some(a => isTimeOverlap(a.time, time));
                          if (overlap) {
                            newErrors.time = 'You already have another appointment at this time.';
                          }
                        }
                        setErrors(newErrors);
                        if (Object.keys(newErrors).length > 0) { setIsStep1Loading(false); return; }
                        const hasDuplicate = await checkDuplicateBooking(username, therapistUsername);
                        if (hasDuplicate) {
                          setErrors((prev) => ({ ...prev, therapist: 'You already have a pending or accepted appointment with this therapist.' }));
                          setIsStep1Loading(false);
                          return;
                        }
                        nextStep();
                        setIsStep1Loading(false);
                      }}
                      disabled={isStep1Loading}
                      className="flex items-center px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed"
        aria-label="Continue to Payment"
                    >
                      {isStep1Loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Checking...
                        </>
                      ) : (
                        <>
                          Continue to Payment
                          <FaArrowRight className="ml-2" />
                        </>
                      )}
                    </button>
                  </div>
              </div>
            )}

            {step === 2 && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Payment Method Selection */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2" htmlFor="paymentMethod">
                      <FaCreditCard className="inline mr-2 text-blue-600" />
                      Payment Method <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <select
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        setReferenceNo("");
                        setSlipFile(null);
                        setUploadProgress(0);
                        setErrors((prev) => ({ ...prev, paymentMethod: undefined }));
                      }}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${errors.paymentMethod ? 'border-red-500' : 'border-gray-300 hover:border-blue-400'}`}
                      disabled={loadingPaymentSettings}
                      aria-required="true"
                      aria-invalid={!!errors.paymentMethod}
                      aria-describedby={errors.paymentMethod ? 'paymentMethod-error' : undefined}
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
                    {errors.paymentMethod && (
                      <p id="paymentMethod-error" className="text-red-500 text-xs sm:text-sm mt-1" role="alert">{errors.paymentMethod}</p>
                    )}
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
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2" htmlFor="referenceNo">
                        Transaction Reference Number <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <input
                        id="referenceNo"
                        type="text"
                        placeholder="Enter your transaction reference number"
                        value={referenceNo}
                        onChange={(e) => {
                          setReferenceNo(e.target.value);
                          setErrors((prev) => ({ ...prev, referenceNo: undefined }));
                        }}
                        onBlur={() => {
                          if (!referenceNo) setErrors((prev) => ({ ...prev, referenceNo: 'Reference number is required.' }));
                          else if (referenceNo.length < 6) setErrors((prev) => ({ ...prev, referenceNo: 'Reference number must be at least 6 characters.' }));
                          else setErrors((prev) => ({ ...prev, referenceNo: undefined }));
                        }}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${errors.referenceNo ? 'border-red-500' : 'border-gray-300 hover:border-blue-400'}`}
                        aria-required="true"
                        aria-invalid={!!errors.referenceNo}
                        aria-describedby={errors.referenceNo ? 'referenceNo-error' : undefined}
                      />
                      {errors.referenceNo && (
                        <p id="referenceNo-error" className="text-red-500 text-xs sm:text-sm mt-1" role="alert">{errors.referenceNo}</p>
                      )}
                    </div>
                  )}

                  {/* File Upload */}
                  {paymentMethod && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2" htmlFor="file-upload">
                        <FaUpload className="inline mr-2 text-blue-600" />
                        Payment Screenshot <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <div className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${errors.slipFile ? 'border-red-500' : 'border-gray-300 hover:border-blue-400'}`}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.size > 1 * 1024 * 1024) { // 1 MB limit
                                setSlipFile(null);
                                setUploadProgress(0);
                                setSlipFileSizeError("File size must be less than 1 MB. Please choose a smaller image.");
                                const fileInput = document.getElementById('file-upload');
                                if (fileInput) fileInput.value = '';
                                return;
                              }
                              setSlipFile(file);
                              setUploadProgress(30);
                              setSlipFileSizeError("");
                            }
                          }}
                          className="hidden"
                          id="file-upload"
                          aria-required="true"
                          aria-invalid={!!errors.slipFile}
                          aria-describedby={errors.slipFile ? 'slipFile-error' : undefined}
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
                      {errors.slipFile && (
                        <p id="slipFile-error" className="text-red-500 text-xs sm:text-sm mt-1" role="alert">{errors.slipFile}</p>
                      )}
                      
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

                  {/* Show error message below the upload area */}
                  {slipFileSizeError && (
                    <div className="mt-2 text-xs sm:text-sm text-red-500 flex items-center" role="alert">
                      <FaExclamationTriangle className="mr-1" />
                      {slipFileSizeError}
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
                      onClick={async () => {
                        if (isStep2Loading) return;
                        setIsStep2Loading(true);
                        // Step-by-step validation for step 2 only
                        let newErrors = {};
                        if (!paymentMethod) newErrors.paymentMethod = 'Please select a payment method.';
                        if (!referenceNo) newErrors.referenceNo = 'Reference number is required.';
                        else if (referenceNo.length < 6) newErrors.referenceNo = 'Reference number must be at least 6 characters.';
                        if (!slipFile) newErrors.slipFile = 'Payment screenshot is required.';
                        setErrors(newErrors);
                        if (Object.keys(newErrors).length > 0) { setIsStep2Loading(false); return; }
                        nextStep();
                        setIsStep2Loading(false);
                      }}
                      disabled={!step2Valid || isStep2Loading}
                      className={`flex items-center justify-center px-6 sm:px-8 py-2 sm:py-3 font-semibold rounded-lg transition-all duration-200 text-sm sm:text-base ${
                        step2Valid && !isStep2Loading
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isStep2Loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Checking...
                        </>
                      ) : step2Valid ? (
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
                      Emotion Assessment <span className="text-red-500" aria-hidden="true">*</span>
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
                      <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Ready to Record? <span className="text-red-500" aria-hidden="true">*</span></h4>
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
                        aria-required="true"
                        aria-invalid={!recordingSaved}
                      />
                    </div>
                    {!recordingSaved && (
                      <p className="text-red-500 text-xs sm:text-sm mt-2" role="alert">Voice recording is required to continue.</p>
                    )}
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
                      onClick={async () => {
                        if (isStep3Loading) return;
                        setIsStep3Loading(true);
                        // Step-by-step validation for step 3 only
                        if (!recordingSaved) {
                          setErrors((prev) => ({ ...prev, voiceRecording: 'Voice recording is required to continue.' }));
                          setIsStep3Loading(false);
                          return;
                        }
                        setErrors((prev) => ({ ...prev, voiceRecording: undefined }));
                        nextStep();
                        setIsStep3Loading(false);
                      }}
                      disabled={!step3Valid || isStep3Loading}
                      className={`flex items-center justify-center px-6 sm:px-8 py-2 sm:py-3 font-semibold rounded-lg transition-all duration-200 text-sm sm:text-base ${
                        step3Valid && !isStep3Loading
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      aria-label="Continue to Review"
                    >
                      {isStep3Loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Checking...
                        </>
                      ) : step3Valid ? (
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
                      disabled={!canSubmit || isSubmitting}
                      className={`flex items-center justify-center px-6 sm:px-8 py-2 sm:py-3 font-semibold rounded-lg transition-all duration-200 text-sm sm:text-base ${
                        canSubmit && !isSubmitting
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : canSubmit ? (
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

      {/* Success Modal */}
      {showSuccessModal && successDetails && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100 relative animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4 shadow-lg">
                <FaCheck className="text-white text-3xl" />
              </div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">Booking Request Submitted!</h2>
              <p className="text-gray-700 mb-4">Your appointment request has been submitted successfully. Here are your booking details:</p>
              <div className="w-full text-left space-y-2 mb-4">
                <div><span className="font-semibold text-gray-800">Date:</span> {successDetails.date}</div>
                <div><span className="font-semibold text-gray-800">Time:</span> {successDetails.time}</div>
                <div><span className="font-semibold text-gray-800">Therapist:</span> {successDetails.therapistName}</div>
                <div><span className="font-semibold text-gray-800">Session Type:</span> {successDetails.sessionType}</div>
                <div><span className="font-semibold text-gray-800">Payment Method:</span> {successDetails.paymentMethod}</div>
                <div><span className="font-semibold text-gray-800">Reference No:</span> {successDetails.referenceNo}</div>
                <div><span className="font-semibold text-gray-800">Amount:</span> {successDetails.amount}</div>
                <div><span className="font-semibold text-gray-800">Voice Analysis:</span> {successDetails.voiceText}</div>
              </div>
              <p className="text-gray-600 text-sm mb-6">You'll be notified once your payment is approved and your therapist receives your voice analysis report.</p>
              <button
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 text-base"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/patient-dashboard");
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100 relative animate-fade-in flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center mb-4 shadow-lg">
              <FaExclamationTriangle className="text-white text-3xl" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-red-700">Error</h2>
            <p className="text-gray-700 mb-6">{errorModalMessage}</p>
            <button
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200 text-base"
              onClick={() => setShowErrorModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;