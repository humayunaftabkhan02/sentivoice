const express         = require('express');
const router          = express.Router();
const adminController = require('../controllers/adminController');
const paymentController = require("../controllers/paymentController");
const settingsController = require("../controllers/settingsController");
const { authenticate, authorize } = require('../middleware/auth');

/* Admin routes with authentication and authorization */
router.get('/pending-therapists', authenticate, authorize('admin'), adminController.listPendingTherapists);
router.put('/approve-therapist/:username', authenticate, authorize('admin'), adminController.approveTherapist);
router.get('/stats', authenticate, authorize('admin'), adminController.getStats);
router.get('/user-stats', authenticate, authorize('admin'), adminController.getUserStats);
router.get('/payment-stats', authenticate, authorize('admin'), paymentController.getPaymentStats);
router.get("/pending-payments", authenticate, authorize('admin'), paymentController.listPending);
router.put("/payments/:id/status", authenticate, authorize('admin'), paymentController.updateStatus);
router.get("/payment-history", authenticate, authorize('admin'), paymentController.listHistory);
router.put("/payments/:id/refund", authenticate, authorize('admin'), paymentController.markRefunded);
router.get("/refund-requests", authenticate, authorize('admin'), paymentController.listRefundRequests);

// Settings routes
router.get("/settings", authenticate, authorize('admin'), settingsController.getSettings);
router.put("/settings", authenticate, authorize('admin'), settingsController.updateSettings);
router.get("/settings/:category", authenticate, authorize('admin'), settingsController.getSettingsCategory);
router.post("/settings/reset", authenticate, authorize('admin'), settingsController.resetSettings);
router.get("/settings/export", authenticate, authorize('admin'), settingsController.exportSettings);

// Enhanced user management routes
router.get("/users", authenticate, authorize('admin'), adminController.getAllUsers);
router.get("/users/:username", authenticate, authorize('admin'), adminController.getUserDetails);
router.put("/users/:username/suspend", authenticate, authorize('admin'), adminController.suspendUser);
router.put("/users/:username/activate", authenticate, authorize('admin'), adminController.activateUser);

module.exports = router;