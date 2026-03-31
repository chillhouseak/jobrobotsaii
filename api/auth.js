import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from './models/User.js';

// ======================
// ✅ CORS (FIXED)
// ======================
const allowedOrigin = 'https://jobrobotsaii-qbjo.vercel.app';

const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// ======================
// UTILS
// ======================
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI not set');

  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri);
};

const getAction = (req) => {
  const url = req.url.split('?')[0];
  return url.replace(/^\//, '') || null;
};

// ======================
// MAIN HANDLER
// ======================
export default async function handler(req, res) {
  // ✅ ALWAYS APPLY CORS FIRST
  setCors(res);

  // ✅ HANDLE PREFLIGHT (MOST IMPORTANT)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = getAction(req);
  const { method, body } = req;

  try {
    await connectDB();
  } catch (e) {
    return res.status(503).json({ success: false, message: e.message });
  }

  try {
    // ======================
    // LOGIN
    // ======================
    if (action === 'login' && method === 'POST') {
      const { email, password, name } = body || {};

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password required',
        });
      }

      let user = await User.findOne({ email: email.toLowerCase() }).select('+password');

      // Create new user if not exists
      if (!user) {
        const newUser = new User({
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          password,
        });

        await newUser.save();

        const token = generateToken(newUser._id);

        return res.status(201).json({
          success: true,
          message: 'Account created',
          data: {
            user: {
              _id: newUser._id,
              name: newUser.name,
              email: newUser.email,
            },
            token,
            isNewUser: true,
          },
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      const token = generateToken(user._id);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
          },
          token,
          isNewUser: false,
        },
      });
    }

    // ======================
    // REGISTER
    // ======================
    if (action === 'register' && method === 'POST') {
      const { name, email, password } = body || {};

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'All fields required',
        });
      }

      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'User already exists',
        });
      }

      const user = new User({
        name,
        email: email.toLowerCase(),
        password,
      });

      await user.save();

      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
          },
          token,
        },
      });
    }

    // ======================
    // DEFAULT
    // ======================
    return res.status(404).json({
      success: false,
      message: 'Route not found',
    });

  } catch (error) {
    console.error('Auth error:', error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
