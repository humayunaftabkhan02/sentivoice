import React from 'react';
import {
  FaThLarge,
  FaCalendarAlt,
  FaComments,
  FaCog,
  FaSignOutAlt,
  FaHome,
  FaHistory
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';

export default function PatientSidebar({ current }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberedPassword');
    localStorage.removeItem('rememberMe');
    navigate('/');
  };

  const Item = ({ id, icon, label, to }) => (
    <div
      onClick={() => navigate(to)}
      className={
        "flex items-center px-4 py-3 w-full cursor-pointer rounded-lg mx-2 transition-all duration-200 group " +
        (current === id
          ? "bg-white text-blue-600 shadow-lg border-l-4 border-blue-600"
          : "text-gray-300 hover:bg-white/10 hover:text-white")
      }>
      <div className="flex items-center space-x-3 w-full">
        <div className={`text-xl transition-transform duration-200 group-hover:scale-110 ${
          current === id ? "text-blue-600" : "text-gray-300 group-hover:text-white"
        }`}>
          {icon}
        </div>
        <span className={`text-sm font-medium transition-colors duration-200 ${
          current === id ? "text-blue-600" : "text-gray-300 group-hover:text-white"
        }`}>
          {label}
        </span>
      </div>
    </div>
  );

  return (
    <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 flex flex-col min-h-screen fixed left-0 top-0 shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-blue-700">
        <div className="flex items-center space-x-3">
      <img
        src={logo}
        alt="Logo"
            className="w-10 h-10 cursor-pointer hover:scale-105 transition-transform duration-200"
        onClick={() => navigate("/home")}
      />
          <div>
            <h2 className="text-white font-bold text-lg">SentiVoice</h2>
            <p className="text-blue-200 text-xs">Patient Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-4 py-6 space-y-2">
      <Item 
        id="dashboard" 
        label="Dashboard" 
          icon={<FaThLarge />} 
        to="/patient-dashboard"
      />
      
      <Item 
        id="appointments" 
          label="Book Appointment" 
          icon={<FaCalendarAlt />} 
        to="/book-appointment"
      />
      
      <Item 
        id="messages" 
        label="Messages" 
          icon={<FaComments />} 
        to="/pa-messaging"
      />
        
        <Item 
          id="stats" 
          label="Appointment History" 
          icon={<FaHistory />} 
          to="/pa-appointment-history"
        />
      
      <Item 
        id="settings" 
        label="Settings" 
          icon={<FaCog />} 
        to="/pa-settings"
      />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-blue-700">
      <div
        onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 w-full cursor-pointer rounded-lg mx-2 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 group"
      >
          <FaSignOutAlt className="text-xl text-gray-300 group-hover:text-red-300 transition-colors duration-200" />
          <span className="text-sm font-medium text-gray-300 group-hover:text-red-300 transition-colors duration-200">
            Logout
          </span>
        </div>
      </div>
    </div>
  );
} 