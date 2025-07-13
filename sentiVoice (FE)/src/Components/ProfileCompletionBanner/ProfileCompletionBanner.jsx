import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaUserEdit, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

const ProfileCompletionBanner = ({ username, role }) => {
  const [profileStatus, setProfileStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  // Always call useEffect, but handle the logic inside
  useEffect(() => {
    // Check if user previously dismissed the banner
    const wasDismissed = localStorage.getItem('profileCompletionBannerDismissed');
    if (wasDismissed === 'true') {
      setDismissed(true);
    }

    // Only check profile status if user is a therapist and not dismissed
    if (role === 'therapist' && username && !dismissed) {
      checkProfileStatus();
    } else {
      setLoading(false);
    }
  }, [username, role, dismissed]);

  const checkProfileStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/therapist/${username}/profile-complete`);
      setProfileStatus(response);
    } catch (error) {
      console.error('Error checking profile status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = () => {
    navigate('/th-settings');
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Store dismissal in localStorage to remember user's choice
    localStorage.setItem('profileCompletionBannerDismissed', 'true');
  };

  // Don't show banner if dismissed, not a therapist, loading, or profile is complete
  if (dismissed || role !== 'therapist' || loading || profileStatus?.isComplete) {
    return null;
  }

  const getMissingFieldsText = () => {
    if (!profileStatus?.missingFields) return '';
    
    const fieldLabels = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone Number',
      address: 'Address',
      specialization: 'Specialization',
      experience: 'Years of Experience',
      education: 'Education',
      certifications: 'Certifications & Licenses',
      languages: 'Languages Spoken',
      bio: 'Professional Bio',
      availability: 'Availability Schedule'
    };

    const missingLabels = profileStatus.missingFields.map(field => fieldLabels[field] || field);
    
    if (missingLabels.length === 0) return '';
    if (missingLabels.length === 1) return missingLabels[0];
    if (missingLabels.length === 2) return missingLabels.join(' and ');
    
    const lastField = missingLabels.pop();
    return `${missingLabels.join(', ')}, and ${lastField}`;
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 p-4 mb-6 rounded-lg shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-amber-800">
              Complete Your Profile to Be Listed for Patients
            </h3>
            <div className="mt-2 text-sm text-amber-700">
              <p>
                Your profile is incomplete. Patients can only see therapists with complete profiles. 
                Please fill in the missing information to start receiving appointment requests.
              </p>
              {profileStatus?.missingFields && profileStatus.missingFields.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Missing information:</p>
                  <p className="text-amber-600">{getMissingFieldsText()}</p>
                </div>
              )}
            </div>
            <div className="mt-3 flex space-x-3">
              <button
                onClick={handleCompleteProfile}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
              >
                <FaUserEdit className="mr-2" />
                Complete Profile
              </button>
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-3 py-2 border border-amber-300 text-sm leading-4 font-medium rounded-md text-amber-700 bg-transparent hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
              >
                <FaTimes className="mr-2" />
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionBanner; 