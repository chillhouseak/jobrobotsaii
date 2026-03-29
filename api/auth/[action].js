import jwt from 'jsonwebtoken';
import connectDB from '../db.js';
import User from '../../backend/models/User.js';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Auth middleware
const authMiddleware = async (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Access denied. No token provided.');
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded;
};

export default async function handler(req, res) {
  await connectDB();

  const { method, query, body } = req;
  const { action } = query;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Login
    if (action === 'login' && method === 'POST') {
      const { email, password, name } = body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email and password'
        });
      }

      let user = await User.findOne({ email: email.toLowerCase() }).select('+password');

      if (!user) {
        const newUser = new User({
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          password
        });
        await newUser.save();

        const token = generateToken(newUser._id);

        return res.status(201).json({
          success: true,
          message: 'Account created and logged in successfully',
          data: {
            user: {
              _id: newUser._id,
              name: newUser.name,
              email: newUser.email,
              createdAt: newUser.createdAt
            },
            token,
            isNewUser: true
          }
        });
      }

      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
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
            createdAt: user.createdAt
          },
          token,
          isNewUser: false
        }
      });
    }

    // Register
    if (action === 'register' && method === 'POST') {
      const { name, email, password } = body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide name, email and password'
        });
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      const user = new User({
        name,
        email: email.toLowerCase(),
        password
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
            createdAt: user.createdAt
          },
          token
        }
      });
    }

    // Me (Get current user)
    if (action === 'me' && method === 'GET') {
      const decoded = await authMiddleware(req);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.status(200).json({
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
          }
        }
      });
    }

    // Profile (Update)
    if (action === 'profile' && method === 'PUT') {
      const decoded = await authMiddleware(req);
      const { name, skills, experienceLevel, targetRole, phone, location, linkedin, bio } = body;

      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (name !== undefined) user.name = name;
      if (skills !== undefined) user.skills = skills;
      if (experienceLevel !== undefined) user.experienceLevel = experienceLevel;
      if (targetRole !== undefined) user.targetRole = targetRole;
      if (phone !== undefined) user.phone = phone;
      if (location !== undefined) user.location = location;
      if (linkedin !== undefined) user.linkedin = linkedin;
      if (bio !== undefined) user.bio = bio;

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
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
          }
        }
      });
    }

    res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('Auth API Error:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
}
