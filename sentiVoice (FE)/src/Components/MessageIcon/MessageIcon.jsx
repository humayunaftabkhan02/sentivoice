import React, { useEffect, useState } from "react";
import { FaEnvelope } from "react-icons/fa";
import { io } from "socket.io-client";
import { api } from "../../utils/api";

const socket = io("http://localhost:3000"); // same as backend

const MessageIcon = ({ username }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadMessages = async () => {
    if (!username) return;
    try {
      const data = await api.get(`/unread-count/${username}`);
      
      // Ensure we're getting a number and handle edge cases
      const count = typeof data.unreadCount === 'number' ? data.unreadCount : 0;
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch unread messages count", err);
      // Reset to 0 on error
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    // Reset count when username changes
    setUnreadCount(0);
    
    if (!username) return;
    
    fetchUnreadMessages();

    socket.on("receive_message", (incomingMessage) => {
      // Only refetch if the message is for this user
      if (incomingMessage.receiverUsername === username) {
        fetchUnreadMessages();
      }
    });

    const interval = setInterval(fetchUnreadMessages, 30000);
    return () => {
      clearInterval(interval);
      socket.off("receive_message");
    };
  }, [username]);

  return (
    <div className="relative cursor-pointer" onClick={() => (window.location.href = username.includes("therapist") ? '/th-messaging' : '/pa-messaging')}>
      <FaEnvelope className="text-2xl" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </div>
  );
};

export default MessageIcon;