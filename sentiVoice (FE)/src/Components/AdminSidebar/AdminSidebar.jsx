import React from 'react';
import {
  FaUserCheck,
  FaThLarge,
  FaMoneyCheckAlt,
  FaSignOutAlt,
  FaCog,
  FaUsers
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';

export default function AdminSidebar({ current, pendingApprovals = 0, pendingPayments = 0 }) {
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

  const Item = ({ id, icon, label, to, badge }) => {
    // Ensure badge is a number and only show when greater than 0
    const badgeCount = typeof badge === 'number' ? badge : 0;
    const shouldShowBadge = badgeCount > 0;

    return (
      <div
        onClick={() => navigate(to)}
        className={
          "flex items-center px-4 py-3 w-full cursor-pointer rounded-lg mx-2 transition-all duration-200 group " +
          (current === id
            ? "bg-white text-blue-600 shadow-lg border-l-4 border-blue-600"
            : "text-gray-300 hover:bg-white/10 hover:text-white")
        }>
        <div className="flex items-center space-x-3 w-full">
          <div className="relative">
            <div className={`text-xl transition-transform duration-200 group-hover:scale-110 ${
              current === id ? "text-blue-600" : "text-gray-300 group-hover:text-white"
            }`}>
              {icon}
            </div>
            {shouldShowBadge && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </div>
          <span className={`text-sm font-medium transition-colors duration-200 ${
            current === id ? "text-blue-600" : "text-gray-300 group-hover:text-white"
          }`}>
            {label}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col min-h-screen fixed left-0 top-0 shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <img
            src={logo}
            alt="Logo"
            className="w-10 h-10 cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={() => navigate("/admin-dashboard")}
          />
          <div>
            <h2 className="text-white font-bold text-lg">SentiVoice</h2>
            <p className="text-gray-300 text-xs">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-4 py-6 space-y-2">
        <Item 
          id="dashboard" 
          label="Dashboard" 
          icon={<FaThLarge />} 
          to="/admin-dashboard"
        />
        
        <Item 
          id="approval" 
          label="Approve" 
          icon={<FaUserCheck />} 
          to="/therapist-approval"
          badge={pendingApprovals}
        />
        
        <Item 
          id="payments" 
          label="Payments" 
          icon={<FaMoneyCheckAlt />} 
          to="/payments"
          badge={pendingPayments}
        />
        
        <Item 
          id="users" 
          label="Users" 
          icon={<FaUsers />} 
          to="/admin-user-list"
        />
        
        <Item 
          id="settings" 
          label="Settings" 
          icon={<FaCog />} 
          to="/admin-settings"
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        {/* Logout */}
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