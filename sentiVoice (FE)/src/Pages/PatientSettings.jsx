import React, { useEffect, useState, useRef } from "react";
import {
  FaUser,
  FaCamera,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaSave,
  FaTimes,
  FaCheck,
  FaEdit,
  FaExclamationCircle,
  FaCheckCircle
} from "react-icons/fa";
import NotificationBell from "../Components/NotificationBell/NotificationBell.jsx";
import { useNavigate } from 'react-router-dom';
import MessageIcon from "../Components/MessageIcon/MessageIcon.jsx";
import PhoneInput from "react-phone-input-2";
import { api } from "../utils/api";
import { handleAuthError } from "../utils/auth";
import PatientSidebar from '../Components/PatientSidebar/PatientSidebar.jsx';
import UserTopBar from '../Components/UserTopBar';
import { validatePhoneNumber, DEFAULT_COUNTRY } from "../utils/phoneValidation";

const PatientSettings = () => {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const successTimeoutRef = useRef(null);
  
  // Validation states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    contact: "",
    address: "",
    profilePicture: null
  });

  const navigate = useNavigate();

  // Validation functions
  const isValidName = (value) => /^[A-Za-z]+(?:\s*[A-Za-z]+)*$/.test(value.trim());

  const validateDateOfBirth = (date) => {
    if (!date) return null;
    
    const today = new Date();
    const birthDate = new Date(date);
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (birthDate > today) return "Date of birth cannot be in the future";
    if (age < 1) return "Age must be at least 1 year";
    if (age > 120) return "Age cannot exceed 120 years";
    
    return null;
  };
  
  const validateImageUpload = (file) => {
    if (!file) return null;
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      return "Only JPEG, JPG, and PNG files are allowed";
    }
    
    if (file.size > maxSize) {
      return "File size must be less than 5MB";
    }
    
    return null;
  };
  
  const validateGender = (gender) => {
    if (!gender) return null;
    const validGenders = ['Male', 'Female'];
    if (!validGenders.includes(gender)) {
      return "Gender must be either Male or Female";
    }
    return null;
  };
  
  // Helper function for field styling
  const getFieldStyle = (name) => {
    if (touched[name] && errors[name]) {
      return "border-red-500 focus:ring-red-500 focus:border-red-500";
    }
    if (touched[name] && !errors[name] && formData[name]) {
      return "border-green-500 focus:ring-green-500 focus:border-green-500";
    }
    return "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
  };
  
  const getFieldIcon = (name) => {
    if (touched[name] && errors[name]) {
      return <FaExclamationCircle className="text-red-500" />;
    }
    if (touched[name] && !errors[name] && formData[name]) {
      return <FaCheckCircle className="text-green-500" />;
    }
    return null;
  };

  // Validation helper functions
  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) return "This field is required";
        if (!isValidName(value)) return "Name can contain letters and spaces only";
        if (value.length < 2) return "Name must be at least 2 characters";
        if (value.length > 50) return "Name must be less than 50 characters";
        return null;
      case 'contact':
        // Only validate if we have a value and a country
        if (value && phoneCountry) {
          const phoneValidation = validatePhoneNumber(value, phoneCountry);
          return phoneValidation.error;
        }
        return null;
      case 'dateOfBirth':
        return validateDateOfBirth(value);
      case 'gender':
        return validateGender(value);
      default:
        return null;
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Validate required fields
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    
    // Validate other fields
    Object.keys(formData).forEach(key => {
      if (key !== 'profilePicture') {
        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
      }
    });
    
    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
    return Object.keys(newErrors).length === 0;
  };

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
  
  // Validate form whenever formData changes
  useEffect(() => {
    validateForm();
  }, [formData]);

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
            address: userInfo.address || "",
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
  
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Real-time validation
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
      ...prev,
        [name]: error
      }));
    }
  };
  
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const error = validateImageUpload(file);
      if (error) {
        setError(error);
        return;
      }
      
      setFormData(prev => ({ ...prev, profilePicture: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError("Please fix the errors before submitting.");
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
              Account Settings
            </h1>
              <p className="text-gray-600 text-sm sm:text-base">Manage your personal information</p>
          </div>
          <UserTopBar username={username} fullName={fullName} role={"patient"} profilePicture={profileImagePreview} />
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center text-sm">
            <FaCheck className="mr-3 text-green-500" />
            Profile updated successfully!
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center text-sm">
            <FaExclamationCircle className="mr-3 text-red-500" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          {/* Profile Picture Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaUser className="mr-2 text-blue-600" />
                Profile Picture
              </h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-gray-200 shadow-lg">
                  {profileImagePreview ? (
                    <img 
                      src={profileImagePreview} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center">
                    <FaUser className="text-3xl sm:text-4xl text-gray-400" />
                      </div>
                  )}
                </div>
                  <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg transition-colors">
                    <FaCamera className="text-sm" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Update Profile Picture</h3>
                  <p className="text-gray-600 text-sm">Upload a clear photo for your profile</p>
              </div>
            </div>
          </div>
            </div>

          {/* Personal Information Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaEdit className="mr-2 text-blue-600" />
                Personal Information
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                    <div className="relative">
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm transition-all duration-200 ${getFieldStyle('firstName')}`}
                        required
                        aria-describedby={errors.firstName ? "firstName-error" : undefined}
                        placeholder="Enter your first name"
                      />
                      {getFieldIcon('firstName') && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          {getFieldIcon('firstName')}
                        </div>
                      )}
                    </div>
                    {errors.firstName && (
                      <p id="firstName-error" className="mt-2 text-sm text-red-600" role="alert">
                        {errors.firstName}
                      </p>
                    )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                    <div className="relative">
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm transition-all duration-200 ${getFieldStyle('lastName')}`}
                        required
                        aria-describedby={errors.lastName ? "lastName-error" : undefined}
                        placeholder="Enter your last name"
                      />
                      {getFieldIcon('lastName') && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          {getFieldIcon('lastName')}
                        </div>
                      )}
                    </div>
                    {errors.lastName && (
                      <p id="lastName-error" className="mt-2 text-sm text-red-600" role="alert">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                    </div>
                    
                {/* Date and Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
            onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm transition-all duration-200 ${getFieldStyle('dateOfBirth')}`}
                        aria-describedby={errors.dateOfBirth ? "dateOfBirth-error" : undefined}
                      />
                      {getFieldIcon('dateOfBirth') && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          {getFieldIcon('dateOfBirth')}
                        </div>
                      )}
                    </div>
                    {errors.dateOfBirth && (
                      <p id="dateOfBirth-error" className="mt-2 text-sm text-red-600" role="alert">
                        {errors.dateOfBirth}
                      </p>
                    )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm transition-all duration-200 ${getFieldStyle('gender')}`}
                      aria-describedby={errors.gender ? "gender-error" : undefined}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
                    {errors.gender && (
                      <p id="gender-error" className="mt-2 text-sm text-red-600" role="alert">
                        {errors.gender}
                      </p>
                    )}
                  </div>
                    </div>
                    
                {/* Contact Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                      </label>
                  <div className="relative">
          <PhoneInput
            country={DEFAULT_COUNTRY}
            value={formData.contact}
            onChange={(phone, country) => {
              setFormData(prev => ({ ...prev, contact: phone }));
              setPhoneCountry(country);
              
              // Mark field as touched when user starts typing
              if (!touched.contact) {
                setTouched(prev => ({ ...prev, contact: true }));
              }
              
              // Validate phone number
              if (phone) {
                const validation = validatePhoneNumber(phone, country);
                setErrors(prev => ({
                  ...prev,
                  contact: validation.error
                }));
              } else {
                setErrors(prev => ({
                  ...prev,
                  contact: null
                }));
              }
            }}
            onBlur={() => setTouched(prev => ({ ...prev, contact: true }))}
            onFocus={() => setTouched(prev => ({ ...prev, contact: true }))}
            className="w-full"
            inputClass={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 ${errors.contact ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
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
          />
                    {errors.contact && (
                      <p className="mt-2 text-sm text-red-600" role="alert">
                        {errors.contact}
                      </p>
                    )}
                    </div>
                  </div>
                  
                {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 resize-none"
                      placeholder="Enter your full address"
                    />
                  </div>
                </div>
                    </div>
                    </div>
                    
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={() => navigate("/patient-dashboard")}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm font-medium transition-all duration-200"
            >
              Cancel
            </button>
          <button
            type="submit"
              disabled={saving || !isFormValid}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-medium transition-all duration-200"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FaSave className="text-sm" />
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