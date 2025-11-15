// server/routes/announcements.js
import express from 'express';
import { dbHelpers } from '../database/db.js';

const router = express.Router();

// Get published announcements (public - no auth required)
router.get('/published', (req, res) => {
  try {
    const announcements = dbHelpers.getPublishedAnnouncements();
    res.json({ announcements });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific announcement (public)
router.get('/:announcementId', (req, res) => {
  try {
    const announcement = dbHelpers.getAnnouncementById(req.params.announcementId);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    // Only return if published
    if (announcement.status !== 'published') {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json({ announcement });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

