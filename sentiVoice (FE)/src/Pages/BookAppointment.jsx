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
    
    alert(`✅ Voice recording saved successfully! Voice analysis will be processed when you submit your booking.`);
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
      <div className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Book Your Session
          </h1>
            <p className="text-gray-600">Schedule your therapy appointment in just a few steps</p>
          </div>
          <UserTopBar username={username} fullName={fullName} role={role} profilePicture={profilePicture} />
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
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
                    className={`w-16 h-1 mx-4 transition-all duration-300 ${
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
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Step Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {stepTitles[step - 1]}
                  </h2>
                  <p className="text-blue-100">
                    {stepDescriptions[step - 1]}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-blue-100 text-sm">Step {step} of 4</div>
                  <div className="text-white font-semibold">
                    {Math.round((step / 4) * 100)}% Complete
                  </div>
                </div>
          </div>
        </div>

            {/* Step Content */}
            <div className="p-8">
            {step === 1 && (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaUser className="inline mr-2 text-blue-600" />
                        Full Name
                      </label>
                  <input
                    type="text"
                        placeholder="Enter your full name"
                        className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                    <p className="text-red-500 text-sm mt-1">Only letters and spaces are allowed.</p>
                  )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaPhone className="inline mr-2 text-blue-600" />
                        Phone Number
                      </label>
                  <input
                    type="text"
                        placeholder="03XXXXXXXXX or +923XXXXXXXXX"
                        className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                    <p className="text-red-500 text-sm mt-1">
                          Invalid phone number. Use 03XXXXXXXXX or +923XXXXXXXXX format.
                    </p>
                  )}
                    </div>
                  </div>

                  {/* Therapist Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                      <option value="">Select Session Type</option>
                      <option value="online">Online</option>
                      <option value="in-person">In-person</option>
                  </select>
                  </div>

                  {/* Date and Time Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaCalendarAlt className="inline mr-2 text-blue-600" />
                        Appointment Date
                      </label>
                  <input
                      type="date"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaClock className="inline mr-2 text-blue-600" />
                        Available Time
                      </label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  <div className="flex justify-end pt-6">
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
                      className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                      Continue to Payment
                      <FaArrowRight className="ml-2" />
                  </button>
                  </div>
              </div>
            )}

            {step === 2 && (
                <div className="space-y-6">
                  {/* Payment Method Selection */}
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <FaCreditCard className="mr-2 text-blue-600" />
                        Payment Account Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="text-sm text-gray-600 mb-1">Account Name</div>
                          <div className="font-semibold text-gray-800">
                            {paymentAccounts[paymentMethod]?.name || 'N/A'}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="text-sm text-gray-600 mb-1">Account Number</div>
                          <div className="font-semibold text-gray-800">
                            {paymentAccounts[paymentMethod]?.number || 'N/A'}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="text-sm text-gray-600 mb-1">Amount</div>
                          <div className="font-semibold text-green-600">
                            {paymentAccounts[paymentMethod]?.amount || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reference Number */}
                  {paymentMethod && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transaction Reference Number
                      </label>
                    <input
                      type="text"
                        placeholder="Enter your transaction reference number"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    </div>
                  )}

                  {/* File Upload */}
                  {paymentMethod && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaUpload className="inline mr-2 text-blue-600" />
                        Payment Screenshot
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
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
                          <FaUpload className="mx-auto text-3xl text-gray-400 mb-4" />
                          <div className="text-gray-600">
                            <span className="font-medium">Click to upload</span> or drag and drop
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            PNG, JPG, JPEG up to 10MB
                          </div>
                        </label>
                      </div>
                      
                      {/* Upload Progress */}
                      {uploadProgress > 0 && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
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
                            <div className="mt-2 text-sm text-green-600 flex items-center">
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
                            className="max-w-[200px] rounded-lg border border-gray-300 shadow-lg"
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
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                            title="Remove file"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-6">
                  <button
                    type="button"
                      onClick={prevStep}
                      className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200"
                    >
                      <FaArrowLeft className="mr-2" />
                      Back
                    </button>
                    
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!step2Valid}
                      className={`flex items-center px-8 py-3 font-semibold rounded-lg transition-all duration-200 ${
                        step2Valid 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                      {step2Valid ? (
                        <>
                          Continue to Voice Recording
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
                <div className="space-y-6">
                  {/* Voice Recording Section */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaMicrophone className="text-2xl text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      How are you feeling today?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Record your voice to help your therapist understand your current emotional state
                    </p>
                  </div>

                  {/* Audio Recorder */}
                  <div className="bg-gray-50 rounded-lg p-6">
                  <AudioRecorderComponent
                    therapistUsername={therapistUsername}
                    therapistFullName={therapistList.find(t => t.username === therapistUsername)?.info?.firstName && therapistList.find(t => t.username === therapistUsername)?.info?.lastName
                      ? `Dr. ${therapistList.find(t => t.username === therapistUsername).info.firstName} ${therapistList.find(t => t.username === therapistUsername).info.lastName}`
                      : `Dr. ${therapistUsername}`}
                    patientData={patientData}
                      onReportSent={handleReportSent}
                    />
                  </div>

                  {recordingSaved && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <FaCheck className="text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">
                          Voice recording saved successfully
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-6">
                  <button
                    type="button"
                      onClick={prevStep}
                      className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200"
                    >
                      <FaArrowLeft className="mr-2" />
                      Back
                    </button>
                    
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!step3Valid}
                      className={`flex items-center px-8 py-3 font-semibold rounded-lg transition-all duration-200 ${
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
                <div className="space-y-6">
                  {/* Review Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FaCheck className="mr-2 text-blue-600" />
                      Review Your Booking
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Appointment Details */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-3">Appointment Details</h4>
                        <div className="space-y-2 text-sm">
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
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-3">Payment Details</h4>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Method:</span> {paymentMethod}</div>
                          <div><span className="font-medium">Reference:</span> {referenceNo}</div>
                          <div><span className="font-medium">Amount:</span> {paymentAccounts[paymentMethod]?.amount || 'N/A'}</div>
                          <div className="text-green-600 font-medium">✓ Payment uploaded</div>
                        </div>
                      </div>
                    </div>

                    {/* Voice Recording Status */}
                    <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3">Voice Analysis</h4>
                      <div className="text-sm">
                        <div className="text-green-600 font-medium">✓ Voice recording saved</div>
                        <div className="text-gray-600 mt-1">Emotion analysis will be processed when you submit</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-6">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200"
                    >
                      <FaArrowLeft className="mr-2" />
                      Back
                    </button>
                    
                    <button
                      type="button"
                      onClick={submitBooking}
                      disabled={!canSubmit}
                      className={`flex items-center px-8 py-3 font-semibold rounded-lg transition-all duration-200 ${
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
    </div>
  );
};

export default BookAppointment;