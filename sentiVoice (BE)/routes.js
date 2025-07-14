// routes.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const { generatePdfReport } = require('./utils/pdfGenerator');

const mainController = require('./controllers/mainController');
const userController = require('./controllers/userController');
const therapistController = require('./controllers/therapistController');
const appointmentController = require('./controllers/appointmentController');
const notificationController = require('./controllers/notificationController');
const contactController = require('./controllers/contactController');
const messageController = require('./controllers/messageController');
const reportController = require('./controllers/reportController');
const paymentSettingsController = require('./controllers/paymentSettingsController');
const adminController = require('./controllers/adminController'); // Added adminController

// Import middleware
const { authenticate, authorize } = require('./middleware/auth');
const { validate, sanitizeEmail, sanitizeUsername, sanitizePassword, validateRole, sanitizeText, validateObjectId, validateBodyObjectId, body, param } = require('./middleware/validation');
const uploadProfilePicture = require('./middleware/uploadProfilePicture');

const router = express.Router();


// Root route
router.get('/', mainController.home);

// Configure multer for audio uploads with security
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    // Sanitize filename to prevent path traversal
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, Date.now() + '-' + sanitizedName)
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Only allow audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// Emotion prediction route
router.post('/predict', authenticate, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }
    
    // Validate required fields
    const { patientUsername, therapistUsername } = req.body;
    if (!patientUsername || !therapistUsername) {
      return res.status(400).json({ error: 'Patient username and therapist username are required' });
    }
    
    const audioPath = req.file.path;

    try {
      const flaskResponse = await axios.post(
        'https://sentivoice-flask-273777154059.us-central1.run.app/api/predict',
        { file_path: audioPath },
        { headers: { 'Content-Type': 'application/json' } }
      );
      // Clean up - delete the uploaded file after getting response
      try {
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }
      } catch (cleanupError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error cleaning up audio file:', cleanupError.message);
        }
      }

      // Send the parsed data from Flask
      const responseData = flaskResponse.data;

      // Flatten analysis data if needed
      const flatAnalysis = responseData.data ? { ...responseData.data } : { ...responseData };
      // Extract emotion from the correct place
      const emotion = flatAnalysis.emotion || responseData.emotion || '';

      // Get user info from request
      const { patientUsername, therapistUsername, patientName } = req.body;
      const safePatientName = patientName && patientName.trim() ? patientName : patientUsername || 'N/A';

      // Create PDF report data
      const fileName = `Voice_Analysis_${patientUsername}_${Date.now()}.pdf`;
      let pdfData;
      try {
        pdfData = await generatePdfReport(flatAnalysis, safePatientName);
      } catch (pdfError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error generating PDF report:', pdfError.message);
        }
        pdfData = null;
      }

      // Automatically send the report
      if (pdfData) {
        try {
          const report = await reportController.sendVoiceAnalysisReport({
            body: {
              patientUsername,
              therapistUsername,
              patientName,
              emotion,
              analysisData: {
                ...flatAnalysis,
                analysisDate: new Date().toLocaleDateString(),
                analysisTime: new Date().toLocaleTimeString()
              },
              pdfData,
              fileName,
              reportType: 'voice_analysis'
            }
          });
          // Add report info to response
          responseData.reportSent = true;
          responseData.reportId = report?.reportId;
        } catch (reportError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error sending automatic report:', reportError.message);
          }
          responseData.reportSent = false;
        }
      } else {
        responseData.reportSent = false;
        responseData.reportError = 'PDF generation failed';
      }
      return res.json(responseData);
    } catch (flaskError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error from Flask:', flaskError.response?.data || flaskError.message);
      }
      
      // Clean up the uploaded file even if Flask fails
      try {
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }
      } catch (cleanupError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error cleaning up audio file:', cleanupError.message);
        }
      }
      
      // Return a fallback response when Flask is not available
      return res.json({
        status: "success",
        data: {
          emotion: "neutral",
          mfcc1: 0.0000,
          mfcc40: 0.0000,
          chroma: 0.0000,
          melspectrogram: 0.0000,
          contrast: 0.0000,
          tonnetz: 0.0000
        },
        message: "Audio recorded successfully. Flask server not available for emotion analysis.",
        reportSent: false,
        reportError: "Flask server not running"
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error processing audio:', error.message);
    }
    return res.status(500).json({ error: 'Failed to process audio file' });
  }
});

// Public routes (no authentication required)
const uploadAttachment = require('./middleware/uploadAttachment');
router.post('/signup', [
  uploadAttachment.single('cvDocument'),
  sanitizeEmail('email'),
  sanitizeUsername('username'),
  sanitizePassword('password'),
  validateRole('role'),
  validate
], userController.signup);

router.post('/login', [
  sanitizeEmail('email'),
  sanitizePassword('password'),
  validate
], userController.login);

// Session validation route
router.get('/auth/validate-session', authenticate, adminController.validateSession);

router.post('/verify-email', [
  sanitizeEmail('email'),
  sanitizeText('token', 100),
  validate
], userController.verifyEmail);

router.post('/resend-verification', [
  sanitizeEmail('email'),
  validate
], userController.resendVerification);

router.post('/forgot-password', [
  sanitizeEmail('email'),
  validate
], userController.forgotPassword);

router.post('/reset-password', [
  sanitizeEmail('email'),
  sanitizeText('token', 100),
  sanitizePassword('newPassword'),
  validate
], userController.resetPassword);

router.post('/contact', [
  sanitizeEmail('email'),
  sanitizeText('name', 100),
  sanitizeText('message', 1000),
  validate
], contactController.sendContactEmail);

// Protected routes (authentication required)
router.post('/appointments', [
  authenticate,
  sanitizeText('patientName', 100),
  sanitizeText('therapistName', 100),
  sanitizeText('date', 20),
  sanitizeText('time', 20),
  sanitizeText('reason', 500),
  validate
], appointmentController.createAppointment);

router.put('/appointments/:id/accept', [
  authenticate,
  validateObjectId('id'),
  validate
], appointmentController.acceptAppointment);

router.put('/appointments/:id/reject', [
  authenticate,
  validateObjectId('id'),
  sanitizeText('reason', 500),
  validate
], appointmentController.rejectAppointment);

router.put('/appointments/:id/cancel', [
  authenticate,
  validateObjectId('id'),
  sanitizeText('reason', 500),
  validate
], appointmentController.cancelAppointment);

router.put('/appointments/:id/reschedule', [
  authenticate,
  validateObjectId('id'),
  sanitizeText('newDate', 20),
  sanitizeText('newTime', 20),
  sanitizeText('reason', 500),
  validate
], appointmentController.rescheduleAppointment);

router.get('/appointments', authenticate, appointmentController.getAppointmentsByUsername);

// Notifications
router.get('/notifications/:username', authenticate, notificationController.getNotificationsByUsername);

// Therapist-specific routes
router.get('/therapist/:username/profile-complete', authenticate, userController.checkTherapistProfileComplete);
router.get('/therapist/:therapistUsername/patients', authenticate, authorize('therapist', 'admin'), therapistController.getTherapistPatients);
router.put('/therapist/manage-patient/:patientUsername', authenticate, authorize('therapist', 'admin'), therapistController.updatePatientInfo);

router.get('/user-info/:username', authenticate, userController.getUserInfo);
router.put('/update-profile/:username', authenticate, uploadProfilePicture, userController.updateProfile);
router.get('/therapists', authenticate, userController.getAllTherapists);



// Serve profile pictures as base64 to avoid CORS issues
router.get('/uploads/profile-pictures/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = `uploads/profile-pictures/${filename}`;
  
  console.log('🖼️ Profile picture request:', filename);
  console.log('📁 File path:', filePath);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log('❌ File not found:', filePath);
    return res.status(404).json({ error: 'Profile picture not found' });
  }
  
  try {
    // Read the file and convert to base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = getMimeType(filename);
    
    console.log('✅ Serving profile picture as base64:', filePath);
    res.json({
      image: `data:${mimeType};base64,${base64Image}`,
      filename: filename
    });
  } catch (error) {
    console.error('❌ Error reading profile picture:', error);
    res.status(500).json({ error: 'Failed to read profile picture' });
  }
});

// Helper function to get MIME type based on file extension
function getMimeType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

router.get('/appointments/booked', authenticate, appointmentController.getBookedTimes);


router.post("/messages", [
  authenticate,
  sanitizeUsername('senderUsername'),
  sanitizeUsername('receiverUsername'),
  validateBodyObjectId('appointmentId'),
  sanitizeText('message', 1000),
  validate
], messageController.sendMessage);

// Route for sending messages with attachments
router.post("/messages/attachment", [
  authenticate,
  uploadAttachment.single('attachment'),
  (req, res, next) => {
    // Custom validation for FormData
    const { senderUsername, receiverUsername, appointmentId } = req.body;
    
    if (!senderUsername || !receiverUsername || !appointmentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Validate usernames
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(senderUsername) || !usernameRegex.test(receiverUsername)) {
      return res.status(400).json({ error: 'Invalid username format' });
    }
    
    // Validate appointmentId
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(appointmentId)) {
      return res.status(400).json({ error: 'Invalid appointment ID format' });
    }
    
    next();
  }
], messageController.sendMessage);

// Route for downloading attachments
router.get("/messages/:messageId/attachment", [
  authenticate,
  validateObjectId('messageId'),
  validate
], messageController.downloadAttachment);

router.get("/messages/:appointmentId", [
  authenticate,
  validateObjectId('appointmentId'),
  validate
], messageController.getMessages);

router.get("/transcript/:appointmentId", [
  authenticate,
  validateObjectId('appointmentId'),
  validate
], messageController.downloadTranscript);

router.get('/therapist/:therapistUsername/availability', authenticate, appointmentController.getTherapistAvailability);

router.get("/notifications/:username/unread-count", authenticate, notificationController.getUnreadCount);
router.put("/notifications/:username/mark-read", authenticate, notificationController.markAllAsRead);

// Message routes
router.get("/unread-count/:username", authenticate, messageController.getUnreadMessageCount);
router.put("/mark-read", authenticate, messageController.markMessagesAsRead);

router.get('/therapist/:therapistUsername/patient/:patientUsername/appointments', authenticate, authorize('therapist', 'admin'), therapistController.getPatientAppointments);

router.put('/appointments/:appointmentId/session-note', [
  authenticate,
  validateObjectId('appointmentId'),
  sanitizeText('note', 2000),
  validate
], appointmentController.updateSessionNote);

router.delete('/appointments/:appointmentId/session-note/:noteIndex', [
  authenticate,
  validateObjectId('appointmentId'),
  param('noteIndex').isInt({ min: 0 }).withMessage('Invalid note index'),
  validate
], appointmentController.deleteSessionNote);

// Report Management
router.get('/reports/therapist/:therapistUsername', [
  authenticate, 
  authorize('therapist', 'admin'),
  param('therapistUsername').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_-]+$/).withMessage('Invalid therapist username format'),
  validate
], reportController.getTherapistReports);

router.post('/reports/send', [
  authenticate,
  sanitizeText('patientUsername', 50),
  sanitizeText('therapistUsername', 50),
  sanitizeText('patientName', 100),
  sanitizeText('message', 5000),
  validate
], reportController.sendReport);

router.get('/reports/download/:reportId', [
  authenticate,
  validateObjectId('reportId'),
  validate
], reportController.downloadReport);

router.post('/reports/send-audio-analysis', [
  authenticate,
  upload.single('audio'),
  sanitizeText('patientUsername', 50),
  sanitizeText('therapistUsername', 50),
  sanitizeText('patientName', 100),
  validate
], async (req, res) => {
  try {
    const { patientUsername, therapistUsername, patientName } = req.body;
    
    let emotion = 'neutral';
    let analysisData = {
      emotion: 'neutral',
      mfcc1: 0.0000,
      mfcc40: 0.0000,
      chroma: 0.0000,
      melspectrogram: 0.0000,
      contrast: 0.0000,
      tonnetz: 0.0000
    };
    
    // If audio file is provided, process it with Flask
    if (req.file) {
      const audioPath = req.file.path;
      
      try {
        const flaskResponse = await axios.post(
          'https://sentivoice-flask-273777154059.us-central1.run.app/api/predict',
          { file_path: audioPath },
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        // Clean up the uploaded file
        try {
          if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up audio file:', cleanupError.message);
        }
        
        const responseData = flaskResponse.data;
        const flatAnalysis = responseData.data ? { ...responseData.data } : { ...responseData };
        emotion = flatAnalysis.emotion || responseData.emotion || 'neutral';
        analysisData = {
          ...flatAnalysis,
          analysisDate: new Date().toLocaleDateString(),
          analysisTime: new Date().toLocaleTimeString()
        };
        
        console.log('Flask analysis result:', emotion);
        
      } catch (flaskError) {
        console.error('Error from Flask:', flaskError.response?.data || flaskError.message);
        
        // Clean up the uploaded file even if Flask fails
        try {
          if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up audio file:', cleanupError.message);
        }
        
        // Use fallback data
        console.log('Using fallback emotion analysis');
      }
    } else {
      // If no audio file, use provided emotion data
      emotion = req.body.emotion || 'neutral';
      analysisData = req.body.analysisData || {
        emotion: emotion,
        mfcc1: 0.0000,
        mfcc40: 0.0000,
        chroma: 0.0000,
        melspectrogram: 0.0000,
        contrast: 0.0000,
        tonnetz: 0.0000
      };
    }
    
    // Create PDF report
    const fileName = `Voice_Analysis_${patientUsername}_${Date.now()}.pdf`;
    let pdfData;
    try {
      pdfData = await generatePdfReport(analysisData, patientName);
    } catch (pdfError) {
      console.error('Error generating PDF report:', pdfError.message);
      pdfData = null;
    }
    
    // Send the report
    try {
      const report = await reportController.sendVoiceAnalysisReport({
        body: {
          patientUsername,
          therapistUsername,
          patientName,
          emotion,
          analysisData,
          pdfData,
          fileName,
          reportType: 'voice_analysis'
        }
      });
      
      res.json({
        status: "success",
        data: analysisData,
        reportSent: true,
        reportId: report?.reportId,
        message: "Voice analysis completed and report sent"
      });
      
    } catch (reportError) {
      console.error('Error sending report:', reportError.message);
      res.status(500).json({
        status: "error",
        message: "Failed to send report",
        reportSent: false
      });
    }
    
  } catch (error) {
    console.error('Error processing audio analysis:', error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to process audio analysis",
      reportSent: false
    });
  }
});

// Payment Settings Routes
router.get('/payment-settings', paymentSettingsController.getPublicPaymentSettings);
router.get('/admin/payment-settings', authenticate, authorize('admin'), paymentSettingsController.getPaymentSettings);
router.post('/admin/payment-settings', authenticate, authorize('admin'), paymentSettingsController.createPaymentSetting);
router.put('/admin/payment-settings/:id', authenticate, authorize('admin'), paymentSettingsController.updatePaymentSetting);
router.delete('/admin/payment-settings/:id', authenticate, authorize('admin'), paymentSettingsController.deletePaymentSetting);
router.post('/admin/payment-settings/initialize', authenticate, authorize('admin'), paymentSettingsController.initializePaymentSettings);




module.exports = router;
