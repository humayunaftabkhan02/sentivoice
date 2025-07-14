import React from "react";
import NotificationBell from "./NotificationBell/NotificationBell";
import MessageIcon from "./MessageIcon/MessageIcon";
import { FaUserCircle } from "react-icons/fa";

const UserTopBar = ({ username, fullName, role, profilePicture }) => {
  // Use initials for avatar if no image
  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : username?.slice(0, 2).toUpperCase();

  // Prepend 'Dr.' for therapists
  const displayName = role === 'therapist' && fullName ? `Dr. ${fullName}` : fullName;

  return (
    <div className="flex items-center justify-end space-x-4 bg-white py-3 px-6 rounded-xl shadow-sm border border-gray-100">
      <NotificationBell username={username} />
      <MessageIcon username={username} />
      <div className="flex items-center space-x-2 ml-2">
        {profilePicture ? (
          <img
            src={profilePicture}
            alt="Profile"
            className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            {initials || <FaUserCircle className="text-2xl" />}
          </div>
        )}
        <span className="font-semibold text-gray-900 max-w-[160px] truncate" title={displayName}>{displayName}</span>
      </div>
    </div>
  );
};

export default UserTopBar; 