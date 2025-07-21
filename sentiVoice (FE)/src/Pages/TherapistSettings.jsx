import React, { useEffect, useState } from "react";
import { 
  FaUser, 
  FaCamera, 
  FaGraduationCap, 
  FaCertificate, 
  FaGlobe, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt,
  FaEdit,
  FaSave,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaClock,
  FaPlus
} from "react-icons/fa";
import NotificationBell from "../Components/NotificationBell/NotificationBell.jsx";
import { useNavigate } from "react-router-dom";
import MessageIcon from "../Components/MessageIcon/MessageIcon.jsx";
import UserTopBar from '../Components/UserTopBar';

import { api } from "../utils/api";
import TherapistSidebar from "../Components/TherapistSidebar/TherapistSidebar.jsx";
import PhoneInput from "react-phone-input-2";
import { validatePhoneNumber, DEFAULT_COUNTRY } from "../utils/phoneValidation";

const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const h = hour % 12 || 12;
      const ampm = hour < 12 ? "AM" : "PM";
      const m = min === 0 ? "00" : "30";
      times.push(`${String(h).padStart(2, "0")}:${m} ${ampm}`);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

function isTimeOverlap(start1, end1, start2, end2) {
  // Convert times to minutes for comparison
  function toMinutes(t) {
    const [time, ampm] = t.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  const s1 = toMinutes(start1), e1 = toMinutes(end1);
  const s2 = toMinutes(start2), e2 = toMinutes(end2);
  return s1 < e2 && s2 < e1;
}

// Utility to normalize day to full name
function normalizeDay(day) {
  if (!day) return '';
  const map = {
    mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
    fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
  };
  const d = day.trim().toLowerCase();
  return map[d.slice(0,3)] || map[d] || day;
}

const TherapistSettings = () => {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(undefined);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    specialization: "",
    availableSlots: "",
    experience: "",
    education: "",
    certifications: "",
    bio: "",
    phone: "",
    address: "",
    languages: "",
    profilePicture: null,
    customSpecialization: "" // Add customSpecialization to formData
  });
  const [message, setMessage] = useState("");
  // Separate state for in-person and online selectors
  const [inPersonDay, setInPersonDay] = useState("");
  const [inPersonStartTime, setInPersonStartTime] = useState("");
  const [inPersonEndTime, setInPersonEndTime] = useState("");
  const [onlineDay, setOnlineDay] = useState("");
  const [onlineStartTime, setOnlineStartTime] = useState("");
  const [onlineEndTime, setOnlineEndTime] = useState("");
  // Separate availability for in-person and online
  const [inPersonSlots, setInPersonSlots] = useState([]);
  const [onlineSlots, setOnlineSlots] = useState([]);
  const [customSpecialization, setCustomSpecialization] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState({});
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success'); // 'success' or 'error'
  const [modalMessage, setModalMessage] = useState('');

  // 1. Add validation state: errors, touched, isFormValid
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Add separate error states
  const [inPersonSlotError, setInPersonSlotError] = useState(null);
  const [onlineSlotError, setOnlineSlotError] = useState(null);

  const navigate = useNavigate();

  // Must contain at least one letter and only letters/spaces
  const isValidName = (value) => /^[A-Za-z]+(?:\s*[A-Za-z]+)*$/.test(value.trim());

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
      
      setLoading(true);
      api.get(`/api/user-info/${storedUsername}`)
        .then(data => {
          console.log('Fetched user data:', data);
          setInfo(data.user?.info || {});
          
          // Populate form data with existing user info
          const userInfo = data.user?.info || {};
          setFormData({
            firstName: userInfo.firstName || storedFirstName || "",
            lastName: userInfo.lastName || storedLastName || "",
            specialization: userInfo.specialization || "",
            availableSlots: userInfo.availableSlots || "",
            experience: userInfo.experience || "",
            education: userInfo.education || "",
            certifications: userInfo.certifications || "",
            bio: userInfo.bio || "",
            phone: userInfo.phone || "",
            address: userInfo.address || "",
            languages: userInfo.languages || "",
            profilePicture: userInfo.profilePicture || null,
            customSpecialization: userInfo.specialization && !userInfo.specialization.includes("(") && 
              !userInfo.specialization.includes("Therapy") && 
              !userInfo.specialization.includes("Counseling") ? userInfo.specialization : "" // Populate customSpecialization
          });
          
          // Set profile image preview if exists
          const pic = userInfo.profilePicture;
          if (pic) {
            if (pic.startsWith('data:image')) {
              setProfileImagePreview(pic);
              setProfilePicture(pic);
            } else if (pic.startsWith('/uploads/')) {
              const filename = pic.split('/').pop();
              api.get(`/api/uploads/profile-pictures/${filename}`)
                .then(response => {
                  if (response.image) {
                    setProfileImagePreview(response.image);
                    setProfilePicture(response.image);
                  }
                })
                .catch(() => {
                  setProfileImagePreview(null);
                  setProfilePicture(null);
                });
            } else {
              setProfileImagePreview(pic);
              setProfilePicture(pic);
            }
          } else {
            setProfileImagePreview(null);
            setProfilePicture(null);
          }
          
          // Populate in-person and online slots if they exist
          if (userInfo.availability) {
            setInPersonSlots(userInfo.availability.inPerson || []);
            setOnlineSlots(userInfo.availability.online || []);
          }
          
          // Handle custom specialization
          if (userInfo.specialization && !userInfo.specialization.includes("(") && 
              !userInfo.specialization.includes("Therapy") && 
              !userInfo.specialization.includes("Counseling")) {
            setCustomSpecialization(userInfo.specialization);
            setFormData(prev => ({ ...prev, specialization: "Other" }));
          }
        })
        .catch(err => {
          console.error('Error fetching user data:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  // 2. Add validation functions for each field
  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "firstName":
        if (!value) error = "First name is required";
        else if (value.length < 2) error = "First name must be at least 2 characters";
        else if (value.length > 50) error = "First name must be less than 50 characters";
        else if (!isValidName(value)) error = "Only letters and spaces allowed";
        break;
      case "lastName":
        if (!value) error = "Last name is required";
        else if (value.length < 2) error = "Last name must be at least 2 characters";
        else if (value.length > 50) error = "Last name must be less than 50 characters";
        else if (!isValidName(value)) error = "Only letters and spaces allowed";
        break;
      case "phone":
        // Only validate if we have a value and a country
        if (value && phoneCountry) {
          const phoneValidation = validatePhoneNumber(value, phoneCountry);
          error = phoneValidation.error || "";
        }
        break;
      case "address":
        if (!value) error = "Address is required";
        else if (value.length < 5 || value.length > 100) error = "Address must be between 5 and 100 characters";
        break;
      case "specialization":
        if (!value) error = "Specialization is required";
        else if (value === "Other" && (!formData.customSpecialization || formData.customSpecialization.trim().length < 2)) error = "Custom specialization is required";
        else if (value === "Other" && formData.customSpecialization && (formData.customSpecialization.length < 2 || formData.customSpecialization.length > 50)) error = "Custom specialization must be between 2 and 50 characters";
        break;
      case "experience":
        if (!value) error = "Years of experience is required";
        else if (value < 1 || value > 70) error = "Experience must be between 1 and 70 years";
        break;
      case "education":
        if (!value) error = "Education is required";
        else if (value.length < 10 || value.length > 200) error = "Education must be between 10 and 200 characters";
        break;
      case "certifications":
        if (!value) error = "Certifications are required";
        else if (value.length < 10 || value.length > 200) error = "Certifications must be between 10 and 200 characters";
        break;
      case "languages":
        if (!value) error = "Languages spoken is required";
        else if (value.length < 2 || value.length > 100) error = "Languages spoken must be between 2 and 100 characters";
        break;
      case "bio":
        if (!value) error = "Professional bio is required";
        else if (value.length < 50 || value.length > 500) error = "Bio must be between 50 and 500 characters";
        break;
      case "customSpecialization":
        if (formData.specialization === "Other") {
          if (!value || value.trim().length < 2) error = "Custom specialization is required";
          else if (value.length < 2 || value.length > 50) error = "Custom specialization must be between 2 and 50 characters";
        }
        break;
      default:
        break;
    }
    return error;
  };

  // Add validateForm function
  const validateForm = () => {
    const newErrors = {};
    const newTouched = {};
    Object.keys(formData).forEach((key) => {
      newTouched[key] = true;
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    setTouched(newTouched);
    setIsFormValid(Object.keys(newErrors).length === 0);
    return Object.keys(newErrors).length === 0;
  };

  // 3. Add real-time validation on change/blur
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Form field changed:', name, value);
    setTouched({ ...touched, [name]: true });
    if ((name === "firstName" || name === "lastName") && !isValidName(value) && value !== "") {
      setErrors(prev => ({ ...prev, [name]: "Only letters and spaces allowed" }));
      return; // prevent update if input is not valid
    }
    setErrors(prev => ({ ...prev, [name]: "" }));
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPEG and PNG files are allowed');
        return;
      }
      if (file.size > maxSize) {
        setError('File size must be less than 5MB');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
        setFormData({ ...formData, profilePicture: file });
      };
      reader.readAsDataURL(file);
    }
  };

  // Add slot handlers
  const addSlot = (type) => {
    if (type === 'inPerson') {
      if (!inPersonDay || !inPersonStartTime || !inPersonEndTime) return;
      const normDay = normalizeDay(inPersonDay);
      // Check for overlap with existing in-person slots
      const overlap = inPersonSlots.some(slot =>
        slot.day === normDay && isTimeOverlap(slot.start, slot.end, inPersonStartTime, inPersonEndTime)
      );
      if (overlap) {
        setInPersonSlotError('Duplicate or overlapping in-person slot for this day/time is not allowed.');
        return;
      }
      setInPersonSlots([...inPersonSlots, { day: normDay, start: inPersonStartTime, end: inPersonEndTime }]);
      setInPersonDay(""); setInPersonStartTime(""); setInPersonEndTime("");
      setInPersonSlotError(null);
    } else {
      if (!onlineDay || !onlineStartTime || !onlineEndTime) return;
      const normDay = normalizeDay(onlineDay);
      // Check for overlap with existing online slots
      const overlap = onlineSlots.some(slot =>
        slot.day === normDay && isTimeOverlap(slot.start, slot.end, onlineStartTime, onlineEndTime)
      );
      if (overlap) {
        setOnlineSlotError('Duplicate or overlapping online slot for this day/time is not allowed.');
        return;
      }
      setOnlineSlots([...onlineSlots, { day: normDay, start: onlineStartTime, end: onlineEndTime }]);
      setOnlineDay(""); setOnlineStartTime(""); setOnlineEndTime("");
      setOnlineSlotError(null);
    }
  };
  const removeSlot = (type, idx) => {
    if (type === 'inPerson') {
      setInPersonSlots(inPersonSlots.filter((_, i) => i !== idx));
    } else {
      setOnlineSlots(onlineSlots.filter((_, i) => i !== idx));
    }
  };

  // In handleSave, call validateForm and block submission if invalid
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setError('Please fix the validation errors before submitting.');
      return;
    }
    setSaving(true);
    try {
      // Handle custom specialization
      let finalSpecialization = formData.specialization;
      if (formData.specialization === "Other" && customSpecialization.trim()) {
        finalSpecialization = customSpecialization.trim();
      }
      
      // Prepare availability object
      const availability = { inPerson: inPersonSlots, online: onlineSlots };

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('specialization', finalSpecialization);
      formDataToSend.append('experience', formData.experience);
      formDataToSend.append('education', formData.education);
      formDataToSend.append('certifications', formData.certifications);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('languages', formData.languages);
      formDataToSend.append('availability', JSON.stringify(availability));
      
      if (formData.profilePicture) {
        formDataToSend.append('profilePicture', formData.profilePicture);
      }
      
      // Debug: Log the actual form data contents
      console.log('Form data being sent:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value);
      }
      
      console.log('Updating therapist profile:', formDataToSend);
      const result = await api.put(`/api/update-profile/${username}`, formDataToSend);
      console.log('Profile update result:', result);
      
      // Update the token if a new one is provided
      if (result.token) {
        localStorage.setItem('token', result.token);
        console.log('Token updated after profile change');
      }
      
      // Update localStorage with new name fields
      if (formData.firstName) localStorage.setItem('firstName', formData.firstName);
      if (formData.lastName) localStorage.setItem('lastName', formData.lastName);
      if (formData.firstName && formData.lastName) {
        localStorage.setItem('fullName', `${formData.firstName} ${formData.lastName}`);
        setFullName(`${formData.firstName} ${formData.lastName}`);
      } else if (formData.firstName) {
        localStorage.setItem('fullName', formData.firstName);
        setFullName(formData.firstName);
      } else {
        localStorage.setItem('fullName', username);
        setFullName(username);
      }
      
      setSuccess(true);
      setError(null);
      setModalType('success');
      setModalMessage('Profile updated successfully!');
      setShowModal(true);
    } catch (err) {
      console.error('Profile update error:', err);
      setError("Failed to update profile");
      setSuccess(false);
      setModalType('error');
      setModalMessage('Failed to update profile. Please try again.');
      setShowModal(true);
    }
    setSaving(false);
  };

  // --- Availability Editors ---
  const renderAvailabilityEditor = (type, slots, day, setDay, startTime, setStartTime, endTime, setEndTime) => (
    <div className="mb-4 sm:mb-6">
      <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
        {type === 'inPerson' ? 'In-Person Availability' : 'Online Availability'}
      </h3>
      {/* Show error message for this type */}
      {type === 'inPerson' && inPersonSlotError && (
        <div className="mb-2 text-xs text-red-600 font-medium">{inPersonSlotError}</div>
      )}
      {type === 'online' && onlineSlotError && (
        <div className="mb-2 text-xs text-red-600 font-medium">{onlineSlotError}</div>
      )}
      <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 mb-2">
        <select 
          value={day} 
          onChange={e => { setDay(e.target.value); if (type === 'inPerson') setInPersonSlotError(null); else setOnlineSlotError(null); }} 
          className="border rounded px-2 py-1 text-sm flex-1 sm:flex-none"
        >
          <option value="">Day</option>
          {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select 
          value={startTime} 
          onChange={e => { setStartTime(e.target.value); if (type === 'inPerson') setInPersonSlotError(null); else setOnlineSlotError(null); }} 
          className="border rounded px-2 py-1 text-sm flex-1 sm:flex-none"
        >
          <option value="">Start</option>
          {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select 
          value={endTime} 
          onChange={e => { setEndTime(e.target.value); if (type === 'inPerson') setInPersonSlotError(null); else setOnlineSlotError(null); }} 
          className="border rounded px-2 py-1 text-sm flex-1 sm:flex-none"
        >
          <option value="">End</option>
          {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button 
          type="button" 
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center justify-center" 
          onClick={() => addSlot(type)}
        >
          <FaPlus className="text-xs sm:text-sm" />
        </button>
      </div>
      <ul className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
        {slots.map((slot, idx) => (
          <li
            key={idx}
            className="flex items-center bg-blue-50 border border-blue-200 rounded-full px-3 sm:px-4 py-1 shadow-sm text-xs sm:text-sm font-medium text-blue-900"
          >
            <span className="mr-1.5 sm:mr-2">
              <span className="font-semibold">{slot.day}:</span> {slot.start} - {slot.end}
            </span>
            <button
              type="button"
              className="ml-1.5 sm:ml-2 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition"
              onClick={() => removeSlot(type, idx)}
              title="Remove slot"
            >
              <FaTimes className="text-xs" />
            </button>
          </li>
        ))}
        {slots.length === 0 && (
          <li className="text-gray-400 text-xs">No slots set</li>
        )}
      </ul>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#EBEDE9] overflow-x-hidden">
      <TherapistSidebar current="settings" />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 lg:mb-8 space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
              Therapist Settings
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your professional and personal information</p>
          </div>
          <UserTopBar username={username} fullName={fullName} role={"therapist"} profilePicture={profilePicture} />
        </div>

        {/* Profile Completion Banner */}


        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            <p className="ml-2 sm:ml-3 text-sm sm:text-base text-gray-600">Loading your profile...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Profile Picture Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <FaCamera className="mr-2 text-blue-600 text-sm sm:text-base" />
                  Profile Picture
                </h2>
                
                <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                  <div className="relative">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {profileImagePreview ? (
                        <img 
                          src={profileImagePreview} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUser className="text-3xl sm:text-4xl text-gray-400" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 sm:p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                      <FaCamera className="text-xs sm:text-sm" />
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleImageChange}
                        className="hidden"
                        max-size="5MB"
                      />
                    </label>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-gray-600 text-center">
                    Click the camera icon to upload a profile picture (JPEG or PNG, max 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Main Form Section */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
                
                {/* Personal Information */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                    <FaUser className="mr-2 text-blue-600 text-sm sm:text-base" />
                    Personal Information
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        First Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        onBlur={e => { setTouched({ ...touched, firstName: true }); setErrors(prev => ({ ...prev, firstName: validateField('firstName', e.target.value) })); }}
                        disabled={loading}
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                        placeholder="Enter first name"
                      />
                      {touched.firstName && errors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Last Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        onBlur={e => { setTouched({ ...touched, lastName: true }); setErrors(prev => ({ ...prev, lastName: validateField('lastName', e.target.value) })); }}
                        disabled={loading}
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                        placeholder="Enter last name"
                      />
                      {touched.lastName && errors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Phone Number <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <PhoneInput
                          country={DEFAULT_COUNTRY}
                          value={formData.phone}
                          onChange={(phone, country) => {
                            setFormData({ ...formData, phone: phone });
                            setPhoneCountry(country);
                            
                            // Mark field as touched when user starts typing
                            if (!touched.phone) {
                              setTouched(prev => ({ ...prev, phone: true }));
                            }
                            
                            // Validate phone number
                            if (phone) {
                              const validation = validatePhoneNumber(phone, country);
                              setErrors(prev => ({
                                ...prev,
                                phone: validation.error
                              }));
                            } else {
                              setErrors(prev => ({
                                ...prev,
                                phone: null
                              }));
                            }
                          }}
                          onBlur={() => { 
                            setTouched({ ...touched, phone: true }); 
                          }}
                          className="w-full"
                          inputClass={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 ${errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
                          containerClass="w-full"
                          buttonClass="border border-gray-300 rounded-l-lg bg-white h-[42px] w-[52px] flex items-center justify-center"
                          dropdownClass="border border-gray-300 rounded-lg shadow-lg"
                          enableSearch={true}
                          searchPlaceholder="Search country..."
                          placeholder="Enter your phone number"
                          inputStyle={{
                            height: '42px',
                            fontSize: '14px',
                            paddingLeft: '60px'
                          }}
                          buttonStyle={{
                            height: '42px',
                            width: '52px',
                            border: '1px solid #d1d5db',
                            borderRight: 'none',
                            borderRadius: '8px 0 0 8px',
                            backgroundColor: '#ffffff'
                          }}
                          disabled={loading}
                        />
                      </div>
                      {touched.phone && errors.phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Address <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        onBlur={e => { setTouched({ ...touched, address: true }); setErrors(prev => ({ ...prev, address: validateField('address', e.target.value) })); }}
                        disabled={loading}
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                        placeholder="Enter your address"
                        required
                      />
                      {touched.address && errors.address && (
                        <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                    <FaGraduationCap className="mr-2 text-blue-600 text-sm sm:text-base" />
                    Professional Information
                  </h2>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Specialization <span className="text-red-600">*</span>
                      </label>
                      <select
                        name="specialization"
                        value={formData.specialization}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, specialization: value });
                          if (value !== "Other") {
                            setCustomSpecialization("");
                          }
                        }}
                        onBlur={e => { setTouched({ ...touched, specialization: true }); setErrors(prev => ({ ...prev, specialization: validateField('specialization', e.target.value) })); }}
                        disabled={loading}
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                        required
                      >
                        <option value="">Select Specialization</option>
                        <option value="Cognitive Behavioral Therapy (CBT)">Cognitive Behavioral Therapy (CBT)</option>
                        <option value="Psychodynamic Therapy">Psychodynamic Therapy</option>
                        <option value="Humanistic Therapy">Humanistic Therapy</option>
                        <option value="Integrative Therapy">Integrative Therapy</option>
                        <option value="Dialectical Behavior Therapy (DBT)">Dialectical Behavior Therapy (DBT)</option>
                        <option value="Art Therapy">Art Therapy</option>
                        <option value="Music Therapy">Music Therapy</option>
                        <option value="Trauma-Focused Therapy">Trauma-Focused Therapy</option>
                        <option value="Family Therapy">Family Therapy</option>
                        <option value="Marriage & Relationship Counseling">Marriage & Relationship Counseling</option>
                        <option value="Grief Counseling">Grief Counseling</option>
                        <option value="Addiction Counseling">Addiction Counseling</option>
                        <option value="Child & Adolescent Therapy">Child & Adolescent Therapy</option>
                        <option value="LGBTQ+ Affirmative Therapy">LGBTQ+ Affirmative Therapy</option>
                        <option value="Mindfulness-Based Therapy">Mindfulness-Based Therapy</option>
                        <option value="Play Therapy">Play Therapy</option>
                        <option value="Career Counseling">Career Counseling</option>
                        <option value="Group Therapy">Group Therapy</option>
                        <option value="Behavioral Therapy">Behavioral Therapy</option>
                        <option value="Narrative Therapy">Narrative Therapy</option>
                        <option value="Other">Other</option>
                      </select>
                      
                      {touched.specialization && errors.specialization && (
                        <p className="text-red-500 text-xs mt-1">{errors.specialization}</p>
                      )}
                      
                      {formData.specialization === "Other" && (
                        <input
                          type="text"
                          placeholder="Enter your specialization"
                          value={customSpecialization}
                          onChange={(e) => { setCustomSpecialization(e.target.value); setTouched({ ...touched, customSpecialization: true }); setErrors(prev => ({ ...prev, customSpecialization: validateField('customSpecialization', e.target.value) })); }}
                          onBlur={e => { setTouched({ ...touched, customSpecialization: true }); setErrors(prev => ({ ...prev, customSpecialization: validateField('customSpecialization', formData.customSpecialization) })); }}
                          disabled={loading}
                          className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                          required
                        />
                      )}
                      {touched.customSpecialization && errors.customSpecialization && (
                        <p className="text-red-500 text-xs mt-1">{errors.customSpecialization}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Years of Experience <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        onBlur={e => { setTouched({ ...touched, experience: true }); setErrors(prev => ({ ...prev, experience: validateField('experience', e.target.value) })); }}
                        disabled={loading}
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                        placeholder="e.g., 5"
                        min="1"
                        max="70"
                        required
                      />
                      {touched.experience && errors.experience && (
                        <p className="text-red-500 text-xs mt-1">{errors.experience}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Education <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        name="education"
                        value={formData.education}
                        onChange={handleChange}
                        onBlur={e => { setTouched({ ...touched, education: true }); setErrors(prev => ({ ...prev, education: validateField('education', e.target.value) })); }}
                        disabled={loading}
                        rows="3"
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                        placeholder="e.g., Master's in Clinical Psychology, University of..."
                        required
                      />
                      {touched.education && errors.education && (
                        <p className="text-red-500 text-xs mt-1">{errors.education}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Certifications & Licenses <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        name="certifications"
                        value={formData.certifications}
                        onChange={handleChange}
                        onBlur={e => { setTouched({ ...touched, certifications: true }); setErrors(prev => ({ ...prev, certifications: validateField('certifications', e.target.value) })); }}
                        disabled={loading}
                        rows="3"
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                        placeholder="e.g., Licensed Clinical Psychologist, CBT Certification..."
                        required
                      />
                      {touched.certifications && errors.certifications && (
                        <p className="text-red-500 text-xs mt-1">{errors.certifications}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Languages Spoken <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="languages"
                        value={formData.languages}
                        onChange={handleChange}
                        onBlur={e => { setTouched({ ...touched, languages: true }); setErrors(prev => ({ ...prev, languages: validateField('languages', e.target.value) })); }}
                        disabled={loading}
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                        placeholder="e.g., English, Spanish, French"
                        required
                      />
                      {touched.languages && errors.languages && (
                        <p className="text-red-500 text-xs mt-1">{errors.languages}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Professional Bio <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        onBlur={e => { setTouched({ ...touched, bio: true }); setErrors(prev => ({ ...prev, bio: validateField('bio', e.target.value) })); }}
                        disabled={loading}
                        rows="4"
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                        placeholder="Tell patients about your approach, experience, and what makes you unique as a therapist..."
                        required
                      />
                      {touched.bio && errors.bio && (
                        <p className="text-red-500 text-xs mt-1">{errors.bio}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* In-Person and Online Availability Sections */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                    <FaClock className="mr-2 text-blue-600 text-sm sm:text-base" />
                    Session Availability
                  </h2>
                  {renderAvailabilityEditor('inPerson', inPersonSlots, inPersonDay, setInPersonDay, inPersonStartTime, setInPersonStartTime, inPersonEndTime, setInPersonEndTime)}
                  {renderAvailabilityEditor('online', onlineSlots, onlineDay, setOnlineDay, onlineStartTime, setOnlineStartTime, onlineEndTime, setOnlineEndTime)}
                </div>

                {/* Save Button */}
                <div className="flex justify-center sm:justify-end">
                  <button
                    type="submit"
                    disabled={loading || saving}
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center font-medium text-sm sm:text-base"
                  >
                    {saving ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1.5 sm:mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-1.5 sm:mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>

                {message && <p className="text-green-700 mt-2 text-sm sm:text-base text-center sm:text-left">{message}</p>}
              </form>
            </div>
          </div>
        )}
      </div>
      {/* Success/Error Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100 relative animate-fade-in flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg ${modalType === 'success' ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-red-400 to-rose-500'}`}> 
              {modalType === 'success' ? (
                <FaCheck className="text-white text-3xl" />
              ) : (
                <FaExclamationTriangle className="text-white text-3xl" />
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
  );
};

export default TherapistSettings;
