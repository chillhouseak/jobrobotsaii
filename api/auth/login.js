import jwt from 'jsonwebtoken';
import connectDB from '../_lib/db';
import User from '../../backend/models/User';

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await connectDB();

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  try {
    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      // Auto-register for demo users
      if (password === 'demo123' || email.includes('demo')) {
        user = new User({
          name: email.split('@')[0],
          email: email.toLowerCase(),
          password: 'demo123'
        });
        await user.save();
      } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          skills: user.skills,
          experienceLevel: user.experienceLevel,
          targetRole: user.targetRole,
          phone: user.phone,
          location: user.location,
          linkedin: user.linkedin,
          bio: user.bio,
          plan: user.plan,
          aiCredits: user.aiCredits,
          resumeGenerations: user.resumeGenerations,
          interviewSessions: user.interviewSessions,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
