import React, { useState } from "react";
import { FaTimes, FaExclamationTriangle, FaCalendarTimes, FaCommentAlt } from "react-icons/fa";

const CancelModal = ({ onClose, onConfirm, userRole = 'patient' }) => {
  const [reason, setReason] = useState("");

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <FaCalendarTimes className="text-white text-xl" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Cancel Appointment</h3>
              <p className="text-sm text-gray-600 mt-1">Are you sure you want to cancel this appointment?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning Message */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <FaExclamationTriangle className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-amber-800">Important Notice</span>
                <p className="text-sm text-amber-700 mt-1">
                  {userRole === 'therapist' 
                    ? 'Cancelling this appointment will notify your patient. Please provide a reason to help us improve our services.'
                    : 'Cancelling this appointment will notify your therapist. Please provide a reason to help us improve our services.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <FaCommentAlt className="text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Cancellation Reason (Optional)</label>
            </div>
            <textarea
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all duration-200"
              rows="3"
              placeholder="Please provide a reason for cancellation to help us improve our services..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 border border-gray-200"
            >
              Keep Appointment
            </button>
            <button
              onClick={() => onConfirm(reason)}
              className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Cancel Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelModal;