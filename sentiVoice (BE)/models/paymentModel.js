const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    appointmentId   : { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    patientUsername : { type: String, required: true },
    method          : { 
      type: String, 
      enum: [
        "easypaisa", 
        "jazzcash", 
        "bank_transfer", 
        "credit_card", 
        "paypal", 
        "stripe", 
        "razorpay", 
        "paytm", 
        "phonepe", 
        "gpay", 
        "apple_pay", 
        "other"
      ], 
      required: true 
    },
    referenceNo     : { type: String, required: true },
    amount          : { type: Number, required: true, default: 2500 },   // PKR
    receiptUrl      : { type: String, required: true },                  // path or S3 URL
    bookingInfo : {
        date             : String,
        time             : String,
        therapistUsername: String
    },
    // Voice recording data for later processing
    voiceRecording: {
      audioData: String,  // Base64 encoded audio data
      fileName: String,
      processed: { type: Boolean, default: false },
      emotionResult: String,
      reportSent: { type: Boolean, default: false }
    },
    status : { type: String, enum: ["Pending", "Approved", "Declined", "Refunded"], default: "Pending" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);