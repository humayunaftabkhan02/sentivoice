const multer = require("multer");
const path   = require("path");

// store files in /uploads with unique filenames
const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (_req, file, cb) => {
    // Sanitize filename to prevent path traversal
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, Date.now() + "-" + sanitizedName);
  }
});

// Configure multer with security settings
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

module.exports = upload;