// models/notificationModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Each Notification references:
 * - recipientUsername: who should see this notification
 * - message: the text to display
 * - appointmentId: (optional) reference to the Appointment (by _id)
 * - read: whether the user has clicked/seen this notification
 */
const notificationSchema = new Schema({
  recipientUsername: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
