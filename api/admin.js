import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, { PLAN_CREDITS } from './models/User.js';
import Admin from './models/Admin.js';
import Webhook from './models/Webhook.js';

export const adminAuth = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('Access denied. No admin token.');
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type !== 'admin') throw new Error('Admin privileges required.');
  const admin = await Admin.findById(decoded.id);
  if (!admin || !admin.isActive) throw new Error('Admin not found or inactive.');
  return admin;
};

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI not set in Vercel project settings');
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri);
};

// Extract action from URL path — Express strips /api/admin prefix
const getAction = (req) => {
  const url = req.url.split('?')[0];
  return url.replace(/^\//, '') || null;
};

export default async function handler(req, res) {
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
      const { email, password } = body || {};
      if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });

      const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
      if (!admin || !admin.isActive) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const isMatch = await admin.comparePassword(password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      admin.lastLogin = new Date();
      await admin.save();

      const token = jwt.sign(
        { id: admin._id, email: admin.email, role: admin.role, type: 'admin' },
        process.env.JWT_SECRET, { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true, message: 'Login successful',
        data: { token, admin: { id: admin._id, email: admin.email, name: admin.name, role: admin.role } }
      });
    }

    // Me
    if (action === 'me' && method === 'GET') {
      const admin = await adminAuth(req);
      return res.status(200).json({ success: true, data: { admin } });
    }

    // Users list
    if (action === 'users' && method === 'GET') {
      await adminAuth(req);
      const { page = 1, limit = 20, search = '', status = '', plan = '' } = req.query;
      const query = {};
      if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
      if (status) query.status = status;
      if (plan) query.plan = plan;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [users, total] = await Promise.all([
        User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        User.countDocuments(query)
      ]);

      return res.status(200).json({
        success: true,
        data: { users, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } }
      });
    }

    // Get single user
    if (action?.match(/^users\/[a-f0-9]{24}$/) && method === 'GET') {
      await adminAuth(req);
      const userId = action.split('/')[1];
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      return res.status(200).json({ success: true, data: { user } });
    }

    // Suspend / reactivate user
    if (action?.match(/^users\/[a-f0-9]{24}\/suspend$/) && method === 'PUT') {
      await adminAuth(req);
      const userId = action.split('/')[1];
      const { suspend } = body || {};
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      user.status = suspend ? 'suspended' : 'active';
      await user.save();
      return res.status(200).json({ success: true, message: suspend ? 'User suspended' : 'User reactivated', data: { user } });
    }

    // Delete user
    if (action?.match(/^users\/[a-f0-9]{24}$/) && method === 'DELETE') {
      await adminAuth(req);
      const userId = action.split('/')[1];
      const user = await User.findByIdAndDelete(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      return res.status(200).json({ success: true, message: 'User deleted' });
    }

    // Analytics
    if (action === 'analytics' && method === 'GET') {
      await adminAuth(req);
      const [totalUsers, activeUsers, usersByPlan, usersByStatus, recentSignups] = await Promise.all([
        User.countDocuments(), User.countDocuments({ status: 'active' }),
        User.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
        User.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        User.find().sort({ createdAt: -1 }).limit(10).select('name email plan createdAt')
      ]);

      const planStats = { free: 0, standard: 0, unlimited: 0, agency: 0 };
      usersByPlan.forEach(i => { planStats[i._id] = i.count; });
      const statusStats = { active: 0, suspended: 0, cancelled: 0, pending: 0 };
      usersByStatus.forEach(i => { statusStats[i._id] = i.count; });

      return res.status(200).json({
        success: true,
        data: { overview: { totalUsers, activeUsers, newUsersThisPeriod: 0, growthRate: 0 }, planStats, statusStats, recentSignups }
      });
    }

    // Create user
    if (action === 'create-user' && method === 'POST') {
      await adminAuth(req);
      const { name, email, password, plan, status } = body || {};

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      }

      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({ success: false, message: 'A user with this email already exists' });
      }

      const resolvedPlan = ['free', 'standard', 'unlimited', 'agency'].includes(plan) ? plan : 'free';

      const user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password, // hashed by pre-save hook
        plan: resolvedPlan,
        status: ['active', 'suspended', 'pending'].includes(status) ? status : 'active',
        createdVia: 'admin',
        aiCredits: PLAN_CREDITS[resolvedPlan]
      });

      await user.save();

      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user }
      });
    }

    // Subscriptions
    if (action === 'subscriptions' && method === 'GET') {
      await adminAuth(req);
      const subscriptions = await User.find().sort({ createdAt: -1 }).limit(50);
      return res.status(200).json({ success: true, data: { subscriptions, pagination: { page: 1, limit: 50, total: subscriptions.length, pages: 1 }, stats: { planDistribution: {}, estimatedMRR: 0 } } });
    }

    // AI Usage
    if (action === 'ai-usage' && method === 'GET') {
      await adminAuth(req);
      const users = await User.find({ aiCredits: { $lt: 999999 } }).sort({ aiCredits: -1 }).limit(50);
      const stats = await User.aggregate([{ $group: { _id: null, totalCredits: { $sum: '$aiCredits' }, totalResumes: { $sum: '$resumeGenerations' }, totalInterviews: { $sum: '$interviewSessions' }, avgCredits: { $avg: '$aiCredits' } } }]);
      return res.status(200).json({ success: true, data: { users, pagination: { page: 1, limit: 50, total: users.length, pages: 1 }, stats: stats[0] || { totalCredits: 0, totalResumes: 0, totalInterviews: 0, avgCredits: 0 }, heavyUsers: users.slice(0, 10) } });
    }

    // Webhooks
    if (action === 'webhooks' && method === 'GET') {
      await adminAuth(req);
      const webhooks = await Webhook.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: { webhooks } });
    }

    if (action === 'webhooks' && method === 'POST') {
      const admin = await adminAuth(req);
      const { name, url, events } = body || {};
      if (!name || !url) return res.status(400).json({ success: false, message: 'Name and URL required' });
      const webhook = new Webhook({ name, url, events: events || ['payment.completed'], createdBy: admin._id });
      webhook.generateSecret();
      await webhook.save();
      return res.status(201).json({ success: true, message: 'Webhook created', data: { webhook, secret: webhook.secret } });
    }

    if (action === 'webhooks' && method === 'DELETE') {
      await adminAuth(req);
      await Webhook.deleteOne({ _id: body?.id });
      return res.status(200).json({ success: true, message: 'Webhook deleted' });
    }

    // Broadcast
    if (action === 'broadcast' && method === 'POST') {
      await adminAuth(req);
      return res.status(200).json({ success: true, message: 'Broadcast sent', data: { timestamp: new Date() } });
    }

    return res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('Admin error:', error);
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.message.includes('Access denied') ||
      error.message.includes('Admin') ||
      error.message.includes('jwt')
    ) {
      return res.status(401).json({ success: false, message: error.message || 'Invalid or expired token' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}
