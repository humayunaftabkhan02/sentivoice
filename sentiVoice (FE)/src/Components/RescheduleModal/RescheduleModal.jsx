import React, { useEffect, useState } from "react";
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

const RescheduleModal = ({ appointment, onClose, onConfirm }) => {
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
    <div className="fixed inset-0 bg-[#EBEDE9]/90 flex justify-center items-center z-50">
      <div className="bg-white rounded p-6 w-[400px] shadow-lg">
        <h2 className="text-xl font-bold mb-4">Reschedule Appointment</h2>

        <label className="block font-medium mb-1">Select Date</label>
        <input
          type="date"
          className="w-full border p-2 rounded mb-4"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          max={new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split("T")[0]}
        />

        <label className="block font-medium mb-1">Select Time</label>
        <select
          className="w-full border p-2 rounded mb-4"
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
        <label className="block font-medium mb-1">Reason for Rescheduling</label>
            <textarea
            className="w-full border p-2 rounded mb-4"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for rescheduling (optional)"
            ></textarea>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-300">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded bg-blue-600 text-white">Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;