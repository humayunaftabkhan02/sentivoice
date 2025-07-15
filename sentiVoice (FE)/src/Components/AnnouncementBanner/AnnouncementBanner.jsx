import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useLocation } from 'react-router-dom';
import { FaTimes, FaInfoCircle, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const AnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const response = await api.get('/api/announcement');
        if (response && response.enabled && response.message) {
          setAnnouncement(response);
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error fetching announcement:', error);
      }
    };

    fetchAnnouncement();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage to prevent showing again for this session
    localStorage.setItem('announcementDismissed', Date.now().toString());
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-600" />;
      case 'success':
        return <FaCheckCircle className="text-green-600" />;
      default:
        return <FaInfoCircle className="text-blue-600" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = (type) => {
    switch (type) {
      case 'warning':
        return 'text-yellow-800';
      case 'success':
        return 'text-green-800';
      default:
        return 'text-blue-800';
    }
  };

  // Check if current page has a sidebar
  const hasSidebar = () => {
    const sidebarRoutes = [
      '/patient-dashboard',
      '/book-appointment',
      '/pa-messaging',
      '/pa-appointment-history',
      '/pa-settings',
      '/therapist-dashboard',
      '/appointment-calendar',
      '/patient-management',
      '/th-messaging',
      '/therapist-reports',
      '/th-settings',
      '/admin-dashboard',
      '/therapist-approval',
      '/payments',
      '/payment-approval',
      '/payment-history',
      '/payment-settings',
      '/admin-settings',
      '/admin-user-list',
      '/refund-requests'
    ];
    
    return sidebarRoutes.some(route => location.pathname.startsWith(route));
  };

  if (!isVisible || !announcement) {
    return null;
  }

  const sidebarWidth = hasSidebar() ? 'ml-64' : '';

  return (
    <div className={`${getBgColor(announcement.type)} border-b ${getTextColor(announcement.type)} ${sidebarWidth}`}>
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center flex-wrap">
          <div className="flex items-center max-w-4xl">
            <span className="flex p-2 rounded-lg">
              {getIcon(announcement.type)}
            </span>
            <p className="ml-3 font-medium text-center">
              <span className="md:hidden">{announcement.message}</span>
              <span className="hidden md:inline">{announcement.message}</span>
            </p>
          </div>
          <div className="absolute right-4 sm:right-6 lg:right-8">
            <button
              type="button"
              className="-mr-1 flex p-2 rounded-md hover:bg-opacity-20 hover:bg-black focus:outline-none focus:ring-2 focus:ring-white"
              onClick={handleDismiss}
            >
              <span className="sr-only">Dismiss</span>
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner; 