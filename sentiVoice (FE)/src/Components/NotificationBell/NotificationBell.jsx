import React, { useEffect, useState } from "react";
import { FaBell, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { api } from "../../utils/api";

const NotificationBell = ({ username }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const notifsPerPage = 5;

    const fetchUnreadCount = async () => {
              try {
          const data = await api.get(`/notifications/${username}/unread-count`);
          setUnreadCount(data.unreadCount || 0);
        } catch (err) {
          console.error(err);
        }
    };

    useEffect(() => {
      if (!username) return;
    
      fetchUnreadCount(); // Initial check
    
      const interval = setInterval(() => {
        fetchUnreadCount(); // Poll every 10s
      }, 5000);
    
      return () => clearInterval(interval);
    }, [username]);

    const toggleNotifs = async () => {
      if (!showNotifs) {
                  try {
            const data = await api.get(`/notifications/${username}`);
            setNotifications(data.notifications || []);
            await markAllAsRead();           // ✅ mark as read
            await fetchUnreadCount();        // ✅ refresh badge count
          } catch (err) {
            console.error(err);
          }
      }
    
      setShowNotifs((prev) => !prev);
    };

    const markAllAsRead = async () => {
      try {
        const res = await api.put(`/notifications/${username}/mark-read`);
    
        setUnreadCount(0);
      } catch (err) {
        console.error(err);
      }
    };    

  const startIndex = currentPage * notifsPerPage;
  const currentNotifs = notifications.slice(startIndex, startIndex + notifsPerPage);

  return (
    <div className="relative cursor-pointer">
      <FaBell className="text-2xl" onClick={toggleNotifs} />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
      {showNotifs && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center justify-between">
            <span className="font-semibold text-blue-700 text-base">Notifications</span>
            <button
              className="text-xs text-blue-500 hover:underline focus:outline-none"
              onClick={markAllAsRead}
            >
              Mark all as read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {currentNotifs.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-gray-400">
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#e5e7eb"/><path d="M12 8v4l2 2" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <p className="mt-2 text-sm font-medium">No Notifications</p>
              </div>
            ) : (
              currentNotifs.map((notif) => (
                <div
                  key={notif._id}
                  className="px-4 py-3 hover:bg-blue-50 transition-colors cursor-pointer group"
                >
                  <p className="text-sm text-gray-900 group-hover:text-blue-700">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
          {/* Pagination arrows */}
          <div className="flex justify-between items-center px-4 py-2 bg-blue-50 border-t border-blue-100">
            <button
              className="text-blue-500 disabled:text-blue-200 p-1 rounded-full hover:bg-blue-100 transition"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
              disabled={currentPage === 0}
            >
              <FaChevronLeft />
            </button>
            <span className="text-xs text-blue-700 font-medium">
              {currentPage + 1} / {Math.ceil(notifications.length / notifsPerPage) || 1}
            </span>
            <button
              className="text-blue-500 disabled:text-blue-200 p-1 rounded-full hover:bg-blue-100 transition"
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, Math.ceil(notifications.length / notifsPerPage) - 1))
              }
              disabled={startIndex + notifsPerPage >= notifications.length}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;