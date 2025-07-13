import React, { useState } from "react";

const CancelModal = ({ onClose, onConfirm }) => {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-[#EBEDE9]/90 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md space-y-4">
        <h2 className="text-xl font-semibold">Cancel Appointment</h2>
        <p>Are you sure you want to cancel this appointment?</p>
        <textarea
          className="w-full p-2 border rounded"
          rows="3"
          placeholder="Enter reason for cancellation (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        ></textarea>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => onClose()}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            No
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelModal;