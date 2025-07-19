import React, { useEffect, useState, useRef } from "react";
import { FaBell, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import { api } from "../../utils/api";

const NotificationBell = ({ username }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState('right');
  const [isMobile, setIsMobile] = useState(false);
  const notifsPerPage = 5;
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

    const fetchUnreadCount = async () => {
              try {
          const data = await api.get(`/api/notifications/${username}/unread-count`);
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

    // Mobile detection
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Click outside handler and window resize handler
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowNotifs(false);
        }
      };

      const handleResize = () => {
        if (showNotifs) {
          const position = calculateDropdownPosition();
          setDropdownPosition(position);
        }
      };

      if (showNotifs) {
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('resize', handleResize);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('resize', handleResize);
      };
    }, [showNotifs]);

    const calculateDropdownPosition = () => {
      if (!bellRef.current) return 'right';
      
      const bellRect = bellRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const dropdownWidth = 320; // w-80 = 320px
      
      // Check if dropdown would go off the right edge
      if (bellRect.right + dropdownWidth > viewportWidth) {
        return 'left';
      }
      
      return 'right';
    };

    const toggleNotifs = async () => {
      if (!showNotifs) {
        // Calculate position before showing dropdown
        const position = calculateDropdownPosition();
        setDropdownPosition(position);
        
        try {
          const data = await api.get(`/api/notifications/${username}`);
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
        const res = await api.put(`/api/notifications/${username}/mark-read`);
    
        setUnreadCount(0);
      } catch (err) {
        console.error(err);
      }
    };    

  const startIndex = currentPage * notifsPerPage;
  const currentNotifs = notifications.slice(startIndex, startIndex + notifsPerPage);

  return (
    <div className="relative cursor-pointer">
      <FaBell ref={bellRef} className="text-xl sm:text-2xl" onClick={toggleNotifs} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
      {showNotifs && (
        <div 
          ref={dropdownRef} 
          className={`${
            isMobile 
              ? 'fixed inset-0 z-50 bg-gradient-to-b from-gray-50 to-white flex flex-col' 
              : `absolute mt-2 sm:mt-3 ${dropdownPosition === 'right' ? 'right-0' : 'left-0'}`
          } w-full sm:w-72 md:w-80 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-fade-in`}
        >
          <div className={`${isMobile ? 'bg-white shadow-sm border-b border-gray-100' : 'bg-blue-50 text-blue-700'} px-4 sm:px-4 py-4 sm:py-3 flex items-center justify-between`}>
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${isMobile ? 'bg-blue-500' : 'bg-blue-400'}`}></div>
              <span className={`font-semibold text-lg sm:text-base ${isMobile ? 'text-gray-900' : 'text-blue-700'}`}>Notifications</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                className={`text-xs ${isMobile ? 'text-blue-600 hover:text-blue-700' : 'text-blue-500 hover:underline'} focus:outline-none font-medium`}
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
              {isMobile && (
                <button
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  onClick={() => setShowNotifs(false)}
                >
                  <FaTimes className="text-xl" />
                </button>
              )}
            </div>
          </div>
          <div className={`overflow-y-auto divide-y divide-gray-100 ${isMobile ? 'flex-1' : 'max-h-64 sm:max-h-96'}`}>
            {currentNotifs.length === 0 ? (
              <div className={`flex flex-col items-center justify-center text-gray-400 ${
                isMobile ? 'py-16' : 'py-8 sm:py-10'
              }`}>
                <div className={`${isMobile ? 'w-16 h-16' : 'w-12 h-12'} bg-gray-100 rounded-full flex items-center justify-center mb-4`}>
                  <svg width="24" height="24" className="text-gray-400" fill="none" viewBox="0 0 24 24">
                    <path d="M12 8v4l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
              </div>
            ) : (
              currentNotifs.map((notif) => (
                <div
                  key={notif._id}
                  className={`px-4 sm:px-4 py-4 sm:py-3 hover:bg-gray-50 transition-all duration-200 cursor-pointer group ${
                    isMobile ? 'py-5 border-b border-gray-50' : 'py-2 sm:py-3'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm sm:text-sm text-gray-900 group-hover:text-gray-700 leading-relaxed">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Pagination arrows */}
          <div className={`flex justify-between items-center px-4 sm:px-4 py-3 sm:py-2 ${isMobile ? 'bg-white border-t border-gray-100 py-4' : 'bg-blue-50 border-t border-blue-100 py-2'}`}>
            <button
              className={`${isMobile ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100' : 'text-blue-500 hover:bg-blue-100'} disabled:text-gray-300 p-3 rounded-full transition-all duration-200`}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
              disabled={currentPage === 0}
            >
              <FaChevronLeft className="text-lg sm:text-sm" />
            </button>
            <span className={`text-sm sm:text-xs font-medium ${isMobile ? 'text-gray-600' : 'text-blue-700'}`}>
              {currentPage + 1} / {Math.ceil(notifications.length / notifsPerPage) || 1}
            </span>
            <button
              className={`${isMobile ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100' : 'text-blue-500 hover:bg-blue-100'} disabled:text-gray-300 p-3 rounded-full transition-all duration-200`}
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, Math.ceil(notifications.length / notifsPerPage) - 1))
              }
              disabled={startIndex + notifsPerPage >= notifications.length}
            >
              <FaChevronRight className="text-lg sm:text-sm" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;