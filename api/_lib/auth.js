import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Dynamically load User model to avoid duplicates in serverless
function getUserModel() {
  if (mongoose.models.User) return mongoose.models.User;
  return mongoose.model('User', new mongoose.Schema({
    name: { type: String, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    plan: { type: String, enum: ['free', 'standard', 'unlimited', 'agency'], default: 'free' },
    status: { type: String, enum: ['active', 'suspended', 'cancelled', 'pending'], default: 'active' },
    skills: { type: String, default: '' },
    experienceLevel: { type: String, enum: ['junior', 'mid', 'senior', 'lead'], default: 'mid' },
    targetRole: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    bio: { type: String, default: '' },
    aiCredits: { type: Number, default: 10 },
    resumeGenerations: { type: Number, default: 0 },
    interviewSessions: { type: Number, default: 0 },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null },
    subscriptionEndDate: { type: Date, default: null },
    stripeCustomerId: { type: String, default: null },
    launchpadCustomerId: { type: String, default: null },
  }, { timestamps: true }));
}

async function authMiddleware(req, res) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
      return null;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const UserModel = getUserModel();
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found.' });
      return null;
    }

    return user;
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ success: false, message: 'Invalid token.' });
    } else if (error.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: 'Token has expired.' });
    } else {
      res.status(500).json({ success: false, message: 'Server error in authentication.' });
    }
    return null;
  }
}

export { authMiddleware, getUserModel };
