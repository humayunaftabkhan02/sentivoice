import React from 'react';
import logo from '../assets/logo.png';

export default function MaintenancePage({ message }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
      <img src={logo} alt="SentiVoice Logo" className="w-24 h-24 mb-6 drop-shadow-lg" />
      <h1 className="text-4xl font-bold text-blue-700 mb-2">SentiVoice is Under Maintenance</h1>
      <p className="text-lg text-gray-700 mb-6 text-center max-w-xl">
        {message || 'We are currently performing scheduled maintenance. Please check back soon!'}
      </p>
      <div className="bg-white rounded-xl shadow-lg px-8 py-6 mt-4 border border-blue-100">
        <span className="text-blue-600 font-semibold">Thank you for your patience.</span>
      </div>
    </div>
  );
} 