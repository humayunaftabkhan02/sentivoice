const multer = require("multer");
const path = require("path");

// Store files in /uploads/attachments with unique filenames
const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads", "attachments"),
  filename: (_req, file, cb) => {
    // Sanitize filename to prevent path traversal
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, Date.now() + "-" + sanitizedName);
  }
});

// Configure multer with security settings for message attachments
const uploadAttachment = multer({ 
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for attachments
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types for messaging
    const allowedMimeTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      // Documents
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      // Audio/Video (for therapy context)
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
      'video/mp4', 'video/webm', 'video/ogg',
      // Archives
      'application/zip', 'application/x-rar-compressed'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Please upload a supported file type.`), false);
    }
  }
});

module.exports = uploadAttachment; 