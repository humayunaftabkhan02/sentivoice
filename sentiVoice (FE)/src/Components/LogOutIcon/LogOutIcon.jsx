import React from 'react';
import { FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const LogoutIcon = ({ className = "text-white" }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove user data from localStorage
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('fullName');
    // Also clear remembered credentials
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberedPassword');
    localStorage.removeItem('rememberMe');
    // Redirect to homepage or login page
    navigate('/');
  };

  return (
    <FaSignOutAlt
      className={`text-2xl cursor-pointer mt-auto ${className}`} // Apply the className prop
      onClick={handleLogout}
    />
  );
};

export default LogoutIcon;