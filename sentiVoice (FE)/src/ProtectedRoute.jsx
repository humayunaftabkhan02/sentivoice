import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import sessionValidator from './utils/sessionValidator';

// ProtectedRoute will wrap any routes that should only be accessible
// by logged-in users, possibly with specific roles.
function ProtectedRoute({ children, requiredRole }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);

  // 1. Fetch data from localStorage
  const storedUsername = localStorage.getItem('username');
  const storedRole = localStorage.getItem('role');

  // Check session validity immediately
  useEffect(() => {
    const checkSession = async () => {
      if (storedUsername && storedRole) {
        console.log('🔐 Checking session validity on route access...');
        
        try {
          // Force an immediate session check
          await sessionValidator.forceCheck();
          setIsValid(true);
        } catch (error) {
          console.log('❌ Session check failed:', error);
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
      console.log('🔐 Starting session validator for protected route');
      sessionValidator.start();
    }

    // Cleanup: stop session validator when component unmounts
    return () => {
      console.log('🛑 Stopping session validator');
      sessionValidator.stop();
    };
  }, [storedUsername, storedRole]);

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B6675] mx-auto mb-4"></div>
          <p className="text-gray-600">Checking session...</p>
        </div>
      </div>
    );
  }

  // 2. Check if user is logged in
  if (!storedUsername) {
    // User is not logged in, redirect to login
    return <Navigate to="/login" />;
  }

  // 3. If this route requires a specific role and the user doesn't match, redirect
  //    If requiredRole is undefined, that means this route only requires being logged in.
  if (requiredRole && storedRole !== requiredRole) {
    // Example: If requiredRole = 'therapist' but storedRole = 'patient', or vice versa
    return <Navigate to="/login" />;
  }

  // 4. If session is invalid, redirect to login
  if (!isValid) {
    return <Navigate to="/login" />;
  }

  // 5. If checks pass, render the child component
  return children;
}

export default ProtectedRoute;
