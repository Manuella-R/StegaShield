import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { dbHelpers } from '../database/db.js';
import { createLog } from '../utils/logger.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Embed watermark
router.post('/embed', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const { watermark_type = 'basic', metadata } = req.body;
    const userId = req.user.userId;

    // Check user's plan and upload limit
    const user = dbHelpers.getUserById(userId);
    const plan = dbHelpers.getPlanById(user.plan_id);

    // Check weekly upload limit
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentUploads = dbHelpers.getUploadsByUser(userId).filter(
      upload => new Date(upload.created_at) > weekAgo
    );

    if (plan.max_uploads_per_week > 0 && recentUploads.length >= plan.max_uploads_per_week) {
      return res.status(403).json({ error: 'Upload limit reached for your plan' });
    }

    // Create upload record
    const uploadId = dbHelpers.createUpload({
      user_id: userId,
      file_name: req.file.originalname,
      file_path: req.file.path,
      operation_type: 'embed',
      watermark_type,
      metadata: metadata || null
    });

    // TODO: Process watermark embedding (call your watermarking service)
    // For now, simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update upload status
    dbHelpers.updateUpload(uploadId, { status: 'completed' });

    // Log activity
    createLog({
      user_id: userId,
      action: 'Watermark embedded',
      ip_address: req.ip,
      details: JSON.stringify({ upload_id: uploadId, file_name: req.file.originalname })
    });

    // Return watermarked file (in production, this would be the processed file)
    res.json({
      message: 'Watermark embedded successfully',
      upload_id: uploadId,
      file_url: `/uploads/${path.basename(req.file.path)}`,
      file_name: req.file.originalname
    });
  } catch (error) {
    console.error('Embed watermark error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify watermark
router.post('/verify', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const userId = req.user.userId;

    // Create upload record
    const uploadId = dbHelpers.createUpload({
      user_id: userId,
      file_name: req.file.originalname,
      file_path: req.file.path,
      operation_type: 'verify',
      watermark_type: null,
      metadata: null
    });

    // TODO: Process verification (call your verification service)
    // For now, simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate verification result
    const authenticity_status = Math.random() > 0.3 ? 'Authentic' : 
                                Math.random() > 0.5 ? 'Tampered' : 'Deepfake Suspected';
    const confidence_score = Math.random() * 0.3 + 0.7; // 0.7 to 1.0

    // Create verification report
    const reportId = dbHelpers.createReport({
      upload_id: uploadId,
      user_id: userId,
      authenticity_status,
      confidence_score,
      detection_details: JSON.stringify({
        watermark_detected: Math.random() > 0.2,
        deepfake_probability: Math.random() * 0.3,
        tampering_detected: authenticity_status === 'Tampered'
      }),
      report_url: null
    });

    // Update upload status
    dbHelpers.updateUpload(uploadId, { status: 'completed' });

    // Log activity
    createLog({
      user_id: userId,
      action: 'Watermark verified',
      ip_address: req.ip,
      details: JSON.stringify({ upload_id: uploadId, report_id: reportId })
    });

    res.json({
      message: 'Verification completed',
      upload_id: uploadId,
      report_id: reportId,
      authenticity_status,
      confidence_score: Math.round(confidence_score * 100),
      success: authenticity_status === 'Authentic'
    });
  } catch (error) {
    console.error('Verify watermark error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get uploads
router.get('/uploads', authenticateToken, (req, res) => {
  try {
    const uploads = dbHelpers.getUploadsByUser(req.user.userId);
    res.json({ uploads });
  } catch (error) {
    console.error('Get uploads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get verification reports
router.get('/reports', authenticateToken, (req, res) => {
  try {
    const reports = dbHelpers.getReportsByUser(req.user.userId);
    res.json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific report
router.get('/reports/:reportId', authenticateToken, (req, res) => {
  try {
    const report = dbHelpers.getReportById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Verify ownership
    const upload = dbHelpers.getUploadById(report.upload_id);
    if (upload.user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ report });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;






