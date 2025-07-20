import React, { useEffect, useState, useMemo } from "react";
import { FaTimes, FaCalendarAlt, FaClock, FaCommentAlt, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { api } from "../../utils/api";

// Converts "3:00 PM" format to Date, and generates 30-min time slots
const generateTimes = (start, end) => {
  const parseTime = (str) => {
    const [time, meridian] = str.split(" ");
    let [hour, minute] = time.split(":").map(Number);
    if (meridian === "PM" && hour < 12) hour += 12;
    if (meridian === "AM" && hour === 12) hour = 0;
    return new Date(1970, 0, 1, hour, minute);
  };

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

  const times = [];
  let current = parseTime(start);
  const endTime = parseTime(end);

  while (current < endTime) {
    times.push(formatTime(current));
    current = new Date(current.getTime() + 30 * 60000);
  }

  return times;
};

// Add normalization function
function normalizeSessionType(type) {
  if (!type) return '';
  const t = type.trim().toLowerCase();
  if (t === 'in-person' || t === 'in-person session' || t === 'inperson') return 'in-person';
  if (t === 'online' || t === 'online session') return 'online';
  return '';
}

const RescheduleModal = ({ appointment, onClose, onConfirm, userRole = 'patient' }) => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(appointment.date || "");
  const [selectedTime, setSelectedTime] = useState(appointment.time || "");
  // Remove selectedDay state
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const MAX_REASON_LENGTH = 50;

  const validateReason = (val) => {
    if (val.length > MAX_REASON_LENGTH) return `Reason cannot exceed ${MAX_REASON_LENGTH} characters`;
    if (/https?:\/\//i.test(val) || /<script/i.test(val)) return 'Links or code are not allowed in the reason';
    return '';
  };

  const handleReasonChange = (e) => {
    const val = e.target.value;
    setReason(val);
    setReasonError(validateReason(val));
  };

  const handleReasonBlur = (e) => {
    setReasonError(validateReason(e.target.value));
  };
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const therapist = appointment.therapistUsername;

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const sessionType = normalizeSessionType(appointment.sessionType);
        const [slotRes, bookedRes] = await Promise.all([
          api.get(`/api/therapist/${therapist}/availability?sessionType=${encodeURIComponent(sessionType)}`),
          api.get(`/api/appointments/booked?therapist=${therapist}&date=${selectedDate}`)
        ]);
        const slotData = slotRes;
        const bookedData = bookedRes;
        setAvailableSlots(slotData.slots || []);
        setBookedSlots(bookedData.bookedTimes || []);
      } catch (err) {
        setAvailableSlots([]);
        setBookedSlots([]);
        // Error log can remain for actual errors
        console.error('Error fetching availability/booked times:', err);
      }
    };
    if (therapist && selectedDate) fetchAvailability();
  }, [therapist, selectedDate, appointment.sessionType]);

  // Compute timesForDay using useMemo to always use latest state
  const timesForDay = useMemo(() => {
    const dayString = selectedDate
      ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })
      : '';
    const slots = availableSlots.filter(
      (s) => s.day && s.day.toLowerCase() === dayString.toLowerCase()
    );
    const now = new Date();
    const today = new Date().toISOString().split("T")[0];
    return slots.flatMap((s) =>
      generateTimes(s.start, s.end).filter((slot) => {
        if (selectedDate !== today) return true;
        const [time, meridian] = slot.split(" ");
        let [hour, minute] = time.split(":").map(Number);
        if (meridian === "PM" && hour < 12) hour += 12;
        if (meridian === "AM" && hour === 12) hour = 0;
        const slotDateTime = new Date();
        slotDateTime.setHours(hour, minute, 0, 0);
        return slotDateTime > now;
      })
    );
  }, [availableSlots, selectedDate]);

  // Add real-time validation handlers
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setErrors((prev) => ({ ...prev, date: undefined }));
    // Validate immediately
    validateField('date', e.target.value, selectedTime);
  };
  const handleDateBlur = (e) => {
    validateField('date', e.target.value, selectedTime);
  };
  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
    setErrors((prev) => ({ ...prev, time: undefined }));
    // Validate immediately
    validateField('time', selectedDate, e.target.value);
  };
  const handleTimeBlur = (e) => {
    validateField('time', selectedDate, e.target.value);
  };

  function validateField(field, dateVal, timeVal) {
    let newErrors = { ...errors };
    if (field === 'date') {
      if (!dateVal) newErrors.date = 'Please select a date.';
      else {
        const today = new Date();
        const sel = new Date(dateVal);
        today.setHours(0,0,0,0);
        sel.setHours(0,0,0,0);
        if (sel < today) newErrors.date = 'You cannot reschedule to a past date.';
        else delete newErrors.date;
      }
    }
    if (field === 'time') {
      if (!timeVal) newErrors.time = 'Please select a time.';
      else if (dateVal === appointment.date && timeVal === appointment.time) {
        newErrors.time = 'You cannot reschedule to the same date and time as the original appointment.';
      } else delete newErrors.time;
    }
    setErrors(newErrors);
  }

  const handleSubmit = async () => {
    let newErrors = {};
    setApiError("");
    // Date validation
    if (!selectedDate) newErrors.date = "Please select a date.";
    else {
      const today = new Date();
      const sel = new Date(selectedDate);
      today.setHours(0,0,0,0);
      sel.setHours(0,0,0,0);
      if (sel < today) newErrors.date = "You cannot reschedule to a past date.";
    }
    // Time validation
    if (!selectedTime) newErrors.time = "Please select a time.";
    // Prevent rescheduling to the same date and time
    if (
      selectedDate === appointment.date &&
      selectedTime === appointment.time
    ) {
      newErrors.time = "You cannot reschedule to the same date and time as the original appointment.";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    try {
      await onConfirm(selectedDate, selectedTime, reason);
    } catch (err) {
      setApiError(err?.message || "Failed to reschedule. Please try again.");
    }
  };

  if (!appointment) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <FaCalendarAlt className="text-white text-xl" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Reschedule Appointment</h3>
              <p className="text-sm text-gray-600 mt-1">Choose a new date and time for your appointment</p>
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
          {/* Current Appointment Info */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <FaExclamationTriangle className="text-blue-500" />
              <div>
                <span className="text-sm font-medium text-gray-800">Current Appointment</span>
                <p className="text-sm text-gray-600 mt-1">
                  {userRole === 'therapist' 
                    ? `${appointment.date} at ${appointment.time} with ${appointment.patientFullName || appointment.patientUsername}`
                    : `${appointment.date} at ${appointment.time} with ${appointment.therapistFullName || `Dr. ${appointment.therapistUsername}`}`
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Session Type: <span className="font-semibold">{appointment.sessionType === 'in-person' ? 'In-person' : appointment.sessionType === 'online' ? 'Online' : 'N/A'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <FaCalendarAlt className="text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Select New Date</label>
            </div>
            <input
              type="date"
              className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.date ? 'border-red-500' : 'border-gray-200'}`}
              value={selectedDate}
              onChange={handleDateChange}
              onBlur={handleDateBlur}
              min={new Date().toISOString().split("T")[0]}
              max={new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split("T")[0]}
              aria-required="true"
              aria-invalid={!!errors.date}
              aria-describedby={errors.date ? 'date-error' : undefined}
            />
            {errors.date && (
              <p id="date-error" className="text-red-500 text-xs mt-1" role="alert">{errors.date}</p>
            )}
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <FaClock className="text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Select New Time</label>
            </div>
            <select
              className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 ${errors.time ? 'border-red-500' : 'border-gray-200'}`}
              value={selectedTime}
              onChange={handleTimeChange}
              onBlur={handleTimeBlur}
              disabled={!selectedDate}
              aria-required="true"
              aria-invalid={!!errors.time}
              aria-describedby={errors.time ? 'time-error' : undefined}
            >
              <option value="">Select a time slot</option>
              {timesForDay.map((slot, idx) => {
                const isBooked = bookedSlots.includes(slot);
                return (
                  <option key={idx} value={slot} disabled={isBooked}>
                    {isBooked ? `🛑 ${slot} (Booked)` : slot}
                  </option>
                );
              })}
            </select>
            {timesForDay.length === 0 && selectedDate && (
              <p className="text-red-500 text-xs mt-1" role="alert">No available slots for this day. Please select another date.</p>
            )}
            {errors.time && (
              <p id="time-error" className="text-red-500 text-xs mt-1" role="alert">{errors.time}</p>
            )}
          </div>

          {/* Reason Input */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <FaCommentAlt className="text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Reason for Rescheduling (Optional)</label>
            </div>
            <textarea
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
              rows="3"
              value={reason}
              onChange={handleReasonChange}
              onBlur={handleReasonBlur}
              maxLength={MAX_REASON_LENGTH + 10}
              placeholder="Please provide a reason for rescheduling to help us improve our services..."
            />
            {reasonError && (
              <p className="text-red-500 text-xs mt-1" role="alert">{reasonError}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button 
              onClick={onClose} 
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 border border-gray-200"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit} 
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
              disabled={!!reasonError}
            >
              <FaCheck className="text-sm" />
              <span>Confirm Reschedule</span>
            </button>
          </div>
          {apiError && (
            <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg p-2 text-xs mb-2" role="alert">{apiError}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;