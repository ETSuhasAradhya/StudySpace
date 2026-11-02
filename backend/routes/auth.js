import express from 'express';
import bcrypt from 'bcryptjs';
import { generateSecret, generateURI, verifySync } from 'otplib';
import qrcode from 'qrcode';
import { query } from '../db/index.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // Default role is student unless explicitly admin
    const userRole = role === 'admin' ? 'admin' : 'student';

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, userRole]
    );

    const newUser = result.rows[0];
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, totp_token } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user by email
    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Compare entered password with salted bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Multi-Factor Authentication Check (TOTP)
    if (user.two_factor_enabled) {
      if (!totp_token) {
        return res.status(200).json({
          requires2FA: true,
          email: user.email,
          message: 'Two-factor authentication required. Please enter 6-digit code from Google/Microsoft Authenticator.'
        });
      }

      const isValidTOTP = verifySync({ token: String(totp_token).trim(), secret: user.two_factor_secret }).valid === true;
      if (!isValidTOTP) {
        return res.status(401).json({ error: 'Invalid 6-digit 2FA security code. Please check your Authenticator app.' });
      }
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        two_factor_enabled: Boolean(user.two_factor_enabled),
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// POST /api/auth/2fa/generate (Protected)
router.post('/2fa/generate', authenticateToken, async (req, res) => {
  try {
    const secret = generateSecret();
    const otpauth = generateURI({ issuer: 'StudySpace', label: req.user.email, secret });
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    // Save secret for verification
    await query('UPDATE users SET two_factor_secret = $1 WHERE id = $2', [secret, req.user.id]);

    res.json({
      message: 'TOTP secret generated successfully. Scan the QR code using Google Authenticator or Microsoft Authenticator.',
      secret,
      otpauth,
      qrCodeUrl
    });
  } catch (error) {
    console.error('2FA generate error:', error);
    res.status(500).json({ error: 'Failed to generate 2FA credentials.' });
  }
});

// POST /api/auth/2fa/verify (Protected)
router.post('/2fa/verify', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: '6-digit TOTP code is required.' });
    }

    const userRes = await query('SELECT two_factor_secret FROM users WHERE id = $1', [req.user.id]);
    const secret = userRes.rows[0]?.two_factor_secret;

    if (!secret) {
      return res.status(400).json({ error: 'No 2FA secret found. Call /api/auth/2fa/generate first.' });
    }

    const isValid = verifySync({ token: String(token).trim(), secret }).valid === true;
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid 6-digit TOTP code. Verification failed.' });
    }

    await query('UPDATE users SET two_factor_enabled = true WHERE id = $1', [req.user.id]);

    res.json({
      success: true,
      message: 'Multi-Factor Authentication (MFA) successfully enabled with Authenticator App!'
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA code.' });
  }
});

// POST /api/auth/2fa/disable (Protected)
router.post('/2fa/disable', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    const userRes = await query('SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = $1', [req.user.id]);
    const secret = userRes.rows[0]?.two_factor_secret;

    if (secret && token) {
      const isValid = verifySync({ token: String(token).trim(), secret }).valid === true;
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid 2FA code. Cannot disable MFA.' });
      }
    }

    await query('UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1', [req.user.id]);

    res.json({
      success: true,
      message: 'Multi-factor authentication disabled.'
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA.' });
  }
});

// GET /api/auth/me (Protected)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, two_factor_enabled, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Auth /me error:', error);
    res.status(500).json({ error: 'Server error retrieving user profile.' });
  }
});

export default router;
