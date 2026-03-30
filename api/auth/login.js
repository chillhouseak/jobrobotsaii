import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../../backend/models/User.js';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI not set');
  if (mongoose.connection.readyState) return;
  await mongoose.connect(uri, { bufferCommands: false });
};

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();
  } catch (e) {
    return res.status(503).json({ success: false, message: e.message });
  }

  const { email, password, name } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  try {
    let user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      const newUser = new User({ name: name || email.split('@')[0], email: email.toLowerCase(), password });
      await newUser.save();
      const token = generateToken(newUser._id);
      return res.status(201).json({
        success: true,
        message: 'Account created',
        data: { user: { _id: newUser._id, name: newUser.name, email: newUser.email }, token, isNewUser: true }
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: { _id: user._id, name: user.name, email: user.email }, token, isNewUser: false }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
