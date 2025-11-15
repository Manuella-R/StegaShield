import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'stegasheild.db');

// Create database directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Read and execute schema (only if tables don't exist)
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  try {
    // Check if users table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `).get();
    
    if (!tableExists) {
      // Only execute schema if tables don't exist
      const schema = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schema);
    }
  } catch (error) {
    // If error, try to execute schema anyway
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
  }
}

export default db;

// Helper functions for database operations
export const dbHelpers = {
  // Users
  getUserByEmail: (email) => {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  getUserById: (id) => {
    return db.prepare('SELECT * FROM users WHERE user_id = ?').get(id);
  },

  createUser: (userData) => {
    const { name, email, phone_number, password_hash, role = 'user', plan_id = 1 } = userData;
    const stmt = db.prepare(`
      INSERT INTO users (name, email, phone_number, password_hash, role, plan_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, email, phone_number, password_hash, role, plan_id);
    return result.lastInsertRowid;
  },

  updateUser: (userId, updates) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(userId);
    const stmt = db.prepare(`UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`);
    return stmt.run(...values);
  },

  // Plans
  getAllPlans: () => {
    return db.prepare('SELECT * FROM plans ORDER BY price').all();
  },

  getPlanById: (id) => {
    return db.prepare('SELECT * FROM plans WHERE plan_id = ?').get(id);
  },

  // Payments
  createPayment: (paymentData) => {
    const { user_id, plan_id, amount, payment_method, transaction_code, status = 'Pending' } = paymentData;
    const stmt = db.prepare(`
      INSERT INTO payments (user_id, plan_id, amount, payment_method, transaction_code, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(user_id, plan_id, amount, payment_method, transaction_code, status);
    return result.lastInsertRowid;
  },

  getPaymentsByUser: (userId) => {
    return db.prepare('SELECT * FROM payments WHERE user_id = ? ORDER BY payment_date DESC').all(userId);
  },

  getAllPayments: () => {
    return db.prepare('SELECT * FROM payments ORDER BY payment_date DESC').all();
  },

  getPaymentByTransactionCode: (transactionCode) => {
    return db.prepare('SELECT * FROM payments WHERE transaction_code = ?').get(transactionCode);
  },

  updatePayment: (paymentId, updates) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(paymentId);
    const stmt = db.prepare(`UPDATE payments SET ${fields} WHERE payment_id = ?`);
    return stmt.run(...values);
  },

  // Uploads
  createUpload: (uploadData) => {
    const { user_id, file_name, file_path, operation_type, watermark_type, metadata } = uploadData;
    const stmt = db.prepare(`
      INSERT INTO uploads (user_id, file_name, file_path, operation_type, watermark_type, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(user_id, file_name, file_path, operation_type, watermark_type, metadata);
    return result.lastInsertRowid;
  },

  getUploadsByUser: (userId, limit = 50) => {
    return db.prepare('SELECT * FROM uploads WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit);
  },

  getAllUploads: (limit = 100) => {
    return db.prepare('SELECT * FROM uploads ORDER BY created_at DESC LIMIT ?').all(limit);
  },

  getUploadById: (id) => {
    return db.prepare('SELECT * FROM uploads WHERE upload_id = ?').get(id);
  },

  updateUpload: (uploadId, updates) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(uploadId);
    const stmt = db.prepare(`UPDATE uploads SET ${fields} WHERE upload_id = ?`);
    return stmt.run(...values);
  },

  // Verification Reports
  createReport: (reportData) => {
    const { upload_id, user_id, authenticity_status, confidence_score, detection_details, report_url } = reportData;
    const stmt = db.prepare(`
      INSERT INTO verification_reports (upload_id, user_id, authenticity_status, confidence_score, detection_details, report_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(upload_id, user_id, authenticity_status, confidence_score, detection_details, report_url);
    return result.lastInsertRowid;
  },

  getReportsByUser: (userId) => {
    return db.prepare(`
      SELECT vr.*, u.upload_id, u.file_name, u.operation_type, u.user_id as upload_user_id
      FROM verification_reports vr
      JOIN uploads u ON vr.upload_id = u.upload_id
      WHERE vr.user_id = ?
      ORDER BY vr.created_at DESC
    `).all(userId);
  },

  getReportById: (id) => {
    return db.prepare(`
      SELECT vr.*, u.file_name, u.operation_type, u.user_id as upload_user_id
      FROM verification_reports vr
      JOIN uploads u ON vr.upload_id = u.upload_id
      WHERE vr.report_id = ?
    `).get(id);
  },

  getAllReports: (limit = 100) => {
    return db.prepare(`
      SELECT vr.*, u.file_name, u.operation_type, usr.name as user_name, usr.email as user_email
      FROM verification_reports vr
      JOIN uploads u ON vr.upload_id = u.upload_id
      JOIN users usr ON vr.user_id = usr.user_id
      ORDER BY vr.created_at DESC
      LIMIT ?
    `).all(limit);
  },

  getFlaggedReports: () => {
    return db.prepare(`
      SELECT vr.*, u.file_name, u.operation_type, usr.name as user_name, usr.email as user_email,
             flagged_by_user.name as flagged_by_name
      FROM verification_reports vr
      JOIN uploads u ON vr.upload_id = u.upload_id
      JOIN users usr ON vr.user_id = usr.user_id
      LEFT JOIN users flagged_by_user ON vr.flagged_by = flagged_by_user.user_id
      WHERE vr.is_flagged = 1
      ORDER BY vr.flagged_at DESC
    `).all();
  },

  flagReport: (reportId, flaggedBy, reason) => {
    return db.prepare(`
      UPDATE verification_reports
      SET is_flagged = 1, flagged_by = ?, flagged_reason = ?, flagged_at = CURRENT_TIMESTAMP
      WHERE report_id = ?
    `).run(flaggedBy, reason, reportId);
  },

  unflagReport: (reportId) => {
    return db.prepare(`
      UPDATE verification_reports
      SET is_flagged = 0, flagged_by = NULL, flagged_reason = NULL, flagged_at = NULL
      WHERE report_id = ?
    `).run(reportId);
  },

  updateReport: (reportId, updates) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(reportId);
    const stmt = db.prepare(`UPDATE verification_reports SET ${fields} WHERE report_id = ?`);
    return stmt.run(...values);
  },

  // Activity Logs
  createLog: (logData) => {
    const { user_id, action, ip_address, details } = logData;
    const stmt = db.prepare(`
      INSERT INTO activity_logs (user_id, action, ip_address, details)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(user_id, action, ip_address, details);
  },

  getLogsByUser: (userId, limit = 100) => {
    return db.prepare('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?').all(userId, limit);
  },

  getAllLogs: (limit = 1000) => {
    return db.prepare('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT ?').all(limit);
  },

  // Analytics
  getUploadStats: (userId, startDate, endDate) => {
    return db.prepare(`
      SELECT 
        COUNT(*) as total_uploads,
        SUM(CASE WHEN operation_type = 'embed' THEN 1 ELSE 0 END) as embed_count,
        SUM(CASE WHEN operation_type = 'verify' THEN 1 ELSE 0 END) as verify_count
      FROM uploads
      WHERE user_id = ? AND created_at BETWEEN ? AND ?
    `).get(userId, startDate, endDate);
  },

  getUserCount: () => {
    return db.prepare('SELECT COUNT(*) as count FROM users').get();
  },

  getTotalUploads: () => {
    return db.prepare('SELECT COUNT(*) as count FROM uploads').get();
  },

  getRevenueStats: (startDate, endDate) => {
    return db.prepare(`
      SELECT 
        SUM(amount) as total_revenue,
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'Successful' THEN amount ELSE 0 END) as successful_revenue
      FROM payments
      WHERE payment_date BETWEEN ? AND ?
    `).get(startDate, endDate);
  },

  // Support Tickets
  createTicket: (ticketData) => {
    const { user_id, subject, description, category, priority } = ticketData;
    const stmt = db.prepare(`
      INSERT INTO support_tickets (user_id, subject, description, category, priority)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(user_id, subject, description, category, priority);
    return result.lastInsertRowid;
  },

  getTicketsByUser: (userId) => {
    return db.prepare(`
      SELECT t.*, u.name as user_name, u.email as user_email
      FROM support_tickets t
      JOIN users u ON t.user_id = u.user_id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `).all(userId);
  },

  getAllTickets: (status = null) => {
    let query = `
      SELECT t.*, u.name as user_name, u.email as user_email,
             a.name as assigned_to_name
      FROM support_tickets t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN users a ON t.assigned_to = a.user_id
    `;
    if (status) {
      query += ' WHERE t.status = ?';
      query += ' ORDER BY t.created_at DESC';
      return db.prepare(query).all(status);
    }
    query += ' ORDER BY t.created_at DESC';
    return db.prepare(query).all();
  },

  getTicketById: (ticketId) => {
    return db.prepare(`
      SELECT t.*, u.name as user_name, u.email as user_email,
             a.name as assigned_to_name
      FROM support_tickets t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN users a ON t.assigned_to = a.user_id
      WHERE t.ticket_id = ?
    `).get(ticketId);
  },

  updateTicket: (ticketId, updates) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(ticketId);
    const stmt = db.prepare(`UPDATE support_tickets SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = ?`);
    return stmt.run(...values);
  },

  deleteTicket: (ticketId) => {
    return db.prepare('DELETE FROM support_tickets WHERE ticket_id = ?').run(ticketId);
  },

  // Enhanced User Management
  searchUsers: (searchTerm) => {
    const term = `%${searchTerm}%`;
    return db.prepare(`
      SELECT u.*, p.plan_name, p.price
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.plan_id
      WHERE u.name LIKE ? OR u.email LIKE ? OR u.user_id = ?
      ORDER BY u.created_at DESC
      LIMIT 50
    `).all(term, term, parseInt(searchTerm) || -1);
  },

  deleteUser: (userId) => {
    // Delete related records first (cascading would be ideal, but SQLite doesn't support it well)
    db.prepare('DELETE FROM activity_logs WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM support_tickets WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM payments WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM verification_reports WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM uploads WHERE user_id = ?').run(userId);
    // Finally delete the user
    return db.prepare('DELETE FROM users WHERE user_id = ?').run(userId);
  },

  getAllUsers: () => {
    return db.prepare(`
      SELECT u.*, p.plan_name, p.price
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.plan_id
      ORDER BY u.created_at DESC
    `).all();
  },

  // Announcements
  createAnnouncement: (announcementData) => {
    const { title, content, status, created_by } = announcementData;
    const stmt = db.prepare(`
      INSERT INTO announcements (title, content, status, created_by)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(title, content, status || 'draft', created_by);
    return result.lastInsertRowid;
  },

  getAllAnnouncements: (status = null) => {
    let query = `
      SELECT a.*, u.name as created_by_name
      FROM announcements a
      JOIN users u ON a.created_by = u.user_id
    `;
    if (status) {
      query += ' WHERE a.status = ?';
      query += ' ORDER BY a.created_at DESC';
      return db.prepare(query).all(status);
    }
    query += ' ORDER BY a.created_at DESC';
    return db.prepare(query).all();
  },

  getPublishedAnnouncements: () => {
    return db.prepare(`
      SELECT a.*, u.name as created_by_name
      FROM announcements a
      JOIN users u ON a.created_by = u.user_id
      WHERE a.status = 'published'
      ORDER BY a.created_at DESC
      LIMIT 50
    `).all();
  },

  getAnnouncementById: (announcementId) => {
    return db.prepare(`
      SELECT a.*, u.name as created_by_name
      FROM announcements a
      JOIN users u ON a.created_by = u.user_id
      WHERE a.announcement_id = ?
    `).get(announcementId);
  },

  updateAnnouncement: (announcementId, updates) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(announcementId);
    const stmt = db.prepare(`UPDATE announcements SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE announcement_id = ?`);
    return stmt.run(...values);
  },

  deleteAnnouncement: (announcementId) => {
    return db.prepare('DELETE FROM announcements WHERE announcement_id = ?').run(announcementId);
  }
};

