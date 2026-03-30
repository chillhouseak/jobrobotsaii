import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
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
  if (mongoose.connection.readyState) return;
  await mongoose.connect(uri, { bufferCommands: false });
};

export const setCors = (req, res) => {
  const allowedOrigins = [
    'https://jobrobotsaii-qbjo.vercel.app',
    'https://jobrobotsaii-6jrn.vercel.app',
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query || {};
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
