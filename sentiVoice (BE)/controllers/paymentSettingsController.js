const PaymentSettings = require("../models/paymentSettingsModel");

// GET /api/admin/payment-settings - Get all payment settings
exports.getPaymentSettings = async (_req, res) => {
  try {
    const settings = await PaymentSettings.find().sort({ method: 1 });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    res.status(500).json({ error: "Failed to fetch payment settings" });
  }
};

// GET /api/payment-settings - Get active payment settings (public endpoint)
exports.getPublicPaymentSettings = async (_req, res) => {
  try {
    const settings = await PaymentSettings.find({ isActive: true }).sort({ method: 1 });
    
    // Format for frontend consumption
    const formattedSettings = {};
    settings.forEach(setting => {
      formattedSettings[setting.method] = {
        name: setting.accountName,
        number: setting.accountNumber,
        amount: `${setting.amount.toLocaleString()} PKR`,
        instructions: setting.instructions
      };
    });
    
    res.json(formattedSettings);
  } catch (error) {
    console.error('Error fetching public payment settings:', error);
    res.status(500).json({ error: "Failed to fetch payment settings" });
  }
};

// POST /api/admin/payment-settings - Create new payment setting
exports.createPaymentSetting = async (req, res) => {
  try {
    const { method, accountName, accountNumber, amount, instructions } = req.body;

    // Validate required fields
    if (!method || !accountName || !accountNumber || !amount) {
      return res.status(400).json({ 
        error: "Missing required fields. Please provide method, accountName, accountNumber, and amount." 
      });
    }

    // Check if method already exists
    const existing = await PaymentSettings.findOne({ method });
    if (existing) {
      return res.status(409).json({ 
        error: `Payment setting for ${method} already exists. Use PUT to update.` 
      });
    }

    const setting = await PaymentSettings.create({
      method,
      accountName,
      accountNumber,
      amount: parseFloat(amount),
      instructions: instructions || ""
    });

    res.status(201).json({ 
      message: "Payment setting created successfully", 
      setting 
    });
  } catch (error) {
    console.error('Error creating payment setting:', error);
    res.status(500).json({ error: "Failed to create payment setting" });
  }
};

// PUT /api/admin/payment-settings/:id - Update payment setting
exports.updatePaymentSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountName, accountNumber, amount, isActive, instructions } = req.body;

    const setting = await PaymentSettings.findById(id);
    if (!setting) {
      return res.status(404).json({ error: "Payment setting not found" });
    }

    // Update fields
    if (accountName !== undefined) setting.accountName = accountName;
    if (accountNumber !== undefined) setting.accountNumber = accountNumber;
    if (amount !== undefined) setting.amount = parseFloat(amount);
    if (isActive !== undefined) setting.isActive = isActive;
    if (instructions !== undefined) setting.instructions = instructions;

    await setting.save();

    res.json({ 
      message: "Payment setting updated successfully", 
      setting 
    });
  } catch (error) {
    console.error('Error updating payment setting:', error);
    res.status(500).json({ error: "Failed to update payment setting" });
  }
};

// DELETE /api/admin/payment-settings/:id - Delete payment setting
exports.deletePaymentSetting = async (req, res) => {
  try {
    const { id } = req.params;

    const setting = await PaymentSettings.findById(id);
    if (!setting) {
      return res.status(404).json({ error: "Payment setting not found" });
    }

    await PaymentSettings.findByIdAndDelete(id);

    res.json({ 
      message: "Payment setting deleted successfully" 
    });
  } catch (error) {
    console.error('Error deleting payment setting:', error);
    res.status(500).json({ error: "Failed to delete payment setting" });
  }
};

// POST /api/admin/payment-settings/initialize - Initialize default payment settings
exports.initializePaymentSettings = async (_req, res) => {
  try {
    // Check if settings already exist
    const existingSettings = await PaymentSettings.find();
    if (existingSettings.length > 0) {
      return res.status(409).json({ 
        error: "Payment settings already exist. Use individual endpoints to manage." 
      });
    }

    // Create default settings
    const defaultSettings = [
      {
        method: "easypaisa",
        accountName: "SentiVoice Easypaisa",
        accountNumber: "0345-0000000",
        amount: 2500,
        instructions: "Send payment to the above Easypaisa number and upload the screenshot."
      },
      {
        method: "jazzcash",
        accountName: "SentiVoice JazzCash",
        accountNumber: "0300-1111111",
        amount: 2500,
        instructions: "Send payment to the above JazzCash number and upload the screenshot."
      },
      {
        method: "bank_transfer",
        accountName: "SentiVoice Bank Account",
        accountNumber: "1234-5678-9012-3456",
        amount: 2500,
        instructions: "Transfer the amount to the provided bank account and upload the receipt."
      },
      {
        method: "paypal",
        accountName: "SentiVoice PayPal",
        accountNumber: "payments@sentivoice.com",
        amount: 2500,
        instructions: "Send payment via PayPal to the provided email address."
      }
    ];

    const createdSettings = await PaymentSettings.insertMany(defaultSettings);

    res.status(201).json({ 
      message: "Default payment settings initialized successfully", 
      settings: createdSettings 
    });
  } catch (error) {
    console.error('Error initializing payment settings:', error);
    res.status(500).json({ error: "Failed to initialize payment settings" });
  }
}; 