import React, { useEffect, useState } from "react";
import { FaDownload, FaFileAlt, FaInbox, FaUserMd, FaChevronLeft, FaChevronRight, FaExclamationTriangle, FaRegFilePdf, FaEnvelope } from "react-icons/fa";
import { api } from "../../utils/api";

const REPORTS_PER_PAGE = 6;

const ReportsFromTherapist = ({ username }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError("");
    api.get(`/api/reports/patient/${username}`)
      .then((data) => {
        const sentReports = (data.reports || []).filter(r => r.sentToPatient);
        setReports(sentReports);
        setCurrentPage(1); // Reset to first page on new data
      })
      .catch(() => setError("Failed to fetch reports."))
      .finally(() => setLoading(false));
  }, [username]);

  const downloadReport = async (reportId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/download/${reportId}`, { method: 'GET', headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setErrorModalMessage('Failed to download report.');
      setShowErrorModal(true);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(reports.length / REPORTS_PER_PAGE);
  const paginatedReports = reports.slice((currentPage - 1) * REPORTS_PER_PAGE, currentPage * REPORTS_PER_PAGE);

  return (
    <>
      {/* Empty State */}
      {loading ? (
        <div className="text-gray-500">Loading reports...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : !reports.length ? (
        <div className="flex flex-col items-center justify-center py-8">
          <FaInbox className="text-4xl text-blue-200 mb-2" />
          <div className="text-gray-500 text-center">No reports have been sent to you yet.<br/>When your therapist sends you a report, it will appear here.</div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedReports.map((report) => {
              const initials = report.therapistFullName
                ? report.therapistFullName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
                : (report.therapistUsername ? report.therapistUsername[0].toUpperCase() : 'T');
              return (
                <div key={report._id} className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-base shadow-sm border-2 border-white">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 text-base truncate max-w-[180px]" title={report.fileName || 'Report'}>
                        {report.fileName || 'Report'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold rounded px-2 py-0.5">{new Date(report.sentToPatientAt).toLocaleDateString()}</span>
                        <span className="flex items-center text-xs text-gray-500 gap-1">
                          <FaUserMd className="text-blue-400" />
                          {report.therapistFullName ? `Dr. ${report.therapistFullName}` : (report.therapistUsername || 'Therapist')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
                    <button
                      onClick={() => downloadReport(report._id, report.fileName)}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      <FaDownload className="text-base" /> Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-6 space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-all"
              >
                <FaChevronLeft className="mr-1" /> Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm rounded-lg font-semibold transition-all duration-150 ${currentPage === page ? 'bg-blue-500 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center px-3 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-all"
              >
                Next <FaChevronRight className="ml-1" />
              </button>
            </div>
          )}
        </>
      )}
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100 relative animate-fade-in flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center mb-4 shadow-lg">
              <FaExclamationTriangle className="text-white text-3xl" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-red-700">Error</h2>
            <p className="text-gray-700 mb-6">{errorModalMessage}</p>
            <button
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200 text-base"
              onClick={() => setShowErrorModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportsFromTherapist; 