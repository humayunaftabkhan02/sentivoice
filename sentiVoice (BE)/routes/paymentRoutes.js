const express           = require("express");
const router            = express.Router();
const uploadPayment     = require("../middleware/uploadPayment");
const paymentController = require("../controllers/paymentController");
const { authenticate }  = require("../middleware/auth");

// Add debugging middleware
router.use((req, res, next) => {
  console.log('🎯 Payment route accessed:', req.method, req.path);
  console.log('📋 Request headers:', Object.keys(req.headers));
  console.log('📄 Content-Type:', req.headers['content-type']);
  next();
});

// patient upload - protected with authentication
router.post("/", authenticate, uploadPayment, paymentController.createPayment);

module.exports = router;