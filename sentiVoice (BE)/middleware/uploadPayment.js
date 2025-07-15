const multer = require("multer");
const path = require("path");

// Store files in /uploads with unique filenames
const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (_req, file, cb) => {
    // Sanitize filename to prevent path traversal
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const finalName = Date.now() + "-" + sanitizedName;
    console.log('📁 UploadPayment: Saving file as:', finalName);
    cb(null, finalName);
  }
});

// Configure multer with security settings for payment uploads
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit (increased for audio files)
    files: 1,
    fieldSize: 10 * 1024 * 1024, // 10MB limit for field values (for base64 audio data)
    fieldNameSize: 100, // 100 bytes for field names
    fields: 10 // Allow up to 10 fields
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 UploadPayment: File filter called');
    console.log('📄 File mimetype:', file.mimetype);
    console.log('📊 File size:', file.size);
    console.log('📝 Original name:', file.originalname);
    console.log('🔧 Field name:', file.fieldname);
    
    // Allow both image files (for receipts) and audio files (for voice recordings)
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      console.log('✅ UploadPayment: File type accepted');
      cb(null, true);
    } else {
      console.log('❌ UploadPayment: File type rejected:', file.mimetype);
      cb(new Error('Only image and audio files are allowed'), false);
    }
  }
}).single('slip'); // Explicitly specify the field name

// Wrap the multer middleware to add error handling
const uploadPayment = (req, res, next) => {
  console.log('🚀 UploadPayment middleware called');
  console.log('📋 Request headers:', Object.keys(req.headers));
  console.log('📄 Content-Type:', req.headers['content-type']);
  
  upload(req, res, (err) => {
    if (err) {
      console.error('❌ UploadPayment error:', err);
      console.error('❌ Error code:', err.code);
      console.error('❌ Error message:', err.message);
      
      if (err instanceof multer.MulterError) {
        console.error('❌ Multer error details:', {
          code: err.code,
          field: err.field,
          message: err.message
        });
        
        // Provide specific error messages for different multer errors
        if (err.code === 'LIMIT_FIELD_VALUE') {
          return res.status(400).json({ 
            error: 'Voice recording data is too large. Please try a shorter recording.' 
          });
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            error: 'File too large. Maximum size is 50MB.' 
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ 
            error: 'Too many files. Only one file allowed.' 
          });
        }
      }
      
      return res.status(400).json({ error: 'File upload error.' });
    }
    
    console.log('✅ UploadPayment successful');
    console.log('📁 Uploaded file:', req.file);
    next();
  });
};

module.exports = uploadPayment; 