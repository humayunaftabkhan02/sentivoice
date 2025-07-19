import React, { useEffect, useState, useRef } from "react";
import {
  FaUser,
  FaCamera,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaHeart,
  FaPills,
  FaNotesMedical,
  FaExclamationTriangle,
  FaSave,
  FaTimes,
  FaCheck,
  FaEdit,
  FaPlus,
  FaMinus,
  FaTrash
} from "react-icons/fa";
import NotificationBell from "../Components/NotificationBell/NotificationBell.jsx";
import { useNavigate } from 'react-router-dom';
import MessageIcon from "../Components/MessageIcon/MessageIcon.jsx";
import PhoneInput from "react-phone-input-2";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { api } from "../utils/api";
import { handleAuthError } from "../utils/auth";
import PatientSidebar from '../Components/PatientSidebar/PatientSidebar.jsx';
import UserTopBar from '../Components/UserTopBar';

const PatientSettings = () => {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const successTimeoutRef = useRef(null);
  
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    contact: "",
    email: "",
    address: "",
    emergencyContact: {
      name: "",
      relationship: "",
      phone: ""
    },
    
    // Medical Information
    bloodType: "",
    height: "",
    weight: "",
    allergies: [],
    currentMedications: [],
    medicalConditions: [],
    previousTherapy: "",
    therapyGoals: "",
    
    // Insurance & Payment
    insuranceProvider: "",
    insuranceNumber: "",
    preferredPaymentMethod: "",
    
    // Preferences
    preferredLanguage: "",
    communicationPreferences: "",
    sessionPreferences: "",
    profilePicture: null
  });

  const [newAllergy, setNewAllergy] = useState("");
  const [newMedication, setNewMedication] = useState("");
  const [newCondition, setNewCondition] = useState("");

  const navigate = useNavigate();

  // Must contain at least one letter and only letters/spaces
  const isValidName = (value) => /^[A-Za-z]+(?:\s*[A-Za-z]+)*$/.test(value.trim());

  // Clear success message when switching tabs
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setError(null);
  };

  // Remove setSuccess(false) from useEffect for activeTab
  useEffect(() => {
    setError(null);
    // Clear any existing timeout
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  }, [activeTab]);

  // Cleanup effect to clear messages when component unmounts
  useEffect(() => {
    return () => {
      setSuccess(false);
      setError(null);
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
      
      setLoading(true);
      api.get(`/api/user-info/${storedUsername}`)
        .then(data => {
          console.log('User info loaded:', data);
          if (data.user?.info?.firstName && data.user?.info?.lastName) {
            setFullName(`${data.user.info.firstName} ${data.user.info.lastName}`);
          }
          
          // Populate form data with existing user info
          const userInfo = data.user?.info || {};
          setFormData({
            firstName: userInfo.firstName || "",
            lastName: userInfo.lastName || "",
            dateOfBirth: userInfo.dateOfBirth || "",
            gender: userInfo.gender || "",
            contact: userInfo.contact || "",
            email: userInfo.email || data.user?.email || "",
            address: userInfo.address || "",
            emergencyContact: userInfo.emergencyContact || {
              name: "",
              relationship: "",
              phone: ""
            },
            bloodType: userInfo.bloodType || "",
            height: userInfo.height || "",
            weight: userInfo.weight || "",
            allergies: userInfo.allergies || [],
            currentMedications: userInfo.currentMedications || [],
            medicalConditions: userInfo.medicalConditions || [],
            previousTherapy: userInfo.previousTherapy || "",
            therapyGoals: userInfo.therapyGoals || "",
            insuranceProvider: userInfo.insuranceProvider || "",
            insuranceNumber: userInfo.insuranceNumber || "",
            preferredPaymentMethod: userInfo.preferredPaymentMethod || "",
            preferredLanguage: userInfo.preferredLanguage || "",
            communicationPreferences: userInfo.communicationPreferences || "",
            sessionPreferences: userInfo.sessionPreferences || "",
            profilePicture: userInfo.profilePicture || null
          });
          
          // Set profile image preview if exists
          if (userInfo.profilePicture) {
            if (userInfo.profilePicture.startsWith('data:image')) {
              setProfileImagePreview(userInfo.profilePicture);
            } else if (userInfo.profilePicture.startsWith('/uploads/')) {
              const filename = userInfo.profilePicture.split('/').pop();
              api.get(`/api/uploads/profile-pictures/${filename}`)
                .then(response => {
                  if (response.image) {
                    setProfileImagePreview(response.image);
                  }
                })
                .catch(error => {
                  console.error('Error loading profile picture:', error);
                });
            } else {
              setProfileImagePreview(userInfo.profilePicture);
            }
          }
        })
        .catch(err => {
          console.error('Error loading user info:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    // Name fields validation
    if ((name === "firstName" || name === "lastName") && !isValidName(value) && value !== "") {
      return;
    }
  
    // Contact number validation: Only allow digits and optional leading '+'
    if (name === "contact" && !/^(\+)?[0-9]*$/.test(value)) {
      return;
    }
  
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmergencyContactChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
        setFormData(prev => ({ ...prev, profilePicture: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }));
      setNewAllergy("");
    }
  };

  const removeAllergy = (index) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const addMedication = () => {
    if (newMedication.trim() && !formData.currentMedications.includes(newMedication.trim())) {
      setFormData(prev => ({
        ...prev,
        currentMedications: [...prev.currentMedications, newMedication.trim()]
      }));
      setNewMedication("");
    }
  };

  const removeMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      currentMedications: prev.currentMedications.filter((_, i) => i !== index)
    }));
  };

  const addCondition = () => {
    if (newCondition.trim() && !formData.medicalConditions.includes(newCondition.trim())) {
      setFormData(prev => ({
        ...prev,
        medicalConditions: [...prev.medicalConditions, newCondition.trim()]
      }));
      setNewCondition("");
    }
  };

  const removeCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      medicalConditions: prev.medicalConditions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false); // Clear any existing success message
    
    // Clear any existing timeout
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First and Last Name cannot be empty.");
      setSaving(false);
     return;
    }
    
    if (!isValidName(formData.firstName) || !isValidName(formData.lastName)) {
      setError("Names can contain letters and spaces only.");
      setSaving(false);
     return;
    }

    const phoneObj = parsePhoneNumberFromString(formData.contact || "");
    if (formData.contact && (!phoneObj || !phoneObj.isValid())) {
      setError("Please enter a valid phone number.");
      setSaving(false);
      return;
    }

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'profilePicture' && formData[key] instanceof File) {
          formDataToSend.append('profilePicture', formData[key]);
        } else if (key === 'emergencyContact') {
          formDataToSend.append('emergencyContact', JSON.stringify(formData[key]));
        } else if (Array.isArray(formData[key])) {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const result = await api.put(`/api/update-profile/${username}`, formDataToSend);
      console.log('Profile update result:', result);
      
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      
      setSuccess(true);
      setFullName(`${formData.firstName} ${formData.lastName}`);
      
      // Refresh user info
      try {
        const userData = await api.get(`/api/user-info/${username}`);
        if (userData.user?.info?.firstName && userData.user?.info?.lastName) {
          setFullName(`${userData.user.info.firstName} ${userData.user.info.lastName}`);
        }
      } catch (refreshErr) {
        console.error('Error refreshing user info:', refreshErr);
      }
      
      // Clear success message after 3 seconds using ref
      successTimeoutRef.current = setTimeout(() => {
        setSuccess(false);
        successTimeoutRef.current = null;
      }, 3000);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || "Failed to update profile.");
      handleAuthError(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#EBEDE9]">
        <PatientSidebar current="settings" />
        <div className="flex-1 lg:ml-64 p-4 sm:p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#EBEDE9]">
      <PatientSidebar current="settings" />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-64 p-4 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
              Account Settings
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your personal and medical information</p>
          </div>
          <UserTopBar username={username} fullName={fullName} role={"patient"} profilePicture={profileImagePreview} />
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center text-sm sm:text-base">
            <FaCheck className="mr-2 text-sm sm:text-base" />
            Profile updated successfully!
          </div>
        )}
        
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center text-sm sm:text-base">
            <FaExclamationTriangle className="mr-2 text-sm sm:text-base" />
            {error}
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {/* Profile Picture Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative flex justify-center sm:justify-start">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
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
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 sm:p-2 rounded-full cursor-pointer hover:bg-blue-700">
                  <FaCamera className="text-xs sm:text-sm" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Profile Picture</h3>
                <p className="text-xs sm:text-sm text-gray-600">Upload a clear photo for your profile</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex flex-wrap sm:flex-nowrap space-x-2 sm:space-x-8 px-3 sm:px-6 overflow-x-auto">
                {[
                  { id: "personal", label: "Personal Info", icon: FaUser },
                  { id: "medical", label: "Medical Info", icon: FaNotesMedical },
                  { id: "emergency", label: "Emergency Contact", icon: FaExclamationTriangle },
                  { id: "preferences", label: "Preferences", icon: FaHeart }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <tab.icon className="text-xs sm:text-sm" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-4 sm:p-6">
              {/* Personal Information Tab */}
              {activeTab === "personal" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        required
          />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
            onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
          </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
          <PhoneInput
            country={phoneCountry}
            value={formData.contact}
            onChange={(val, data) => {
              setPhoneCountry(data.countryCode);
              setFormData((p) => ({ ...p, contact: `+${val}` }));
            }}
            enableSearch
            disableSearchIcon
                        placeholder="Phone number"
                        inputStyle={{
                          width: "100%",
                          height: "44px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          paddingLeft: "60px",
                          background: "#fff",
                          fontSize: "14px"
                        }}
                        buttonStyle={{
                          border: "1px solid #d1d5db",
                          borderRight: "none",
                          background: "#fff",
                          borderRadius: "6px 0 0 6px"
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="Enter your full address"
                    />
                  </div>
                </div>
              )}

              {/* Medical Information Tab */}
              {activeTab === "medical" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Type
                      </label>
                      <select
                        name="bloodType"
                        value={formData.bloodType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      >
                        <option value="">Select Blood Type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="170"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="70"
                      />
                    </div>
                  </div>

                  {/* Allergies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allergies
                    </label>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-3">
                      <input
                        type="text"
                        value={newAllergy}
                        onChange={(e) => setNewAllergy(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="Add an allergy"
                      />
                      <button
                        type="button"
                        onClick={addAllergy}
                        className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                      >
                        <FaPlus className="text-sm sm:text-base" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-red-100 text-red-800"
                        >
                          {allergy}
                          <button
                            type="button"
                            onClick={() => removeAllergy(index)}
                            className="ml-1 sm:ml-2 text-red-600 hover:text-red-800"
                          >
                            <FaTimes className="text-xs sm:text-sm" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Current Medications */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Medications
                    </label>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-3">
                      <input
                        type="text"
                        value={newMedication}
                        onChange={(e) => setNewMedication(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="Add a medication"
                      />
                      <button
                        type="button"
                        onClick={addMedication}
                        className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                      >
                        <FaPlus className="text-sm sm:text-base" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.currentMedications.map((medication, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-blue-100 text-blue-800"
                        >
                          <FaPills className="mr-1 text-xs sm:text-sm" />
                          {medication}
                          <button
                            type="button"
                            onClick={() => removeMedication(index)}
                            className="ml-1 sm:ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <FaTimes className="text-xs sm:text-sm" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Medical Conditions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medical Conditions
                    </label>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-3">
                      <input
                        type="text"
                        value={newCondition}
                        onChange={(e) => setNewCondition(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="Add a medical condition"
                      />
                      <button
                        type="button"
                        onClick={addCondition}
                        className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                      >
                        <FaPlus className="text-sm sm:text-base" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.medicalConditions.map((condition, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-yellow-100 text-yellow-800"
                        >
                          {condition}
                          <button
                            type="button"
                            onClick={() => removeCondition(index)}
                            className="ml-1 sm:ml-2 text-yellow-600 hover:text-yellow-800"
                          >
                            <FaTimes className="text-xs sm:text-sm" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Previous Therapy */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Previous Therapy Experience
                    </label>
                    <textarea
                      name="previousTherapy"
                      value={formData.previousTherapy}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="Describe any previous therapy experience..."
                    />
                  </div>

                  {/* Therapy Goals */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Therapy Goals
                    </label>
                    <textarea
                      name="therapyGoals"
                      value={formData.therapyGoals}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="What are your goals for therapy?"
                    />
                  </div>
                </div>
              )}

              {/* Emergency Contact Tab */}
              {activeTab === "emergency" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContact.name}
                        onChange={(e) => handleEmergencyContactChange("name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relationship
                      </label>
                      <select
                        value={formData.emergencyContact.relationship}
                        onChange={(e) => handleEmergencyContactChange("relationship", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      >
                        <option value="">Select Relationship</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Child">Child</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Friend">Friend</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact Phone
                    </label>
                    <PhoneInput
                      country={phoneCountry}
                      value={formData.emergencyContact.phone}
                      onChange={(val, data) => {
                        handleEmergencyContactChange("phone", `+${val}`);
                      }}
                      enableSearch
                      disableSearchIcon
                      placeholder="Emergency contact phone"
            inputStyle={{
                        width: "100%",
                        height: "44px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        paddingLeft: "60px",
              background: "#fff",
              fontSize: "14px"
            }}
            buttonStyle={{
              border: "1px solid #d1d5db",
              borderRight: "none",
              background: "#fff",
                        borderRadius: "6px 0 0 6px"
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === "preferences" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Language
                      </label>
                      <select
                        name="preferredLanguage"
                        value={formData.preferredLanguage}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      >
                        <option value="">Select Language</option>
                        <option value="English">English</option>
                        <option value="Urdu">Urdu</option>
                        <option value="Punjabi">Punjabi</option>
                        <option value="Sindhi">Sindhi</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Payment Method
                      </label>
                      <select
                        name="preferredPaymentMethod"
                        value={formData.preferredPaymentMethod}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      >
                        <option value="">Select Payment Method</option>
                        <option value="Cash">Cash</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Mobile Payment">Mobile Payment</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Communication Preferences
                    </label>
                    <textarea
                      name="communicationPreferences"
                      value={formData.communicationPreferences}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="How would you prefer to communicate with your therapist?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Preferences
                    </label>
                    <textarea
                      name="sessionPreferences"
                      value={formData.sessionPreferences}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="Any specific preferences for therapy sessions?"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Provider
                      </label>
                      <input
                        type="text"
                        name="insuranceProvider"
                        value={formData.insuranceProvider}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="Insurance company name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Number
                      </label>
                      <input
                        type="text"
                        name="insuranceNumber"
                        value={formData.insuranceNumber}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="Insurance policy number"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={() => navigate("/patient-dashboard")}
              className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm sm:text-base"
            >
              Cancel
            </button>
          <button
            type="submit"
              disabled={saving}
              className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FaSave className="text-sm sm:text-base" />
                  <span>Save Changes</span>
                </>
              )}
          </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientSettings;