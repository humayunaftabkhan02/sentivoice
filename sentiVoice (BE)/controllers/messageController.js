const crypto = require("crypto");
const Message = require("../models/messageModel");
const Appointment = require("../models/appointmentModel");
const path = require("path");
const fs = require("fs");

const ENCRYPTION_KEY = crypto.scryptSync("sentivoiceisthebest123", "salt", 32); // 32 bytes key
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(encrypted) {
  const [ivHex, encryptedText] = encrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

exports.sendMessage = async (req, res) => {
  try {
    console.log('📨 SendMessage called with:', {
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null,
      user: req.user
    });

    const { senderUsername, receiverUsername, message, appointmentId, messageType = 'text' } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.status !== "Accepted") {
      console.log('❌ Appointment validation failed:', { appointmentId, appointment: appointment?.status });
      return res.status(403).json({ error: "Cannot send message. Appointment not accepted." });
    }

    let messageData = {
      senderUsername,
      receiverUsername,
      appointmentId,
      messageType
    };

    // Handle different message types
    if (req.file) {
      // File attachment
      console.log('📎 Processing file attachment:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });
      
      messageData.content = `📎 ${req.file.originalname}`;
      messageData.attachment = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      };
      messageData.messageType = 'file';
    } else if (messageType === 'emoji') {
      // Emoji message
      console.log('😊 Processing emoji message');
      messageData.content = message;
    } else {
      // Text message
      console.log('📝 Processing text message');
      messageData.content = encrypt(message);
    }

    console.log('💾 Creating message with data:', messageData);
    const messageDoc = await Message.create(messageData);

    // Return the message with appropriate content for immediate display
    const responseMessage = {
      ...messageDoc._doc,
      content: req.file ? `📎 ${req.file.originalname}` : (messageType === 'text' ? message : messageDoc.content),
      attachment: req.file ? {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      } : undefined
    };

    console.log('✅ Message created successfully:', responseMessage._id);
    console.log('📋 Response message structure:', {
      id: responseMessage._id,
      content: responseMessage.content,
      messageType: responseMessage.messageType,
      hasAttachment: !!responseMessage.attachment,
      attachment: responseMessage.attachment
    });
    res.status(201).json({ message: responseMessage });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const messages = await Message.find({ appointmentId }).sort({ timestamp: 1 });

    const decryptedMessages = messages.map(msg => {
      const messageData = {
        ...msg._doc,
        content: msg.messageType === 'text' ? decrypt(msg.content) : msg.content
      };
      return messageData;
    });

    res.status(200).json({ messages: decryptedMessages });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: "Failed to get messages" });
  }
};

// controllers/messageController.js
exports.getUnreadMessageCount = async (req, res) => {
    try {
      const { username } = req.params;
      
      const count = await Message.countDocuments({
        receiverUsername: username,
        read: false,
      });
      
      res.status(200).json({ unreadCount: count });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error:', error.message);
      }
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  };

  exports.markMessagesAsRead = async (req, res) => {
    try {
      const { appointmentId, username } = req.body;
      
      const result = await Message.updateMany(
        { appointmentId, receiverUsername: username, read: false },
        { $set: { read: true } }
      );
      
      res.status(200).json({ success: true, modifiedCount: result.modifiedCount });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error marking messages as read:', err);
      }
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  };

  exports.downloadTranscript = async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const { username } = req.user; // Get current user from auth middleware
      
      console.log('📄 Downloading transcript for appointment:', appointmentId, 'by user:', username);
      
      // Get appointment details
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        console.log('❌ Appointment not found:', appointmentId);
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      // Check if user is authorized to access this transcript
      if (appointment.patientUsername !== username && appointment.therapistUsername !== username) {
        console.log('❌ Unauthorized access attempt:', username, 'for appointment:', appointmentId);
        return res.status(403).json({ error: "Not authorized to access this transcript" });
      }
      
      // Get user details for full names
      const User = require('../models/dataModel');
      const patient = await User.findOne({ username: appointment.patientUsername });
      const therapist = await User.findOne({ username: appointment.therapistUsername });
      
      console.log('👥 Found users:', {
        patient: patient?.username,
        therapist: therapist?.username
      });
      
      // Get full names or fallback to usernames
      const patientFullName = patient?.info?.firstName && patient?.info?.lastName 
        ? `${patient.info.firstName} ${patient.info.lastName}`
        : appointment.patientUsername;
      
      const therapistFullName = therapist?.info?.firstName && therapist?.info?.lastName 
        ? `Dr. ${therapist.info.firstName} ${therapist.info.lastName}`
        : `Dr. ${appointment.therapistUsername}`;
      
      console.log('📝 Using names:', { patientFullName, therapistFullName });
      
      // Get all messages for this appointment
      const messages = await Message.find({ appointmentId }).sort({ timestamp: 1 });
      console.log('💬 Found messages:', messages.length);
      
      // Generate transcript
      let transcript = `Chat Transcript\n`;
      transcript += `Appointment ID: ${appointmentId}\n`;
      transcript += `Patient: ${patientFullName}\n`;
      transcript += `Therapist: ${therapistFullName}\n`;
      transcript += `Date: ${appointment.date} at ${appointment.time}\n`;
      transcript += `Generated on: ${new Date().toLocaleString()}\n`;
      transcript += `\n${'='.repeat(50)}\n\n`;
      
      messages.forEach((msg, index) => {
        const decryptedContent = decrypt(msg.content);
        const timestamp = new Date(msg.timestamp).toLocaleString();
        const sender = msg.senderUsername === appointment.patientUsername ? patientFullName : therapistFullName;
        
        transcript += `[${timestamp}] ${sender}: ${decryptedContent}\n`;
      });
      
      console.log('✅ Transcript generated successfully');
      
      res.status(200).json({ 
        transcript,
        patientFullName,
        therapistFullName
      });
    } catch (err) {
      console.error('❌ Error downloading transcript:', err);
      if (process.env.NODE_ENV === 'development') {
        console.error('Error details:', err.message);
        console.error('Stack trace:', err.stack);
      }
      res.status(500).json({ error: "Failed to download transcript" });
    }
  };

// Download attachment
exports.downloadAttachment = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { username } = req.user;

    console.log('📥 Download attachment request:', { messageId, username });

    const message = await Message.findById(messageId);
    if (!message) {
      console.log('❌ Message not found:', messageId);
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is authorized to access this attachment
    if (message.senderUsername !== username && message.receiverUsername !== username) {
      console.log('❌ Unauthorized access:', { username, sender: message.senderUsername, receiver: message.receiverUsername });
      return res.status(403).json({ error: "Not authorized to access this attachment" });
    }

    if (!message.attachment || !message.attachment.path) {
      console.log('❌ No attachment found in message:', messageId);
      return res.status(404).json({ error: "No attachment found" });
    }

    // Try multiple path resolution strategies
    let filePath = null;
    const pathStrategies = [
      // Strategy 1: Direct resolve
      () => path.resolve(message.attachment.path),
      // Strategy 2: Relative to current directory
      () => path.join(__dirname, message.attachment.path),
      // Strategy 3: Relative to uploads/attachments directory
      () => path.join(__dirname, 'uploads', 'attachments', path.basename(message.attachment.path)),
      // Strategy 4: If path is already relative to uploads, try direct
      () => path.join(__dirname, 'uploads', message.attachment.path.replace('uploads/', '')),
      // Strategy 5: If path contains 'attachments', try to reconstruct
      () => {
        const filename = path.basename(message.attachment.path);
        return path.join(__dirname, 'uploads', 'attachments', filename);
      }
    ];

    for (let i = 0; i < pathStrategies.length; i++) {
      const strategy = pathStrategies[i];
      try {
        const testPath = strategy();
        if (fs.existsSync(testPath)) {
          filePath = testPath;
          console.log(`✅ Found file using strategy ${i + 1}:`, filePath);
          break;
        }
      } catch (error) {
        console.log(`❌ Strategy ${i + 1} failed:`, error.message);
      }
    }

    if (!filePath) {
      console.log('❌ File not found with any strategy. Stored path:', message.attachment.path);
      console.log('🔍 Available files in uploads/attachments:');
      try {
        const uploadsDir = path.join(__dirname, 'uploads', 'attachments');
        if (fs.existsSync(uploadsDir)) {
          const files = fs.readdirSync(uploadsDir);
          files.forEach(file => console.log('  -', file));
        }
      } catch (error) {
        console.log('  Error reading uploads directory:', error.message);
      }
      return res.status(404).json({ error: "File not found on server" });
    }

    const fileStats = fs.statSync(filePath);
    console.log('✅ File found:', {
      originalPath: message.attachment.path,
      resolvedPath: filePath,
      fileSize: fileStats.size,
      fileModified: fileStats.mtime,
      attachmentData: message.attachment
    });

    // Set proper headers for binary file download
    const contentType = message.attachment.mimetype || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${message.attachment.originalName}"`);
    
    // For image files, also set cache headers
    if (contentType.startsWith('image/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
    
    // Stream the file instead of using res.download to avoid corruption
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (error) => {
      console.error('❌ File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream file" });
      }
    });
    fileStream.pipe(res);
  } catch (error) {
    console.error('❌ Error downloading attachment:', error);
    res.status(500).json({ error: "Failed to download attachment" });
  }
};

