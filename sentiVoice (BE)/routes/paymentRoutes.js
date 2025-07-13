const express           = require("express");
const router            = express.Router();
const uploadReceipt     = require("../middleware/uploadReceipt");
const paymentController = require("../controllers/paymentController");
const { authenticate }  = require("../middleware/auth");

// patient upload - protected with authentication
router.post("/", authenticate, uploadReceipt.single("slip"), paymentController.createPayment);

module.exports = router;