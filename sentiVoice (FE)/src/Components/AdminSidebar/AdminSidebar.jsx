import React, { useState } from 'react';
import {
  FaUserCheck,
  FaThLarge,
  FaMoneyCheckAlt,
  FaSignOutAlt,
  FaCog,
  FaUsers,
  FaUndoAlt,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';

export default function AdminSidebar({ current, pendingApprovals = 0, pendingPayments = 0, pendingRefunds = 0 }) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberedPassword');
    localStorage.removeItem('rememberMe');
    navigate('/');
  };

  const Item = ({ id, icon, label, to, badge, onClick }) => {
    // Ensure badge is a number and only show when greater than 0
    const badgeCount = typeof badge === 'number' ? badge : 0;
    const shouldShowBadge = badgeCount > 0;

    return (
      <div
        onClick={() => {
          navigate(to);
          if (onClick) onClick();
        }}
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
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-gray-900 text-white p-3 rounded-lg shadow-lg hover:bg-gray-800 transition-colors duration-200"
        >
          {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Mobile Menu Overlay - Very subtle */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 pointer-events-auto" 
          style={{ 
            background: 'linear-gradient(to right, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.05) 50%, transparent 100%)'
          }}
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 shadow-xl z-50
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-80 sm:w-80 lg:w-64
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={logo}
                alt="Logo"
                className="w-10 h-10 cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => {
                  navigate("/home");
                  setIsMobileMenuOpen(false);
                }}
              />
              <div>
                <h2 className="text-white font-bold text-lg">SentiVoice</h2>
                <p className="text-gray-300 text-xs">Admin Portal</p>
              </div>
            </div>
            
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors duration-200"
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 py-6 space-y-2">
          <Item 
            id="dashboard" 
            label="Dashboard" 
            icon={<FaThLarge />} 
            to="/admin-dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <Item 
            id="approval" 
            label="Approve" 
            icon={<FaUserCheck />} 
            to="/therapist-approval"
            badge={pendingApprovals}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <Item 
            id="payments" 
            label="Payments" 
            icon={<FaMoneyCheckAlt />} 
            to="/payments"
            badge={pendingPayments}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <Item 
            id="refunds" 
            label="Refund Requests" 
            icon={<FaUndoAlt />} 
            to="/refund-requests"
            badge={pendingRefunds}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <Item 
            id="users" 
            label="Users" 
            icon={<FaUsers />} 
            to="/admin-user-list"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <Item 
            id="settings" 
            label="Settings" 
            icon={<FaCog />} 
            to="/admin-settings"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          {/* Logout */}
          <div
            onClick={() => {
              handleLogout();
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center space-x-3 px-4 py-3 w-full cursor-pointer rounded-lg mx-2 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 group"
          >
            <FaSignOutAlt className="text-xl text-gray-300 group-hover:text-red-300 transition-colors duration-200" />
            <span className="text-sm font-medium text-gray-300 group-hover:text-red-300 transition-colors duration-200">
              Logout
            </span>
          </div>
        </div>
      </div>
    </>
  );
}