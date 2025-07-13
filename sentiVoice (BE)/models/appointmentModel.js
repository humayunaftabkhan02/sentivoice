const mongoose = require('mongoose');
const { Schema } = mongoose;

const appointmentSchema = new Schema({
  patientUsername: { type: String, required: true },
  therapistUsername: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  paymentId : { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  paymentVerified : { type: Boolean, default: false },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now },
  sessionNotes: [
    {
      note: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  initiatorRole: {
    type: String,
    enum: ['patient', 'therapist'],
    required: true,
  }
});

// 🔐 Use this safe pattern to register or reuse the model
module.exports = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);