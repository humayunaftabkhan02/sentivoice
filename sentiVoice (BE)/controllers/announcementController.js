const Announcement = require('../models/announcementModel');

// GET /api/announcement - Get active announcement for public
exports.getActiveAnnouncement = async (req, res) => {
  try {
    const now = new Date();
    const announcement = await Announcement.findOne({
      isActive: true,
      $or: [
        { endDate: null },
        { endDate: { $gt: now } }
      ]
    }).sort({ createdAt: -1 });

    if (announcement) {
      res.json({
        enabled: true,
        message: announcement.message,
        type: announcement.type,
        id: announcement._id
      });
    } else {
      res.json({
        enabled: false,
        message: '',
        type: 'info'
      });
    }
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
};

// GET /api/admin/announcements - Get all announcements (admin only)
exports.getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

// POST /api/admin/announcements - Create new announcement (admin only)
exports.createAnnouncement = async (req, res) => {
  try {
    const { message, type, startDate, endDate } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Deactivate all existing announcements
    await Announcement.updateMany({}, { isActive: false });

    const announcement = new Announcement({
      message: message.trim(),
      type: type || 'info',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      createdBy: req.user.username,
      isActive: true
    });

    await announcement.save();
    res.status(201).json({
      message: 'Announcement created successfully',
      announcement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

// PUT /api/admin/announcements/:id - Update announcement (admin only)
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, type, startDate, endDate, isActive } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (message !== undefined) {
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required' });
      }
      announcement.message = message.trim();
    }

    if (type !== undefined) {
      announcement.type = type;
    }

    if (startDate !== undefined) {
      announcement.startDate = new Date(startDate);
    }

    if (endDate !== undefined) {
      announcement.endDate = endDate ? new Date(endDate) : null;
    }

    if (isActive !== undefined) {
      announcement.isActive = isActive;
    }

    await announcement.save();
    res.json({
      message: 'Announcement updated successfully',
      announcement
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
};

// DELETE /api/admin/announcements/:id - Delete announcement (admin only)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByIdAndDelete(id);
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};

// PUT /api/admin/announcements/:id/toggle - Toggle announcement active status (admin only)
exports.toggleAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    announcement.isActive = !announcement.isActive;
    await announcement.save();

    res.json({
      message: `Announcement ${announcement.isActive ? 'activated' : 'deactivated'} successfully`,
      announcement
    });
  } catch (error) {
    console.error('Error toggling announcement:', error);
    res.status(500).json({ error: 'Failed to toggle announcement' });
  }
}; 