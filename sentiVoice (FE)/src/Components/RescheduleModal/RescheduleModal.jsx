import React, { useEffect, useState } from "react";
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

const RescheduleModal = ({ appointment, onClose, onConfirm, userRole = 'patient' }) => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [reason, setReason] = useState("");

  const therapist = appointment.therapistUsername;

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const [slotRes, bookedRes] = await Promise.all([
          api.get(`/therapist/${therapist}/availability`),
          api.get(`/appointments/booked?therapist=${therapist}&date=${selectedDate}`)
        ]);

                  const slotData = slotRes;
          const bookedData = bookedRes;

        setAvailableSlots(slotData.slots || []);
        setBookedSlots(bookedData.bookedTimes || []);
      } catch (error) {
        console.error("Error fetching availability/booked times:", error);
      }
    };

    if (selectedDate) {
      const weekday = new Date(selectedDate).toLocaleDateString("en-US", {
        weekday: "long",
      });
      setSelectedDay(weekday);
      fetchAvailability();
    }
  }, [selectedDate]);

  const getTimesForDay = () => {
    const slots = availableSlots.filter(
      (s) => s.day.toLowerCase() === selectedDay.toLowerCase()
    );
  
    const now = new Date();
    const today = new Date().toISOString().split("T")[0];
  
    return slots.flatMap((s) =>
      generateTimes(s.start, s.end).filter((slot) => {
        if (selectedDate !== today) return true;
  
        // Convert slot (e.g., "10:00 AM") to a Date object for today
        const [time, meridian] = slot.split(" ");
        let [hour, minute] = time.split(":").map(Number);
        if (meridian === "PM" && hour < 12) hour += 12;
        if (meridian === "AM" && hour === 12) hour = 0;
  
        const slotDateTime = new Date();
        slotDateTime.setHours(hour, minute, 0, 0);
  
        return slotDateTime > now;
      })
    );
  };

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime) return alert("Please select both date and time.");
    onConfirm(selectedDate, selectedTime, reason);
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
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              max={new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split("T")[0]}
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <FaClock className="text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Select New Time</label>
            </div>
            <select
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              disabled={!selectedDate}
            >
              <option value="">Select a time slot</option>
              {getTimesForDay().map((slot, idx) => {
                const isBooked = bookedSlots.includes(slot);
                return (
                  <option key={idx} value={slot} disabled={isBooked}>
                    {isBooked ? `🛑 ${slot} (Booked)` : slot}
                  </option>
                );
              })}
            </select>
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
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for rescheduling to help us improve our services..."
            />
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
            >
              <FaCheck className="text-sm" />
              <span>Confirm Reschedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;