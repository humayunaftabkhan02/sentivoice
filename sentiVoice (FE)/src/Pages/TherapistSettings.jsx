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

const TherapistSettings = () => {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
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
    email: "",
    address: "",
    languages: "",
    profilePicture: null
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
      api.get(`/user-info/${storedUsername}`)
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
            email: userInfo.email || data.user?.email || "", // Get email from user object
            address: userInfo.address || "",
            languages: userInfo.languages || "",
            profilePicture: userInfo.profilePicture || null
          });
          
          // Set profile image preview if exists
          const pic = userInfo.profilePicture;
          if (pic) {
            if (pic.startsWith('data:image')) {
              setProfileImagePreview(pic);
              setProfilePicture(pic);
            } else if (pic.startsWith('/uploads/')) {
              const filename = pic.split('/').pop();
              api.get(`/uploads/profile-pictures/${filename}`)
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Form field changed:', name, value);
    if ((name === "firstName" || name === "lastName") && !isValidName(value) && value !== "") {
      return; // prevent update if input is not valid
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
      const newSlot = { day: inPersonDay, start: inPersonStartTime, end: inPersonEndTime };
      setInPersonSlots([...inPersonSlots, newSlot]);
      setInPersonDay(""); setInPersonStartTime(""); setInPersonEndTime("");
    } else {
      if (!onlineDay || !onlineStartTime || !onlineEndTime) return;
      const newSlot = { day: onlineDay, start: onlineStartTime, end: onlineEndTime };
      setOnlineSlots([...onlineSlots, newSlot]);
      setOnlineDay(""); setOnlineStartTime(""); setOnlineEndTime("");
    }
  };
  const removeSlot = (type, idx) => {
    if (type === 'inPerson') {
      setInPersonSlots(inPersonSlots.filter((_, i) => i !== idx));
    } else {
      setOnlineSlots(onlineSlots.filter((_, i) => i !== idx));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
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
      formDataToSend.append('email', formData.email);
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
      const result = await api.put(`/update-profile/${username}`, formDataToSend);
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
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Profile update error:', err);
      setError("Failed to update profile");
      setSuccess(false);
      alert('Failed to update profile. Please try again.');
    }
    setSaving(false);
  };

  // --- Availability Editors ---
  const renderAvailabilityEditor = (type, slots, day, setDay, startTime, setStartTime, endTime, setEndTime) => (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-800 mb-2">
        {type === 'inPerson' ? 'In-Person Availability' : 'Online Availability'}
      </h3>
      <div className="flex space-x-2 mb-2">
        <select value={day} onChange={e => setDay(e.target.value)} className="border rounded px-2 py-1">
          <option value="">Day</option>
          {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select value={startTime} onChange={e => setStartTime(e.target.value)} className="border rounded px-2 py-1">
          <option value="">Start</option>
          {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={endTime} onChange={e => setEndTime(e.target.value)} className="border rounded px-2 py-1">
          <option value="">End</option>
          {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="button" className="bg-blue-500 text-white px-3 py-1 rounded" onClick={() => addSlot(type)}>
          <FaPlus />
        </button>
      </div>
      <ul className="flex flex-wrap gap-2 mt-2">
        {slots.map((slot, idx) => (
          <li
            key={idx}
            className="flex items-center bg-blue-50 border border-blue-200 rounded-full px-4 py-1 shadow-sm text-sm font-medium text-blue-900"
          >
            <span className="mr-2">
              <span className="font-semibold">{slot.day}:</span> {slot.start} - {slot.end}
            </span>
            <button
              type="button"
              className="ml-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition"
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
    <div className="flex min-h-screen bg-[#EBEDE9]">
      <TherapistSidebar current="settings" />

      {/* Main Content */}
      <div className="flex-1 p-8 space-y-6 ml-64">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Therapist Settings
            </h1>
            <p className="text-gray-600">Manage your professional and personal information</p>
          </div>
          <UserTopBar username={username} fullName={fullName} role={"therapist"} profilePicture={profilePicture} />
        </div>

        {/* Profile Completion Banner */}


        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-gray-600">Loading your profile...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Picture Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FaCamera className="mr-2 text-blue-600" />
                  Profile Picture
                </h2>
                
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {profileImagePreview ? (
                        <img 
                          src={profileImagePreview} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUser className="text-4xl text-gray-400" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                      <FaCamera className="text-sm" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  <p className="text-sm text-gray-600 text-center">
                    Click the camera icon to upload a profile picture
                  </p>
                </div>
              </div>
            </div>

            {/* Main Form Section */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSave} className="space-y-6">
                
                {/* Personal Information */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FaUser className="mr-2 text-blue-600" />
                    Personal Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="Enter first name"
                      />
                      {formData.firstName && !isValidName(formData.firstName) && (
                        <p className="text-red-500 text-xs mt-1">Only letters and spaces allowed</p>
                      )}
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
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="Enter last name"
                      />
                      {formData.lastName && !isValidName(formData.lastName) && (
                        <p className="text-red-500 text-xs mt-1">Only letters and spaces allowed</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="Enter your address"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FaGraduationCap className="mr-2 text-blue-600" />
                    Professional Information
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specialization *
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
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                      
                      {formData.specialization === "Other" && (
                        <input
                          type="text"
                          placeholder="Enter your specialization"
                          value={customSpecialization}
                          onChange={(e) => setCustomSpecialization(e.target.value)}
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          required
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Years of Experience *
                      </label>
                      <input
                        type="number"
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="e.g., 5"
                        min="0"
                        max="50"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Education *
                      </label>
                      <textarea
                        name="education"
                        value={formData.education}
                        onChange={handleChange}
                        disabled={loading}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="e.g., Master's in Clinical Psychology, University of..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certifications & Licenses *
                      </label>
                      <textarea
                        name="certifications"
                        value={formData.certifications}
                        onChange={handleChange}
                        disabled={loading}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="e.g., Licensed Clinical Psychologist, CBT Certification..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Languages Spoken *
                      </label>
                      <input
                        type="text"
                        name="languages"
                        value={formData.languages}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="e.g., English, Spanish, French"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Professional Bio *
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        disabled={loading}
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="Tell patients about your approach, experience, and what makes you unique as a therapist..."
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* In-Person and Online Availability Sections */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FaClock className="mr-2 text-blue-600" />
                    Session Availability
                  </h2>
                  {renderAvailabilityEditor('inPerson', inPersonSlots, inPersonDay, setInPersonDay, inPersonStartTime, setInPersonStartTime, inPersonEndTime, setInPersonEndTime)}
                  {renderAvailabilityEditor('online', onlineSlots, onlineDay, setOnlineDay, onlineStartTime, setOnlineStartTime, onlineEndTime, setOnlineEndTime)}
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || saving}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center font-medium"
                  >
                    {saving ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>

                {message && <p className="text-green-700 mt-2">{message}</p>}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapistSettings;
