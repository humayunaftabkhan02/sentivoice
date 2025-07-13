import React, { useState } from 'react';

const SendReportModal = ({ patientUsername, therapistUsername, therapistFullName, onClose, onSend }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      alert('Please add a message for the therapist');
      return;
    }

    setSending(true);
    try {
      await onSend(message);
      alert('✅ Report sent successfully to therapist!');
      onClose();
    } catch (error) {
      alert('❌ Failed to send report. Please try again.');
      console.error('Error sending report:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-xl font-bold mb-4">Send Report to Therapist</h3>
        <p className="text-gray-600 mb-4">
          This will send your PDF report to <strong>Dr. {therapistFullName || therapistUsername}</strong>
        </p>
        
        <textarea
          placeholder="Add a message for your therapist..."
          className="w-full p-3 border rounded-lg mb-4 h-24 resize-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
        />
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            disabled={sending}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendReportModal;
