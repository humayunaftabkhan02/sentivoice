import React, { useState } from 'react';
import { FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const SendReportModal = ({ patientUsername, therapistUsername, therapistFullName, onClose, onSend }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success'); // 'success' or 'error'
  const [modalMessage, setModalMessage] = useState('');

  const handleSend = async () => {
    if (!message.trim()) {
      setModalType('error');
      setModalMessage('Please add a message for the therapist');
      setShowModal(true);
      return;
    }

    setSending(true);
    try {
      await onSend(message);
      setModalType('success');
      setModalMessage('✅ Report sent successfully to therapist!');
      setShowModal(true);
      setTimeout(() => {
        setShowModal(false);
        onClose();
      }, 1500);
    } catch (error) {
      setModalType('error');
      setModalMessage('❌ Failed to send report. Please try again.');
      setShowModal(true);
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
      {/* Success/Error Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100 relative animate-fade-in flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg ${modalType === 'success' ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-red-400 to-rose-500'}`}> 
              {modalType === 'success' ? (
                <FaCheck className="text-white text-3xl" />
              ) : (
                <FaExclamationTriangle className="text-white text-3xl" />
              )}
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${modalType === 'success' ? 'text-green-700' : 'text-red-700'}`}>{modalType === 'success' ? 'Success' : 'Error'}</h2>
            <p className="text-gray-700 mb-6">{modalMessage}</p>
            <button
              className={`bg-gradient-to-r ${modalType === 'success' ? 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' : 'from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'} text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200 text-base`}
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendReportModal;
