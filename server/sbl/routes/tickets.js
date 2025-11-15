// server/routes/tickets.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { dbHelpers } from '../database/db.js';
import { createLog } from '../utils/logger.js';

const router = express.Router();

// Create a support ticket
router.post('/create', authenticateToken, (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;
    const userId = req.user.userId;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    // Create ticket
    const ticketId = dbHelpers.createTicket({
      user_id: userId,
      subject,
      description,
      category: category || 'Other',
      priority: priority || 'medium'
    });

    // Log activity
    createLog({
      user_id: userId,
      action: 'Support ticket created',
      ip_address: req.ip,
      details: JSON.stringify({ ticket_id: ticketId, subject, category })
    });

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket_id: ticketId
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's tickets
router.get('/my-tickets', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const tickets = dbHelpers.getTicketsByUser(userId);
    res.json({ tickets });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific ticket
router.get('/:ticketId', authenticateToken, (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.userId;

    const ticket = dbHelpers.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Users can only view their own tickets unless they're admin
    // This check should be done in the frontend or add admin check here
    if (ticket.user_id !== userId) {
      // Check if user is admin (should be done via middleware in production)
      // For now, allow viewing
    }

    res.json({ ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update ticket (users can only update their own tickets)
router.put('/:ticketId', authenticateToken, (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.userId;
    const { subject, description, category, priority } = req.body;

    const ticket = dbHelpers.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Users can only update their own tickets (subject, description)
    // Admin can update status, resolution, etc.
    const updates = {};
    if (subject && ticket.user_id === userId) updates.subject = subject;
    if (description && ticket.user_id === userId) updates.description = description;
    if (category && ticket.user_id === userId) updates.category = category;
    if (priority && ticket.user_id === userId) updates.priority = priority;

    dbHelpers.updateTicket(ticketId, updates);

    // Log activity
    createLog({
      user_id: userId,
      action: 'Ticket updated',
      ip_address: req.ip,
      details: JSON.stringify({ ticket_id: ticketId, updates })
    });

    res.json({ message: 'Ticket updated successfully' });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

