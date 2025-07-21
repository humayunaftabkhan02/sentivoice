import React, { useState, useEffect } from "react";
import { FaTimes, FaExclamationTriangle, FaCalendarTimes, FaCommentAlt } from "react-icons/fa";

const CancelModal = ({ onClose, onConfirm, userRole = 'patient', appointmentDate, appointmentTime, errorMessage }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const MAX_REASON_LENGTH = 50;
  const [tooLate, setTooLate] = useState(false);

  useEffect(() => {
    if (userRole === 'patient' && appointmentDate && appointmentTime) {
      const appointmentDateTime = new Date(`${appointmentDate} ${appointmentTime}`);
      const now = new Date();
      const diffMs = appointmentDateTime - now;
      const diffHours = diffMs / (1000 * 60 * 60);
      setTooLate(diffHours < 48);
    }
  }, [userRole, appointmentDate, appointmentTime]);

  const validateReason = (val) => {
    if (val.length > MAX_REASON_LENGTH) return `Reason cannot exceed ${MAX_REASON_LENGTH} characters`;
    if (/https?:\/\//i.test(val) || /<script/i.test(val)) return 'Links or code are not allowed in the reason';
    return '';
  };

  const handleReasonChange = (e) => {
    const val = e.target.value;
    setReason(val);
    setError(validateReason(val));
  };

  const handleReasonBlur = (e) => {
    setError(validateReason(e.target.value));
  };

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
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 shadow-md">
                <FaExclamationTriangle className="text-white text-xl" />
              </div>
              <div className="flex-1">
                <span className="text-base font-semibold text-amber-900">Important Notice</span>
                <p className="text-sm text-amber-800 mt-1">
                  {userRole === 'therapist' 
                    ? 'Cancelling this appointment will notify your patient. Please provide a reason to help us improve our services.'
                    : (
                      <>
                        Cancelling this appointment will notify your therapist. Please provide a reason to help us improve our services.
                      </>
                    )
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Error Card */}
          {errorMessage && (
            <div className="flex items-center space-x-3 bg-red-50 border border-red-200 rounded-lg p-3 mb-2 animate-fade-in">
              <FaExclamationTriangle className="text-red-400 text-lg flex-shrink-0" />
              <div className="flex-1 text-sm text-red-700 font-medium">{errorMessage}</div>
            </div>
          )}

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
              onChange={handleReasonChange}
              onBlur={handleReasonBlur}
              maxLength={MAX_REASON_LENGTH + 10}
            />
            {error && (
              <p className="text-red-500 text-xs mt-1" role="alert">{error}</p>
            )}
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
              onClick={async () => {
                if (isSubmitting) return;
                setIsSubmitting(true);
                try {
                  await onConfirm(reason);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={!!error || isSubmitting || (userRole === 'patient' && tooLate)}
              className={`flex-1 font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                isSubmitting || !!error || (userRole === 'patient' && tooLate)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cancelling...
                </>
              ) : (
                'Cancel Appointment'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelModal;