import jwt from 'jsonwebtoken';
import { dbHelpers } from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = dbHelpers.getUserById(req.user.userId);
  if (!user || !['admin', 'developer', 'moderator'].includes(user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  req.user.role = user.role;
  next();
};

export const generateToken = (userId, email, role) => {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '7d' });
};






