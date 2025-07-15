import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import MaintenancePage from '../../Pages/MaintenancePage';
import AnnouncementBanner from '../AnnouncementBanner/AnnouncementBanner';

export default function MaintenanceCheck({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  
  const storedRole = localStorage.getItem('role');

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        // Only check maintenance mode for non-admin users
        if (storedRole !== 'admin') {
          const response = await api.get('/api/maintenance-status');
          if (response.maintenanceMode) {
            setMaintenanceMode(true);
            setMaintenanceMessage(response.maintenanceMessage);
          }
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
        // If error, assume no maintenance mode
      } finally {
        setIsChecking(false);
      }
    };

    checkMaintenance();
  }, [storedRole]);

  if (isChecking) {
    return <div className="flex items-center justify-center min-h-screen text-lg text-gray-600">Loading...</div>;
  }

  if (maintenanceMode) {
    return <MaintenancePage message={maintenanceMessage} />;
  }

  return (
    <>
      <AnnouncementBanner />
      {children}
    </>
  );
} 