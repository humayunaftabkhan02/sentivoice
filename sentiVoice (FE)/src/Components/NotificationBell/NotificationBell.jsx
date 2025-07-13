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
        <div className="absolute right-0 mt-8 w-72 bg-white border border-gray-300 rounded shadow-lg p-2 z-50">
          {currentNotifs.length === 0 ? (
            <p className="text-center text-sm">No Notifications</p>
          ) : (
            currentNotifs.map((notif) => (
              <div key={notif._id} className="border-b border-gray-200 p-2">
                <p className="text-sm">{notif.message}</p>
                <p className="text-xs text-gray-400">{new Date(notif.createdAt).toLocaleString()}</p>
              </div>
            ))
          )}

          {/* Pagination arrows */}
          <div className="flex justify-between items-center mt-2">
            <button
              className="text-gray-600 disabled:text-gray-300"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
              disabled={currentPage === 0}
            >
              <FaChevronLeft />
            </button>
            <span className="text-sm text-gray-600">
              {currentPage + 1} / {Math.ceil(notifications.length / notifsPerPage) || 1}
            </span>
            <button
              className="text-gray-600 disabled:text-gray-300"
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
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;