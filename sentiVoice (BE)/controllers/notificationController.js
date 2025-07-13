// controllers/notificationController.js
const Notification = require('../models/notificationModel');

/**
 * GET /api/notifications/:username
 * Returns all notifications for the given username, sorted by most recent.
 */
exports.getNotificationsByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const notifications = await Notification.find({
      recipientUsername: username,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ notifications });
      } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching notifications:', error.message);
      }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const { username } = req.params;

    await Notification.updateMany(
      { recipientUsername: username, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({ message: "Marked all as read" });
      } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error marking notifications as read:", error.message);
      }
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Get unread count for user
exports.getUnreadCount = async (req, res) => {
  try {
    const { username } = req.params;
    const count = await Notification.countDocuments({
      recipientUsername: username,
      read: false, // 🛑 make sure this condition is there
    });
    res.status(200).json({ unreadCount: count });
      } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching unread count:", error.message);
      }
    res.status(500).json({ error: "Internal server error" });
  }
};