const mongoose = require("mongoose");

const paymentSettingsSchema = new mongoose.Schema({
  method: { 
    type: String, 
    required: true, 
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
    unique: true 
  },
  accountName: { 
    type: String, 
    required: true 
  },
  accountNumber: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true, 
    default: 2500 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  instructions: { 
    type: String, 
    default: "" 
  }
}, { timestamps: true });

module.exports = mongoose.model("PaymentSettings", paymentSettingsSchema); 