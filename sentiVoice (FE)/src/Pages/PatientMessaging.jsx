import React, { useState, useEffect, useRef } from "react";
import {
  FaThLarge,
  FaUser,
  FaCalendarPlus,
  FaComments,
  FaCog,
  FaEnvelope,
  FaSignOutAlt,
  FaBell,
  FaPaperPlane,
  FaSearch,
  FaEllipsisV,
  FaPhone,
  FaVideo,
  FaFile,
  FaSmile,
  FaClock,
  FaCheck,
  FaCheckDouble,
  FaCircle,
  FaUserMd,
  FaDownload,
  FaTimes
} from 'react-icons/fa';
import logo from '../assets/logo.png';
import LogoutIcon from '../Components/LogOutIcon/LogOutIcon.jsx';
import NotificationBell from '../Components/NotificationBell/NotificationBell.jsx';
import MessageIcon from "../Components/MessageIcon/MessageIcon.jsx";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import PatientSidebar from '../Components/PatientSidebar/PatientSidebar.jsx';
import EmojiPicker from '../Components/EmojiPicker/EmojiPicker.jsx';
import UserTopBar from '../Components/UserTopBar';

const PatientMessaging = () => {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState({});
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const [showTranscriptMenu, setShowTranscriptMenu] = useState(false);
  const [downloadingTranscript, setDownloadingTranscript] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [profilePicture, setProfilePicture] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL || "http://localhost:3000", {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('🟢 Socket connected:', socketRef.current.id);
      setSocketConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('🔴 Socket disconnected');
      setSocketConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setSocketConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
      api.get(`/api/user-info/${storedUsername}`)
        .then(data => {
          if (data.user?.info?.firstName && data.user?.info?.lastName) {
            setFullName(`${data.user.info.firstName} ${data.user.info.lastName}`);
          }
          const pic = data.user?.info?.profilePicture;
          if (pic) {
            if (pic.startsWith('data:image')) {
              setProfilePicture(pic);
            } else if (pic.startsWith('/uploads/')) {
              const filename = pic.split('/').pop();
              api.get(`/api/uploads/profile-pictures/${filename}`)
                .then(response => {
                  if (response.image) setProfilePicture(response.image);
                })
                .catch(() => setProfilePicture(null));
            } else {
              setProfilePicture(pic);
            }
          }
        })
        .catch(() => setProfilePicture(null));
    }
  }, []);

  useEffect(() => {
    if (username) {
      api.get(`/api/appointments?username=${username}&role=patient`)
        .then(data => {
          const accepted = data.appointments.filter((a) => a.status === "Accepted");
          setAppointments(accepted);
        })
        .catch(console.error);
    }
  }, [username]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on("receive_message", (incomingMessage) => {
        console.log('📥 Message received via socket:', incomingMessage);
        console.log('🔍 Socket message details:', {
          hasSelectedAppointment: !!selectedAppointment,
          appointmentMatch: selectedAppointment ? incomingMessage.appointmentId === selectedAppointment._id : false,
          senderMatch: incomingMessage.senderUsername !== username,
          messageType: incomingMessage.messageType,
          hasAttachment: !!incomingMessage.attachment,
          attachmentDetails: incomingMessage.attachment
        });
        
        if (
          selectedAppointment &&
          incomingMessage.appointmentId === selectedAppointment._id &&
          incomingMessage.senderUsername !== username // Don't add messages from current user
        ) {
          console.log('✅ Adding message to UI:', incomingMessage.content);
          if (!incomingMessage.timestamp) incomingMessage.timestamp = new Date().toISOString();
          setMessages((prev) => [...prev, incomingMessage]);
        } else {
          console.log('❌ Message not added:', {
            hasSelectedAppointment: !!selectedAppointment,
            appointmentMatch: selectedAppointment ? incomingMessage.appointmentId === selectedAppointment._id : false,
            senderMatch: incomingMessage.senderUsername !== username
          });
        }
      });

      socketRef.current.on("typing", (data) => {
        if (data.appointmentId === selectedAppointment?._id && data.username !== username) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        }
      });

      socketRef.current.on("stop_typing", (data) => {
        if (data.appointmentId === selectedAppointment?._id && data.username !== username) {
          setIsTyping(false);
        }
      });
    }
  
    return () => {
      if (socketRef.current) {
        socketRef.current.off("receive_message");
        socketRef.current.off("typing");
        socketRef.current.off("stop_typing");
      }
    };
  }, [selectedAppointment, username]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup effect to leave appointment room on unmount
  useEffect(() => {
    return () => {
      if (selectedAppointment) {
        if (socketRef.current) {
          socketRef.current.emit("leave_appointment", selectedAppointment._id);
        }
      }
    };
  }, [selectedAppointment]);

  // Close transcript menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTranscriptMenu && !event.target.closest('.transcript-menu')) {
        setShowTranscriptMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTranscriptMenu]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async (appointmentId) => {
    try {
      const data = await api.get(`/api/messages/${appointmentId}`);
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const formatTime = (ts) => {
    const date = new Date(ts);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/');
  };

  const handleSelect = async (appt) => {
    // Leave previous appointment room if exists
    if (selectedAppointment) {
      if (socketRef.current) {
        socketRef.current.emit("leave_appointment", selectedAppointment._id);
      }
    }

    setSelectedAppointment(appt);
    await loadMessages(appt._id);

    // Join new appointment room
    if (socketRef.current) {
      socketRef.current.emit("join_appointment", appt._id);
    }
  
    try {
      await api.put("/api/mark-read", {
        appointmentId: appt._id,
        username: username,
      });
    } catch (err) {
      console.error("Failed to mark messages as read", err);
    }
  };  
  
  const sendMessage = async () => {
    const trimmedMessage = newMessage.trim();
    if ((!trimmedMessage && !selectedFile) || !selectedAppointment) return;
  
    let messageData = {
      senderUsername: username,
      receiverUsername: selectedAppointment.therapistUsername,
      appointmentId: selectedAppointment._id,
      timestamp: new Date().toISOString(),
    };

    try {
      let response;
      
      if (selectedFile) {
        // Send file attachment
        const formData = new FormData();
        formData.append('attachment', selectedFile);
        formData.append('senderUsername', username);
        formData.append('receiverUsername', selectedAppointment.therapistUsername);
        formData.append('appointmentId', selectedAppointment._id);
        formData.append('messageType', 'file');
        
        response = await api.post("/api/messages/attachment", formData);
        
        messageData.content = `📎 ${selectedFile.name}`;
        messageData.attachment = {
          filename: selectedFile.name,
          originalName: selectedFile.name,
          mimetype: selectedFile.type,
          size: selectedFile.size
        };
        messageData.messageType = 'file';
      } else {
        // Send text message
        messageData.content = trimmedMessage;
        messageData.messageType = 'text';
        
        response = await api.post("/api/messages", {
          senderUsername: username,
          receiverUsername: selectedAppointment.therapistUsername,
          message: trimmedMessage,
          appointmentId: selectedAppointment._id,
          messageType: 'text'
        });
      }

      // Optimistically add message to UI
      setMessages(prev => [...prev, messageData]);
      setNewMessage("");
      setSelectedFile(null);

      // Update the message with the backend response data
      if (response.message) {
        const updatedMessage = {
          ...messageData,
          _id: response.message._id,
          content: response.message.content,
          attachment: response.message.attachment // Include attachment data
        };
        
        // Replace the optimistic message with the real one
        setMessages(prev => prev.map(msg => 
          msg === messageData ? updatedMessage : msg
        ));
      }
      
      // Emit to socket for real-time delivery to other users
      if (socketRef.current) {
        const socketMessage = {
          ...response.message,
          appointmentId: selectedAppointment._id,
        };
        console.log('📤 Emitting message to socket:', socketMessage);
        socketRef.current.emit("send_message", socketMessage);
      }
      
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = () => {
    if (selectedAppointment) {
      if (socketRef.current) {
        socketRef.current.emit("typing", {
          appointmentId: selectedAppointment._id,
          username: username
        });
      }
    }
  };

  const handleStopTyping = () => {
    if (selectedAppointment) {
      if (socketRef.current) {
        socketRef.current.emit("stop_typing", {
          appointmentId: selectedAppointment._id,
          username: username
        });
      }
    }
  };

  const filteredAppointments = appointments.filter(appt => 
    (appt.therapistFullName || appt.therapistUsername).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUnreadCount = (appointmentId) => {
    // This would need to be implemented based on your backend
    return 0;
  };

  // Helper function to format therapist name properly
  const formatTherapistName = (therapistFullName, therapistUsername) => {
    if (therapistFullName) {
      // If the name already starts with "Dr.", don't add it again
      if (therapistFullName.startsWith("Dr.")) {
        return therapistFullName;
      }
      return `Dr. ${therapistFullName}`;
    }
    return `Dr. ${therapistUsername}`;
  };

  const downloadTranscript = async () => {
    if (!selectedAppointment) return;
    setDownloadingTranscript(true);
    try {
      const response = await api.get(`/api/transcript/${selectedAppointment._id}`);
      const blob = new Blob([response.transcript], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Use full names in filename
      const filename = response.therapistFullName 
        ? `${response.therapistFullName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_transcript.txt`
        : `${selectedAppointment.therapistUsername}_transcript.txt`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setShowTranscriptMenu(false);
    } catch (err) {
      console.error("Failed to download transcript:", err);
    } finally {
      setDownloadingTranscript(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (25MB limit)
      if (file.size > 25 * 1024 * 1024) {
        alert('File size must be less than 25MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
  };

  const downloadAttachment = async (messageId) => {
    try {
      // Get the message to find the original filename and MIME type
      const messageResponse = await api.get(`/api/messages/${selectedAppointment._id}`);
      const message = messageResponse.messages.find(msg => msg._id === messageId);
      
      if (!message?.attachment) {
        console.error('No attachment found for message:', messageId);
        return;
      }
      
      // Make direct fetch request for blob response
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/messages/${messageId}/attachment`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      // Get the blob directly from the response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', message.attachment.originalName);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ File downloaded successfully:', message.attachment.originalName);
    } catch (error) {
      console.error('Failed to download attachment:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#EBEDE9]">
      <PatientSidebar current="messages" />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800">
              Messages
            </h1>
            <p className="text-gray-600 mt-1">Chat with your therapist and manage your conversations</p>
          </div>
          <UserTopBar username={username} fullName={fullName} role={"patient"} profilePicture={profilePicture} />
        </div>

        {/* Chat Layout */}
        <div className="flex-1 flex h-full min-h-0">
          {/* Conversations Sidebar */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
            {/* Search Header */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search therapists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {filteredAppointments.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <FaComments className="text-4xl mx-auto mb-2 text-gray-300" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Accepted appointments will appear here</p>
                </div>
              ) : (
                filteredAppointments.map((appt) => (
                  <div
                    key={appt._id}
                    onClick={() => handleSelect(appt)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedAppointment?._id === appt._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <FaUserMd className="text-green-600" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {formatTherapistName(appt.therapistFullName, appt.therapistUsername)}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {new Date(appt.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            Appointment: {appt.date} @ {appt.time}
                          </p>
                          {getUnreadCount(appt._id) > 0 && (
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-blue-600 font-medium">
                                {getUnreadCount(appt._id)} new message{getUnreadCount(appt._id) > 1 ? 's' : ''}
                              </span>
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col bg-white h-full">
            {selectedAppointment ? (
              <>
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <FaUserMd className="text-green-600" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          {formatTherapistName(selectedAppointment.therapistFullName, selectedAppointment.therapistUsername)}
                        </h2>
                        <p className="text-sm text-gray-600">
                          Appointment: {selectedAppointment.date} @ {selectedAppointment.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="relative transcript-menu">
                        <button 
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={() => setShowTranscriptMenu(!showTranscriptMenu)}
                        >
                          <FaEllipsisV />
                        </button>
                        {showTranscriptMenu && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                            <div className="py-1">
                              <button
                                onClick={downloadTranscript}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                disabled={downloadingTranscript}
                              >
                                {downloadingTranscript ? (
                                  <div className="flex items-center space-x-2">
                                    <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Downloading...</span>
                                  </div>
                                ) : (
                                  "Download Transcript"
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 min-h-0">
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.senderUsername === username ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                          msg.senderUsername === username ? 'order-2' : 'order-1'
                        }`}>
                          <div className={`px-4 py-3 rounded-2xl ${
                            msg.senderUsername === username
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                          }`}>
                            {/* Message Content */}
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            
                            {/* Attachment Display */}
                            {msg.attachment && msg.attachment.originalName && (
                              <div className={`mt-3 p-3 rounded-lg ${
                                msg.senderUsername === username 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                <div className="flex items-center space-x-2">
                                  <FaFile className="flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {msg.attachment.originalName}
                                    </p>
                                    <p className="text-xs opacity-75">
                                      {(msg.attachment.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => downloadAttachment(msg._id)}
                                    className={`p-1 rounded hover:bg-opacity-80 transition-colors ${
                                      msg.senderUsername === username 
                                        ? 'hover:bg-blue-400' 
                                        : 'hover:bg-gray-200'
                                    }`}
                                    title="Download attachment"
                                  >
                                    <FaDownload className="text-xs" />
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {/* Message Timestamp */}
                            <div className={`flex items-center justify-end mt-2 space-x-1 ${
                              msg.senderUsername === username ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              <span className="text-xs">{formatTime(msg.timestamp)}</span>
                              {msg.senderUsername === username && (
                                <FaCheckDouble className="text-xs" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-200">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input */}
                <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
                  {/* File Preview */}
                  {selectedFile && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FaFile className="text-blue-600" />
                          <span className="text-sm text-blue-800">{selectedFile.name}</span>
                          <span className="text-xs text-blue-600">
                            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-end space-x-3">
                    {/* File Upload Button */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,audio/*,video/*,application/zip,application/x-rar-compressed"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Attach file"
                    >
                      <FaFile />
                    </button>

                    {/* Emoji Picker Button */}
                    <button 
                      onClick={() => setShowEmojiPicker(true)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Add emoji"
                    >
                      <FaSmile />
                    </button>

                    <div className="flex-1">
                      <textarea
                        value={newMessage}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.length <= 500) {
                            setNewMessage(val);
                          }
                        }}
                        onKeyPress={handleKeyPress}
                        onKeyUp={handleStopTyping}
                        onKeyDown={handleTyping}
                        placeholder="Type a message..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="1"
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                      />
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() && !selectedFile}
                      className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FaPaperPlane />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>{newMessage.length}/500 characters</span>
                    <span>Press Enter to send, Shift+Enter for new line</span>
                  </div>
                </div>

                {/* Emoji Picker Modal */}
                {showEmojiPicker && (
                  <div className="relative">
                    <EmojiPicker
                      onEmojiSelect={handleEmojiSelect}
                      isOpen={showEmojiPicker}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FaComments className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a conversation</h3>
                  <p className="text-gray-500">Choose a therapist from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientMessaging;