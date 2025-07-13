import React from 'react';

const ReportsModal = ({ reports, onClose, onDownload }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-3/4 max-w-4xl max-h-3/4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold">Patient Reports</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        {reports.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No reports available</p>
            <p className="text-sm text-gray-500">
              Reports will appear here when patients complete voice analysis sessions or when you send manual reports.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report, index) => (
              <div key={report._id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">
                      Report from {report.patientName || report.patientUsername}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Sent on: {new Date(report.sentAt).toLocaleDateString()} at{' '}
                      {new Date(report.sentAt).toLocaleTimeString()}
                    </p>
                    {report.message && (
                      <div className="mt-2 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                        <p className="text-sm"><strong>Patient Message:</strong></p>
                        <p className="text-sm text-gray-700">{report.message}</p>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 space-y-2">
                    <button
                      onClick={() => onDownload(report._id, report.fileName)}
                      className="block w-full bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                    >
                      📄 Download PDF
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                      {report.fileName}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-700 text-white px-6 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsModal;
