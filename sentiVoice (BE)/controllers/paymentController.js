const Payment      = require("../models/paymentModel");
const Appointment  = require("../models/appointmentModel");
const User         = require("../models/dataModel");
const Notification = require("../models/notificationModel");
const { generatePdfReport } = require("../utils/pdfGenerator");

// ─── PATIENT SIDE ────────────────────────────────────────────────────────────
// POST  /api/payments
exports.createPayment = async (req, res) => {
  try {
    console.log('🔍 Payment creation started');
    console.log('📁 Request file:', req.file ? 'File present' : 'No file');
    console.log('📋 Request body keys:', Object.keys(req.body));
    console.log('🎤 Voice recording data present:', !!req.body.voiceRecordingData);
    console.log('📄 Voice file name:', req.body.voiceFileName);
    
    // Check if file was uploaded
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ error: "No file uploaded. Please select a payment receipt image." });
    }

    console.log('✅ File uploaded successfully:', req.file.filename);
    console.log('📊 File size:', req.file.size);
    console.log('🎯 File mimetype:', req.file.mimetype);

    const {
      patientUsername,
      method,
      referenceNo,
      date,
      time,
      therapistUsername,
      voiceRecordingData,  // Base64 encoded audio data
      voiceFileName        // Name of the voice file
    } = req.body;

    // Validate required fields
    if (!patientUsername || !method || !referenceNo || !date || !time || !therapistUsername) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: "Missing required fields. Please fill in all payment details." 
      });
    }

    // Validate payment method
    const validMethods = [
      "easypaisa", "jazzcash", "bank_transfer", "credit_card", "paypal", 
      "stripe", "razorpay", "paytm", "phonepe", "gpay", "apple_pay", "other"
    ];
    
    if (!validMethods.includes(method)) {
      console.log('❌ Invalid payment method:', method);
      return res.status(400).json({ 
        error: `Invalid payment method: ${method}. Allowed methods: ${validMethods.join(', ')}` 
      });
    }

    console.log('✅ All validations passed');

    const paymentData = {
      patientUsername,
      method,
      referenceNo,
      receiptUrl: `uploads/${req.file.filename}`,
      bookingInfo: { date, time, therapistUsername },
      sessionType: req.body.sessionType // Store sessionType in Payment
    };

    // Add voice recording data if provided
    if (voiceRecordingData && voiceFileName) {
      console.log('🎤 Adding voice recording data to payment');
      paymentData.voiceRecording = {
        audioData: voiceRecordingData,
        fileName: voiceFileName,
        processed: false,
        reportSent: false
      };
    } else {
      console.log('⚠️ No voice recording data provided');
    }

    console.log('💾 Creating payment in database...');
    const payment = await Payment.create(paymentData);
    console.log('✅ Payment created successfully:', payment._id);

    // Notify patient: payment uploaded, pending admin approval
    await Notification.create({
      recipientUsername: patientUsername,
      message: `Your payment receipt has been uploaded. Your appointment is now pending payment approval from an admin.`,
    });

    console.log('✅ Notification created');
    res.status(201).json({ message: "Payment uploaded; pending admin review", payment });
  } catch (err) {
    console.error('❌ Payment creation error:', err.message);
    console.error('❌ Error stack:', err.stack);
    
    // Check if it's a validation error
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation error", 
        details: Object.values(err.errors).map(e => e.message) 
      });
    }
    
    res.status(500).json({ error: "Failed to create payment" });
  }
};

// ─── ADMIN SIDE ──────────────────────────────────────────────────────────────

// GET /api/admin/payment-stats - Get payment statistics
exports.getPaymentStats = async (_req, res) => {
  try {
    // Get total submissions (all payments)
    const totalSubmissions = await Payment.countDocuments();
    
    // Get processed today (approved or declined payments created today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const processedToday = await Payment.countDocuments({
      status: { $in: ["Approved", "Declined"] },
      updatedAt: { $gte: today, $lt: tomorrow }
    });
    
    // Get pending payments count
    const pendingPayments = await Payment.countDocuments({ status: "Pending" });
    
    res.json({
      totalSubmissions,
      processedToday,
      pendingPayments
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ error: "Failed to fetch payment statistics" });
  }
};

// GET /api/admin/pending-payments
exports.listPending = async (_req, res) => {
  const pending = await Payment.find({ status: "Pending" }).lean();

  for (let p of pending) {
    /* ---------- patient ---------- */
    const pat = await User.findOne({ username: p.patientUsername });
    p.patientFullName =
      pat?.info?.firstName && pat?.info?.lastName
        ? `${pat.info.firstName} ${pat.info.lastName}`
        : p.patientUsername;

    /* ---------- therapist ---------- */
    const therapistUname = p.bookingInfo?.therapistUsername;
    const th = therapistUname
      ? await User.findOne({ username: therapistUname })
      : null;

    p.therapistFullName =
      th?.info?.firstName && th?.info?.lastName
        ? `Dr. ${th.info.firstName} ${th.info.lastName}`
        : `Dr. ${therapistUname || "N/A"}`;

    // Ensure createdAt is present (it should be by default, but make explicit)
    p.requestedAt = p.createdAt;
  }

  res.json(pending);
};

// GET  /api/admin/payment-history   – all Approved or Declined
exports.listHistory = async (_req, res) => {
  const payments = await Payment.find({
    status: { $in: ["Pending", "Approved", "Declined", "Refund Pending", "Refunded"] }
  })
  .sort({ updatedAt: -1 })
  .lean();

  // attach patient & therapist full names and booking status
  for (let p of payments) {
    const patient = await User.findOne({ username: p.patientUsername });
    p.patientFullName =
      patient?.info?.firstName && patient?.info?.lastName
        ? `${patient.info.firstName} ${patient.info.lastName}`
        : p.patientUsername;

    const tUname = p.bookingInfo?.therapistUsername;
    const th     = tUname ? await User.findOne({ username: tUname }) : null;
    p.therapistFullName =
      th?.info?.firstName && th?.info?.lastName
        ? `Dr. ${th.info.firstName} ${th.info.lastName}`
        : `Dr. ${tUname || "N/A"}`;

    // Ensure createdAt is present (it should be by default, but make explicit)
    p.requestedAt = p.createdAt;

    // Add booking status if appointment exists
    if (p.appointmentId) {
      const appt = await Appointment.findById(p.appointmentId);
      p.bookingStatus = appt ? appt.status : 'N/A';
    } else {
      p.bookingStatus = 'N/A';
    }
  }

  res.json(payments);
};

// GET /api/admin/refund-requests - List all payments with status 'Refund Pending'
exports.listRefundRequests = async (_req, res) => {
  const refunds = await Payment.find({ status: 'Refund Pending' }).sort({ updatedAt: -1 }).lean();

  for (let p of refunds) {
    const patient = await User.findOne({ username: p.patientUsername });
    p.patientFullName =
      patient?.info?.firstName && patient?.info?.lastName
        ? `${patient.info.firstName} ${patient.info.lastName}`
        : p.patientUsername;

    const tUname = p.bookingInfo?.therapistUsername;
    const th     = tUname ? await User.findOne({ username: tUname }) : null;
    p.therapistFullName =
      th?.info?.firstName && th?.info?.lastName
        ? `Dr. ${th.info.firstName} ${th.info.lastName}`
        : `Dr. ${tUname || "N/A"}`;
  }

  res.json(refunds);
};

// GET /api/admin/refund-requests-count - Get count of refund requests
exports.getRefundRequestsCount = async (_req, res) => {
  try {
    const count = await Payment.countDocuments({ status: 'Refund Pending' });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching refund requests count:', error);
    res.status(500).json({ error: 'Failed to fetch refund requests count' });
  }
};

// PUT /api/admin/payments/:id/refund   – mark a Declined payment as Refunded
exports.markRefunded = async (req, res) => {
  const { id } = req.params;

  const payment = await Payment.findById(id);
  if (!payment) return res.status(404).json({ error: "Payment not found" });

  if (payment.status !== "Declined" && payment.status !== "Refund Pending")
    return res.status(400).json({ error: "Only declined or refund pending payments can be refunded" });

  payment.status = "Refunded";
  await payment.save();

  res.json({ message: "Payment marked as refunded", payment });
};

// PUT  /api/admin/payments/:id/status    { status: "Approved" | "Declined" }
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!["Approved", "Declined"].includes(status))
    return res.status(400).json({ error: "Invalid status" });

  const payment = await Payment.findById(id);
  if (!payment) return res.status(404).json({ error: "Payment not found" });

  payment.status = status;
  await payment.save();

  // Update appointment if exists
  if (payment.appointmentId) {
    const appt = await Appointment.findById(payment.appointmentId);
    appt.paymentVerified = status === "Approved";
    appt.save();
  }

  // Create appointment if not already created
  if (status === "Approved") {
    const { date, time, therapistUsername } = payment.bookingInfo;

    const duplicate = await Appointment.findOne({
      patientUsername: payment.patientUsername,
      therapistUsername,
      status: { $in: ["Pending", "Accepted"] }
    });

    if (!duplicate) {
      const newAppt = await Appointment.create({
        patientUsername: payment.patientUsername,
        therapistUsername,
        date,
        time,
        status: "Pending",
        initiatorRole: "patient",
        paymentId: payment._id,
        paymentVerified: true,
        sessionType: payment.sessionType // Pass sessionType to Appointment
      });

      // Notify patient & therapist of appointment creation
      await Notification.create({
        recipientUsername: payment.patientUsername,
        message: `Appointment created: ${date} at ${time} (pending therapist approval)`,
        appointmentId: newAppt._id,
      });

      await Notification.create({
        recipientUsername: therapistUsername,
        message: `New appointment request from patient. (${date} at ${time})`,
        appointmentId: newAppt._id,
      });

      payment.appointmentId = newAppt._id;
      await payment.save();

      // Process voice recording and send report to therapist if available
      if (payment.voiceRecording && payment.voiceRecording.audioData && !payment.voiceRecording.processed) {
        console.log('🎤 Processing voice recording in payment controller');
        console.log('📁 Voice recording present:', !!payment.voiceRecording.audioData);
        console.log('🔍 Already processed:', payment.voiceRecording.processed);
        
        try {
          // Import required modules for voice processing
          const axios = require('axios');

          // Process voice analysis
          let flaskResponse;
          try {
            console.log('🚀 Calling Flask app with base64 audio data');
            flaskResponse = await axios.post(
              'https://sentivoice-flask-273777154059.us-central1.run.app/api/predict',
              { audio_data: payment.voiceRecording.audioData },
              { headers: { 'Content-Type': 'application/json' } }
            );
            console.log('✅ Flask response received:', flaskResponse.data);
          } catch (flaskError) {
            console.error('❌ Flask error:', flaskError.response?.data || flaskError.message);
            // Fallback: create a default response
            flaskResponse = {
              data: {
                data: {
                  emotion: 'neutral',
                  mfcc1: 0.0000,
                  mfcc40: 0.0000,
                  chroma: 0.0000,
                  melspectrogram: 0.0000,
                  contrast: 0.0000,
                  tonnetz: 0.0000
                }
              }
            };
          }



          // Get analysis results
          const responseData = flaskResponse.data;
          const emotion = responseData.data?.emotion || responseData.emotion || 'neutral';

          // Update payment with emotion result
          payment.voiceRecording.processed = true;
          payment.voiceRecording.emotionResult = emotion;
          await payment.save();

          // Send report to therapist
          const patient = await User.findOne({ username: payment.patientUsername });
          const patientName = patient?.info?.firstName && patient?.info?.lastName
            ? `${patient.info.firstName} ${patient.info.lastName}`
            : payment.patientUsername;

          // Create and send PDF report using the existing endpoint
          const reportData = {
            patientUsername: payment.patientUsername,
            therapistUsername: therapistUsername,
            patientName: patientName,
            emotion: emotion,
            analysisData: responseData.data || responseData,
            fileName: `${patientName}_Voice_Analysis_${new Date().toISOString().split('T')[0]}.pdf`,
            reportType: 'voice_analysis'
          };

          // Send report to therapist using the existing endpoint
          try {
            // Generate PDF report
            let pdfData;
            try {
              pdfData = await generatePdfReport(responseData.data || responseData, patientName);
            } catch (pdfError) {
              // Create a simple fallback PDF
              const PDFDocument = require('pdfkit');
              const doc = new PDFDocument();
              const buffers = [];
              
              doc.on('data', chunk => buffers.push(chunk));
              doc.on('end', () => {
                pdfData = Buffer.concat(buffers).toString('base64');
              });
              
              doc.fontSize(16).text('Voice Analysis Report', { align: 'center' });
              doc.moveDown();
              doc.fontSize(12).text(`Patient: ${patientName}`);
              doc.text(`Emotion: ${emotion}`);
              doc.text(`Date: ${new Date().toLocaleDateString()}`);
              doc.text(`Time: ${new Date().toLocaleTimeString()}`);
              doc.end();
            }
            
            const reportController = require('./reportController');
            await reportController.sendVoiceAnalysisReport({
              body: {
                ...reportData,
                pdfData: pdfData
              }
            });

            // Update payment to mark report as sent
            payment.voiceRecording.reportSent = true;
            await payment.save();

          } catch (reportError) {
            console.error('Error sending voice analysis report:', reportError.message);
          }

        } catch (voiceError) {
          console.error('Error processing voice recording:', voiceError.message);
          // Continue with appointment creation even if voice analysis fails
        }
      }
    }
  }

  // After payment status update (approval/decline/refund), notify patient
  if (status === "Approved") {
    await Notification.create({
      recipientUsername: payment.patientUsername,
      message: `Your payment was approved. Appointment booked for ${payment.bookingInfo.date} at ${payment.bookingInfo.time}.`,
      paymentId: payment._id,
    });
  } else if (status === "Declined") {
    await Notification.create({
      recipientUsername: payment.patientUsername,
      message: `Your payment was declined. Please review and resubmit your payment details.`,
      paymentId: payment._id,
    });
  } else if (status === "Refunded") {
    await Notification.create({
      recipientUsername: payment.patientUsername,
      message: `Your payment has been refunded. Please check your account.`,
      paymentId: payment._id,
    });
  }

  res.json({ message: `Payment ${status.toLowerCase()}`, payment });
};