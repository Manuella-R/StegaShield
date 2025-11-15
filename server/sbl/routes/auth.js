import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { dbHelpers } from '../database/db.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { createLog } from '../utils/logger.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone_number } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = dbHelpers.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const userId = dbHelpers.createUser({
      name,
      email,
      phone_number,
      password_hash,
      role: 'user',
      plan_id: 1 // Free plan
    });

    // Log activity
    createLog({
      user_id: userId,
      action: 'User registered',
      ip_address: req.ip,
      details: JSON.stringify({ email })
    });

    // Generate token
    const token = generateToken(userId, email, 'user');

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        user_id: userId,
        name,
        email,
        role: 'user',
        plan_id: 1
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user
    const user = dbHelpers.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if 2FA is enabled (SQLite stores as INTEGER: 0 or 1)
    // Debug logging
    console.log('Login - User 2FA Status:', {
      two_factor_enabled: user.two_factor_enabled,
      two_factor_enabled_type: typeof user.two_factor_enabled,
      has_secret: !!user.two_factor_secret,
      two_factor_secret_length: user.two_factor_secret ? user.two_factor_secret.length : 0
    });
    
    if ((user.two_factor_enabled === 1 || user.two_factor_enabled === true) && user.two_factor_secret) {
      // Require 2FA verification code
      console.log('2FA is enabled - requiring verification');
      return res.json({
        message: '2FA verification required',
        requires2FA: true,
        user_id: user.user_id,
        email: user.email
      });
    }
    
    console.log('2FA not enabled or no secret - proceeding with normal login');

    // Generate token
    const token = generateToken(user.user_id, user.email, user.role);

    // Log activity
    createLog({
      user_id: user.user_id,
      action: 'User logged in',
      ip_address: req.ip,
      details: JSON.stringify({ email })
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan_id: user.plan_id,
        profile_picture: user.profile_picture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = dbHelpers.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan_id: user.plan_id,
        profile_picture: user.profile_picture,
        phone_number: user.phone_number,
        two_factor_enabled: user.two_factor_enabled === 1 || user.two_factor_enabled === true ? 1 : 0,
        has_password: !!user.password_hash // Indicate if user has a password (OAuth users don't)
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone_number, profile_picture } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (phone_number) updates.phone_number = phone_number;
    if (profile_picture) updates.profile_picture = profile_picture;

    dbHelpers.updateUser(req.user.userId, updates);

    // Log activity
    createLog({
      user_id: req.user.userId,
      action: 'Profile updated',
      ip_address: req.ip,
      details: JSON.stringify(updates)
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    const user = dbHelpers.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 10);
    dbHelpers.updateUser(req.user.userId, { password_hash });

    // Log activity
    createLog({
      user_id: req.user.userId,
      action: 'Password changed',
      ip_address: req.ip
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot password (simplified - in production, send email with reset link)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = dbHelpers.getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // TODO: Send email with reset token
    // For now, just log it
    createLog({
      user_id: user.user_id,
      action: 'Password reset requested',
      ip_address: req.ip
    });

    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify 2FA code after login
router.post('/verify-2fa', async (req, res) => {
  try {
    const { user_id, code } = req.body;

    if (!user_id || !code) {
      return res.status(400).json({ error: 'User ID and code are required' });
    }

    // Get user
    const user = dbHelpers.getUserById(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if 2FA is enabled
    if (!user.two_factor_enabled || !user.two_factor_secret) {
      return res.status(400).json({ error: '2FA is not enabled for this user' });
    }

    // Verify TOTP code
    const isValid = authenticator.verify({
      token: code,
      secret: user.two_factor_secret
    });

    if (!isValid) {
      // Log failed attempt
      createLog({
        user_id: user.user_id,
        action: '2FA verification failed',
        ip_address: req.ip,
        details: JSON.stringify({ code_attempted: code })
      });

      return res.status(401).json({ error: 'Invalid 2FA code' });
    }

    // Log successful verification
    createLog({
      user_id: user.user_id,
      action: '2FA verification successful',
      ip_address: req.ip,
      details: JSON.stringify({})
    });

    // Generate token
    const token = generateToken(user.user_id, user.email, user.role);

    res.json({
      message: '2FA verification successful',
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan_id: user.plan_id,
        profile_picture: user.profile_picture
      }
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Setup 2FA (generate secret and QR code)
router.post('/2fa/setup', authenticateToken, async (req, res) => {
  try {
    const user = dbHelpers.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate secret
    const secret = authenticator.generateSecret();
    const serviceName = 'StegaShield';
    const accountName = user.email;

    // Generate QR code URL (otpauth URI)
    const otpauth = authenticator.keyuri(accountName, serviceName, secret);

    // Save secret to database (but don't enable yet - user needs to verify first)
    dbHelpers.updateUser(req.user.userId, { two_factor_secret: secret });

    // Log activity
    createLog({
      user_id: req.user.userId,
      action: '2FA secret generated',
      ip_address: req.ip,
      details: JSON.stringify({})
    });

    res.json({
      secret,
      qrCode: otpauth,
      manualEntryKey: secret
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enable 2FA (verify code and enable)
router.post('/2fa/enable', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const user = dbHelpers.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.two_factor_secret) {
      return res.status(400).json({ error: 'Please generate a 2FA secret first' });
    }

    // Verify the code
    const isValid = authenticator.verify({
      token: code,
      secret: user.two_factor_secret
    });

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    // Enable 2FA
    dbHelpers.updateUser(req.user.userId, { two_factor_enabled: 1 });
    
    // Verify the update worked
    const updatedUser = dbHelpers.getUserById(req.user.userId);
    console.log('2FA Enabled - Updated user status:', {
      user_id: req.user.userId,
      two_factor_enabled: updatedUser.two_factor_enabled,
      two_factor_enabled_type: typeof updatedUser.two_factor_enabled,
      has_secret: !!updatedUser.two_factor_secret
    });

    // Log activity
    createLog({
      user_id: req.user.userId,
      action: '2FA enabled',
      ip_address: req.ip,
      details: JSON.stringify({})
    });

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Disable 2FA
router.post('/2fa/disable', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    const user = dbHelpers.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // OAuth users (Google/GitHub) don't have passwords - skip password verification
    // For regular users, require password verification
    if (user.password_hash) {
      if (!password) {
        return res.status(400).json({ error: 'Password is required to disable 2FA' });
      }

      // Verify password - make sure password_hash is a string
      if (typeof user.password_hash !== 'string') {
        console.error('Invalid password_hash type:', typeof user.password_hash, user.password_hash);
        return res.status(500).json({ error: 'Invalid user password format' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    } else {
      // OAuth user - no password required, but log it
      console.log('OAuth user disabling 2FA - skipping password verification');
    }

    // Disable 2FA and clear secret
    dbHelpers.updateUser(req.user.userId, { 
      two_factor_enabled: 0,
      two_factor_secret: null
    });

    // Verify the update worked
    const updatedUser = dbHelpers.getUserById(req.user.userId);
    console.log('2FA Disabled - Updated user status:', {
      user_id: req.user.userId,
      two_factor_enabled: updatedUser.two_factor_enabled,
      email: updatedUser.email
    });

    // Log activity
    createLog({
      user_id: req.user.userId,
      action: '2FA disabled',
      ip_address: req.ip,
      details: JSON.stringify({ oauth_user: !user.password_hash })
    });

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OAuth login (Google, GitHub)  
router.post('/oauth', async (req, res) => {
  console.log('OAuth endpoint hit:', req.body); // Debug log
  try {
    const { provider, id_token, email, name, photo_url } = req.body;

    if (!provider || !email) {
      return res.status(400).json({ error: 'Provider and email are required' });
    }

    if (!['google', 'github'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid OAuth provider' });
    }

    // TODO: Verify id_token with Firebase Admin SDK in production
    // For now, we'll trust the token from the client (not recommended for production)
    
    // Check if user exists
    let user = dbHelpers.getUserByEmail(email);
    
    if (!user) {
      // Create new user
      const userId = dbHelpers.createUser({
        name: name || email,
        email: email,
        password_hash: null, // OAuth users don't have passwords
        role: 'user',
        plan_id: 1, // Free plan
        profile_picture: photo_url
      });
      
      user = dbHelpers.getUserById(userId);
      
      // Log activity
      createLog({
        user_id: userId,
        action: `User registered via ${provider}`,
        ip_address: req.ip,
        details: JSON.stringify({ email, provider })
      });
    } else {
      // Update profile picture if provided
      if (photo_url && !user.profile_picture) {
        dbHelpers.updateUser(user.user_id, { profile_picture: photo_url });
        user = dbHelpers.getUserById(user.user_id); // Refresh user data
      }
      
      // Log activity
      createLog({
        user_id: user.user_id,
        action: `User logged in via ${provider}`,
        ip_address: req.ip,
        details: JSON.stringify({ email, provider })
      });
    }

    // Check if 2FA is enabled (same check as regular login)
    console.log('OAuth Login - User 2FA Status:', {
      two_factor_enabled: user.two_factor_enabled,
      two_factor_enabled_type: typeof user.two_factor_enabled,
      has_secret: !!user.two_factor_secret,
      email: user.email
    });

    if ((user.two_factor_enabled === 1 || user.two_factor_enabled === true) && user.two_factor_secret) {
      // Require 2FA verification code
      console.log('OAuth user has 2FA enabled - requiring verification');
      return res.json({
        message: '2FA verification required',
        requires2FA: true,
        user_id: user.user_id,
        email: user.email,
        oauth: true
      });
    }

    console.log('OAuth user - 2FA not enabled, proceeding with login');

    // Generate token
    const token = generateToken(user.user_id, user.email, user.role);

    res.json({
      message: `${provider} authentication successful`,
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan_id: user.plan_id,
        profile_picture: user.profile_picture
      }
    });
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;






