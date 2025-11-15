import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { dbHelpers } from '../database/db.js';
import { createLog } from '../utils/logger.js';
import db from '../database/db.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// User Management
router.get('/users', (req, res) => {
  try {
    const { search } = req.query;
    
    if (search) {
      // Search users
      const users = dbHelpers.searchUsers(search);
      res.json({ users });
    } else {
      // Get all users
      const users = dbHelpers.getAllUsers();
      res.json({ users });
    }
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/users/:userId', (req, res) => {
  try {
    const user = dbHelpers.getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Remove password hash
    delete user.password_hash;
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/users/:userId', (req, res) => {
  try {
    const { role, plan_id } = req.body;
    const updates = {};

    if (role) updates.role = role;
    if (plan_id) updates.plan_id = plan_id;

    // Prevent deleting yourself
    if (req.params.userId == req.user.userId && role === 'user') {
      return res.status(400).json({ error: 'Cannot remove your own admin role' });
    }

    dbHelpers.updateUser(req.params.userId, updates);

    // Log activity
    createLog({
      user_id: req.user.userId,
      action: 'User updated by admin',
      ip_address: req.ip,
      details: JSON.stringify({ target_user_id: req.params.userId, updates })
    });

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/users/:userId', (req, res) => {
  try {
    const userId = req.params.userId;

    // Prevent deleting yourself
    if (userId == req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = dbHelpers.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user and all related data
    dbHelpers.deleteUser(userId);

    // Log activity
    createLog({
      user_id: req.user.userId,
      action: 'User deleted by admin',
      ip_address: req.ip,
      details: JSON.stringify({ deleted_user_id: userId, deleted_user_email: user.email })
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics
router.get('/analytics', (req, res) => {
  try {
    const userCount = dbHelpers.getUserCount();
    const totalUploads = dbHelpers.getTotalUploads();

    // Get date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const revenueStats = dbHelpers.getRevenueStats(
      startDate.toISOString(),
      endDate.toISOString()
    );

    // Get uploads by type
    const uploadsByType = db.prepare(`
      SELECT operation_type, COUNT(*) as count
      FROM uploads
      GROUP BY operation_type
    `).all();

    // Get verification results
    const verificationResults = db.prepare(`
      SELECT authenticity_status, COUNT(*) as count
      FROM verification_reports
      GROUP BY authenticity_status
    `).all();

    res.json({
      users: userCount.count,
      uploads: totalUploads.count,
      revenue: revenueStats,
      uploads_by_type: uploadsByType,
      verification_results: verificationResults
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Activity Logs
router.get('/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = dbHelpers.getAllLogs(limit);
    res.json({ logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Payments Management
router.get('/payments', (req, res) => {
  try {
    const payments = db.prepare(`
      SELECT p.*, u.name as user_name, u.email, pl.plan_name
      FROM payments p
      JOIN users u ON p.user_id = u.user_id
      JOIN plans pl ON p.plan_id = pl.plan_id
      ORDER BY p.payment_date DESC
      LIMIT 100
    `).all();
    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Plans Management
router.get('/plans', (req, res) => {
  try {
    const plans = dbHelpers.getAllPlans();
    res.json({ plans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/plans', (req, res) => {
  try {
    const { plan_name, price, description, max_uploads_per_week, features } = req.body;

    if (!plan_name || price === undefined) {
      return res.status(400).json({ error: 'Plan name and price are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO plans (plan_name, price, description, max_uploads_per_week, features)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(plan_name, price, description, max_uploads_per_week, features);

    // Log activity
    createLog({
      user_id: req.user.userId,
      action: 'Plan created',
      ip_address: req.ip,
      details: JSON.stringify({ plan_id: result.lastInsertRowid, plan_name })
    });

    res.json({ message: 'Plan created successfully', plan_id: result.lastInsertRowid });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/plans/:planId', (req, res) => {
  try {
    const { plan_name, price, description, max_uploads_per_week, features } = req.body;
    const updates = {};

    if (plan_name) updates.plan_name = plan_name;
    if (price !== undefined) updates.price = price;
    if (description) updates.description = description;
    if (max_uploads_per_week !== undefined) updates.max_uploads_per_week = max_uploads_per_week;
    if (features) updates.features = features;

    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(req.params.planId);

    const stmt = db.prepare(`UPDATE plans SET ${fields} WHERE plan_id = ?`);
    stmt.run(...values);

    // Log activity
    createLog({
      user_id: req.user.userId,
      action: 'Plan updated',
      ip_address: req.ip,
      details: JSON.stringify({ plan_id: req.params.planId, updates })
    });

    res.json({ message: 'Plan updated successfully' });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Flagged Reports Management
router.get('/reports/flagged', (req, res) => {
  try {
    const reports = dbHelpers.getFlaggedReports();
    res.json({ reports });
  } catch (error) {
    console.error('Get flagged reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reports/:reportId/unflag', (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = dbHelpers.getReportById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    dbHelpers.unflagReport(reportId);

    // Log activity
    createLog({
      user_id: req.user.userId,
      action: 'Report unflagged by admin',
      ip_address: req.ip,
      details: JSON.stringify({ report_id: reportId })
    });

    res.json({ message: 'Report unflagged successfully' });
  } catch (error) {
    console.error('Unflag report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Support Tickets Management
router.get('/tickets', (req, res) => {
  try {
    const { status } = req.query;
    const tickets = dbHelpers.getAllTickets(status || null);
    res.json({ tickets });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tickets/:ticketId', (req, res) => {
  try {
    const ticket = dbHelpers.getTicketById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json({ ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/tickets/:ticketId', (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, resolution, assigned_to, priority } = req.body;
    
    const ticket = dbHelpers.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updates = {};
    if (status) {
      updates.status = status;
      if (status === 'resolved' || status === 'closed') {
        updates.resolved_at = new Date().toISOString();
      }
    }
    if (resolution) updates.resolution = resolution;
    if (assigned_to) updates.assigned_to = assigned_to;
    if (priority) updates.priority = priority;

    dbHelpers.updateTicket(ticketId, updates);

    // Log activity
    createLog({
      user_id: req.user.userId,
      action: 'Ticket updated by admin',
      ip_address: req.ip,
      details: JSON.stringify({ ticket_id: ticketId, updates })
    });

    res.json({ message: 'Ticket updated successfully' });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/tickets/:ticketId', (req, res) => {
  try {
    const { ticketId } = req.params;
    
    const ticket = dbHelpers.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    dbHelpers.deleteTicket(ticketId);

    // Log activity
    createLog({
      user_id: req.user.userId,
      action: 'Ticket deleted by admin',
      ip_address: req.ip,
      details: JSON.stringify({ ticket_id: ticketId })
    });

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Announcements Management
router.get('/announcements', (req, res) => {
  try {
    const { status } = req.query;
    const announcements = dbHelpers.getAllAnnouncements(status || null);
    res.json({ announcements });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/announcements', (req, res) => {
  try {
    const { title, content, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const announcementId = dbHelpers.createAnnouncement({
      title,
      content,
      status: status || 'draft',
      created_by: req.user.userId
    });

    // Log activity
    createLog({
      user_id: req.user.userId,
      action: 'Announcement created',
      ip_address: req.ip,
      details: JSON.stringify({ announcement_id: announcementId, title })
    });

    res.status(201).json({ message: 'Announcement created successfully', announcement_id: announcementId });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/announcements/:announcementId', (req, res) => {
  try {
    const { announcementId } = req.params;
    const { title, content, status } = req.body;

    const announcement = dbHelpers.getAnnouncementById(announcementId);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const updates = {};
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (status) updates.status = status;

    dbHelpers.updateAnnouncement(announcementId, updates);

    // Log activity
    createLog({
      user_id: req.user.userId,
      action: 'Announcement updated',
      ip_address: req.ip,
      details: JSON.stringify({ announcement_id: announcementId, updates })
    });

    res.json({ message: 'Announcement updated successfully' });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/announcements/:announcementId', (req, res) => {
  try {
    const { announcementId } = req.params;
    
    const announcement = dbHelpers.getAnnouncementById(announcementId);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    dbHelpers.deleteAnnouncement(announcementId);

    // Log activity
    createLog({
      user_id: req.user.userId,
      action: 'Announcement deleted',
      ip_address: req.ip,
      details: JSON.stringify({ announcement_id: announcementId })
    });

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

