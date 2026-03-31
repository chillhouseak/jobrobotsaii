import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from './models/User.js';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const authMiddleware = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Access denied. No token provided.');
  }
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI not set in Vercel project settings');
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri);
};

// Email transporter
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Generate and hash reset token
const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hashedToken };
};

// Extract action from URL path — Express strips /api/auth prefix
const getAction = (req) => {
  const url = req.url.split('?')[0]; // '/login' → 'login'
  return url.replace(/^\//, '') || null;
};

// CORS headers — allow all Vercel frontend domains and localhost
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).set(corsHeaders).send('');
  }

  res.set(corsHeaders);

  const action = getAction(req);
  const { method, body } = req;

  try {
    await connectDB();
  } catch (e) {
    return res.status(503).json({ success: false, message: e.message });
  }

  try {
    // Login
    if (action === 'login' && method === 'POST') {
      const { email, password, name } = body || {};
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password' });
      }

      let user = await User.findOne({ email: email.toLowerCase() }).select('+password');

      if (!user) {
        const newUser = new User({ name: name || email.split('@')[0], email: email.toLowerCase(), password });
        await newUser.save();
        const token = generateToken(newUser._id);
        return res.status(201).json({
          success: true, message: 'Account created',
          data: { user: { _id: newUser._id, name: newUser.name, email: newUser.email }, token, isNewUser: true }
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const token = generateToken(user._id);
      return res.status(200).json({
        success: true, message: 'Login successful',
        data: { user: { _id: user._id, name: user.name, email: user.email }, token, isNewUser: false }
      });
    }

    // Register
    if (action === 'register' && method === 'POST') {
      const { name, email, password } = body || {};
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
      }
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(400).json({ success: false, message: 'User already exists' });

      const user = new User({ name, email: email.toLowerCase(), password });
      await user.save();
      const token = generateToken(user._id);
      return res.status(201).json({
        success: true, message: 'Registration successful',
        data: { user: { _id: user._id, name: user.name, email: user.email }, token }
      });
    }

    // Me
    if (action === 'me' && method === 'GET') {
      const decoded = await authMiddleware(req);
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      return res.status(200).json({ success: true, data: { user } });
    }

    // Forgot Password
    if (action === 'forgot-password' && method === 'POST') {
      return forgotPasswordHandler(req, res);
    }

    // Reset Password
    if (action === 'reset-password' && method === 'POST') {
      return resetPasswordHandler(req, res);
    }

    // Profile
    if (action === 'profile' && method === 'PUT') {
      const decoded = await authMiddleware(req);
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const fields = ['name', 'skills', 'experienceLevel', 'targetRole', 'phone', 'location', 'linkedin', 'bio'];
      fields.forEach(f => { if (body[f] !== undefined) user[f] = body[f]; });
      await user.save();
      return res.status(200).json({ success: true, message: 'Profile updated', data: { user } });
    }

    return res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('Auth error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ==========================================
// Password Reset Endpoints (separate handler)
// ==========================================

export async function forgotPasswordHandler(req, res) {
  const { method, body } = req;
  if (method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();
  } catch (e) {
    return res.status(503).json({ success: false, message: e.message });
  }

  try {
    const { email } = body || {};
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.'
      });
    }

    // Generate reset token
    const { token, hashedToken } = generateResetToken();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = expiry;
    await user.save();

    // Send email
    const frontendUrl = process.env.FRONTEND_URL || 'https://jobrobotsai.vercel.app';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">JobRobots AI</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin: 0 0 20px;">Password Reset Request</h2>
          <p style="color: #6b7280; line-height: 1.6;">You requested a password reset for your JobRobots AI account.</p>
          <p style="color: #6b7280; line-height: 1.6;">Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">Or copy this link:</p>
          <p style="background: #f3f4f6; padding: 12px; border-radius: 6px; font-size: 12px; word-break: break-all; color: #374151;">${resetUrl}</p>
          <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">⚠️ This link expires in 15 minutes. If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `;

    // Only send if email is configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = getTransporter();
        await transporter.sendMail({
          from: `"JobRobots AI" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: '🔒 Password Reset - JobRobots AI',
          html: emailHtml,
        });
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // Still return success — don't reveal email failure
      }
    } else {
      console.log(`[DEV MODE] Reset link for ${user.email}: ${resetUrl}`);
    }

    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
      // Include token in dev mode for testing
      ...(process.env.NODE_ENV !== 'production' && { devToken: token }),
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function resetPasswordHandler(req, res) {
  const { method, body } = req;
  if (method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();
  } catch (e) {
    return res.status(503).json({ success: false, message: e.message });
  }

  try {
    const { token, newPassword } = body || {};

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Hash token and find user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: new Date() }, // not expired
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new one.'
      });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

