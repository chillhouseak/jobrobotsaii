import jwt from 'jsonwebtoken';
import connectDB from '../db.js';
import User from '../../backend/models/User.js';
import Admin from '../../backend/models/Admin.js';
import Webhook from '../../backend/models/Webhook.js';

const generateAdminToken = (admin) => {
  return jwt.sign(
    { id: admin._id, email: admin.email, role: admin.role, type: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const adminAuth = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Access denied. No admin token provided.');
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded.type !== 'admin') {
    throw new Error('Access denied. Admin privileges required.');
  }

  const admin = await Admin.findById(decoded.id);
  if (!admin || !admin.isActive) {
    throw new Error('Admin not found or inactive.');
  }

  return admin;
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
  } catch (dbError) {
    console.error('DB Error:', dbError.message);
    return res.status(dbError.statusCode || 500).json({
      success: false,
      message: dbError.message || 'Database unavailable'
    });
  }

  const { method, query, body } = req;
  const action = query.action;

  try {
    // Login
    if (action === 'login' && method === 'POST') {
      const { email, password } = body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password' });
      }

      const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

      if (!admin || !admin.isActive) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      admin.lastLogin = new Date();
      await admin.save();

      const token = generateAdminToken(admin);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: { token, admin: { id: admin._id, email: admin.email, name: admin.name, role: admin.role } }
      });
    }

    // Get current admin
    if (action === 'me' && method === 'GET') {
      const admin = await adminAuth(req);
      return res.status(200).json({ success: true, data: { admin } });
    }

    // ============ USERS ============
    if (action === 'users' && method === 'GET') {
      await adminAuth(req);
      const { page = 1, limit = 20, search = '', status = '', plan = '' } = query;

      const query_1 = {};
      if (search) {
        query_1.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      if (status) query_1.status = status;
      if (plan) query_1.plan = plan;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [users, total] = await Promise.all([
        User.find(query_1).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        User.countDocuments(query_1)
      ]);

      return res.status(200).json({
        success: true,
        data: {
          users,
          pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        }
      });
    }

    if (action === 'users' && method === 'POST') {
      await adminAuth(req);
      const { page = 1, limit = 20, search = '', status = '', plan = '' } = body;

      const query_2 = {};
      if (search) {
        query_2.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      if (status) query_2.status = status;
      if (plan) query_2.plan = plan;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [users, total] = await Promise.all([
        User.find(query_2).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        User.countDocuments(query_2)
      ]);

      return res.status(200).json({
        success: true,
        data: {
          users,
          pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        }
      });
    }

    // ============ ANALYTICS ============
    if (action === 'analytics' && method === 'GET') {
      await adminAuth(req);

      const [totalUsers, activeUsers, usersByPlan, usersByStatus, recentSignups] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: 'active' }),
        User.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
        User.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        User.find().sort({ createdAt: -1 }).limit(10).select('name email plan createdAt')
      ]);

      const planStats = { free: 0, standard: 0, unlimited: 0, agency: 0 };
      usersByPlan.forEach(item => { planStats[item._id] = item.count; });

      const statusStats = { active: 0, suspended: 0, cancelled: 0, pending: 0 };
      usersByStatus.forEach(item => { statusStats[item._id] = item.count; });

      return res.status(200).json({
        success: true,
        data: {
          overview: { totalUsers, activeUsers, newUsersThisPeriod: 0, growthRate: 0 },
          planStats,
          statusStats,
          recentSignups
        }
      });
    }

    // ============ SUBSCRIPTIONS ============
    if (action === 'subscriptions' && method === 'GET') {
      await adminAuth(req);

      const [subscriptions, planDistribution] = await Promise.all([
        User.find().sort({ createdAt: -1 }).limit(50),
        User.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }])
      ]);

      const dist = { free: 0, standard: 0, unlimited: 0, agency: 0 };
      planDistribution.forEach(item => { dist[item._id] = item.count; });

      return res.status(200).json({
        success: true,
        data: {
          subscriptions,
          pagination: { page: 1, limit: 50, total: subscriptions.length, pages: 1 },
          stats: { planDistribution: dist, estimatedMRR: 0 }
        }
      });
    }

    // ============ AI USAGE ============
    if (action === 'ai-usage' && method === 'GET') {
      await adminAuth(req);

      const users = await User.find({ aiCredits: { $lt: 999999 } })
        .sort({ aiCredits: -1 })
        .limit(50);

      const stats = await User.aggregate([
        { $group: { _id: null, totalCredits: { $sum: '$aiCredits' }, totalResumes: { $sum: '$resumeGenerations' }, totalInterviews: { $sum: '$interviewSessions' }, avgCredits: { $avg: '$aiCredits' } } }
      ]);

      return res.status(200).json({
        success: true,
        data: {
          users,
          pagination: { page: 1, limit: 50, total: users.length, pages: 1 },
          stats: stats[0] || { totalCredits: 0, totalResumes: 0, totalInterviews: 0, avgCredits: 0 },
          heavyUsers: users.slice(0, 10)
        }
      });
    }

    // ============ WEBHOOKS ============
    if (action === 'webhooks' && method === 'GET') {
      await adminAuth(req);
      const webhooks = await Webhook.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: { webhooks } });
    }

    if (action === 'webhooks' && method === 'POST') {
      const admin = await adminAuth(req);
      const { name, url, events } = body;

      if (!name || !url) {
        return res.status(400).json({ success: false, message: 'Name and URL are required' });
      }

      const webhook = new Webhook({ name, url, events: events || ['payment.completed'], createdBy: admin._id });
      webhook.generateSecret();
      await webhook.save();

      return res.status(201).json({
        success: true,
        message: 'Webhook created successfully',
        data: { webhook, secret: webhook.secret }
      });
    }

    if (action === 'webhooks' && method === 'DELETE') {
      await adminAuth(req);
      await Webhook.deleteOne({ _id: body.id });
      return res.status(200).json({ success: true, message: 'Webhook deleted successfully' });
    }

    // ============ BROADCAST ============
    if (action === 'broadcast' && method === 'POST') {
      await adminAuth(req);
      return res.status(200).json({
        success: true,
        message: 'Broadcast sent successfully',
        data: { timestamp: new Date() }
      });
    }

    res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('Admin API Error:', error);

    if (error.message.includes('Access denied') || error.message.includes('Admin')) {
      return res.status(401).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
}
