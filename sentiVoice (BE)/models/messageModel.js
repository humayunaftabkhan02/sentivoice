const mongoose = require('mongoose');

// models/messageModel.js
const messageSchema = new mongoose.Schema({
    senderUsername: String,
    receiverUsername: String,
    content: String,
    timestamp: { type: Date, default: Date.now },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    read: { type: Boolean, default: false },
    // Attachment fields
    attachment: {
      filename: String,
      originalName: String,
      mimetype: String,
      size: Number,
      path: String
    },
    messageType: { 
      type: String, 
      enum: ['text', 'file', 'emoji'], 
      default: 'text' 
    }
  });  

module.exports = mongoose.model("Message", messageSchema);