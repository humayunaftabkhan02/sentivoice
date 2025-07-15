import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import sessionValidator from './utils/sessionValidator';
import MaintenancePage from './Pages/MaintenancePage';
import { api } from './utils/api';

// ProtectedRoute will wrap any routes that should only be accessible
// by logged-in users, possibly with specific roles.
function ProtectedRoute({ children, requiredRole }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);

  // 1. Fetch data from localStorage
  const storedUsername = localStorage.getItem('username');
  const storedRole = localStorage.getItem('role');

  // Check session validity only
  useEffect(() => {
    const checkSession = async () => {
      if (storedUsername && storedRole) {
        try {
          await sessionValidator.forceCheck();
          setIsValid(true);
        } catch (error) {
          setIsValid(false);
        }
      } else {
        setIsValid(false);
      }
      setIsChecking(false);
    };
    checkSession();
  }, [storedUsername, storedRole]);

  // Start session validator when component mounts
  useEffect(() => {
    if (storedUsername && storedRole) {
      sessionValidator.start();
    }

    // Cleanup: stop session validator when component unmounts
    return () => {
      sessionValidator.stop();
    };
  }, [storedUsername, storedRole]);

  // Show loading while checking
  if (isChecking) {
    return <div className="flex items-center justify-center min-h-screen text-lg text-gray-600">Checking session...</div>;
  }

  // 2. Check if user is logged in
  if (!storedUsername) {
    return <Navigate to="/login" replace />;
  }

  // 3. Check role requirements if specified
  if (requiredRole && storedRole !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. If session is invalid, redirect to login
  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  // 5. If all checks pass, render the protected content
  return children;
}

export default ProtectedRoute;
