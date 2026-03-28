const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/User');
const Webhook = require('../models/Webhook');
const { adminAuth, requireSuperadmin } = require('../middleware/adminAuth');

// Generate JWT for admin
const generateAdminToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      type: 'admin'
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// @route   POST /api/admin/login
// @desc    Login admin user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find admin
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is deactivated. Contact superadmin.'
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    await admin.updateLastLogin(ip, userAgent);

    // Generate token
    const token = generateAdminToken(admin);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/admin/me
// @desc    Get current admin info
// @access  Private
router.get('/me', adminAuth, async (req, res) => {
  res.json({
    success: true,
    data: {
      admin: req.admin
    }
  });
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and search
// @access  Private (Admin)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      plan = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (plan) {
      query.plan = plan;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get users and total count
    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user details
// @access  Private (Admin)
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private (Admin)
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { name, plan, status, aiCredits } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name !== undefined) user.name = name;
    if (plan !== undefined) user.plan = plan;
    if (status !== undefined) user.status = status;
    if (aiCredits !== undefined) user.aiCredits = aiCredits;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Superadmin)
router.delete('/users/:id', adminAuth, requireSuperadmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// @route   PUT /api/admin/users/:id/suspend
// @desc    Suspend/unsuspend user
// @access  Private (Admin)
router.put('/users/:id/suspend', adminAuth, async (req, res) => {
  try {
    const { suspend, reason } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (suspend) {
      await user.suspend(reason || 'Suspended by admin');
    } else {
      await user.reactivate();
    }

    res.json({
      success: true,
      message: suspend ? 'User suspended successfully' : 'User reactivated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get analytics data
// @access  Private (Admin)
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    let startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else startDate = new Date(0);

    // Get counts
    const [
      totalUsers,
      activeUsers,
      newUsersThisPeriod,
      usersByPlan,
      usersByStatus,
      recentSignups
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      User.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name email plan createdAt')
    ]);

    // Format usersByPlan
    const planStats = {
      free: 0,
      standard: 0,
      unlimited: 0,
      agency: 0
    };
    usersByPlan.forEach(item => {
      planStats[item._id] = item.count;
    });

    // Format usersByStatus
    const statusStats = {
      active: 0,
      suspended: 0,
      cancelled: 0,
      pending: 0
    };
    usersByStatus.forEach(item => {
      statusStats[item._id] = item.count;
    });

    // Calculate growth rate
    const previousPeriodStart = new Date(startDate);
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);

    const previousPeriodUsers = await User.countDocuments({
      createdAt: { $gte: previousPeriodStart, $lt: startDate }
    });

    const growthRate = previousPeriodUsers > 0
      ? ((newUsersThisPeriod - previousPeriodUsers) / previousPeriodUsers * 100).toFixed(1)
      : newUsersThisPeriod > 0 ? 100 : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          newUsersThisPeriod,
          growthRate: parseFloat(growthRate)
        },
        planStats,
        statusStats,
        recentSignups
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
});

// @route   GET /api/admin/subscriptions
// @desc    Get subscription statistics
// @access  Private (Admin)
router.get('/subscriptions', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, plan = '', status = '' } = req.query;

    const query = {};
    if (plan) query.plan = plan;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [subscriptions, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    // Calculate revenue (mock data - adjust based on your pricing)
    const planPricing = {
      free: 0,
      standard: 29,
      unlimited: 49,
      agency: 99
    };

    let estimatedMRR = 0;
    subscriptions.forEach(user => {
      estimatedMRR += planPricing[user.plan] || 0;
    });

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: {
          planDistribution: {
            free: await User.countDocuments({ plan: 'free' }),
            standard: await User.countDocuments({ plan: 'standard' }),
            unlimited: await User.countDocuments({ plan: 'unlimited' }),
            agency: await User.countDocuments({ plan: 'agency' })
          },
          estimatedMRR: estimatedMRR
        }
      }
    });
  } catch (error) {
    console.error('Subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions'
    });
  }
});

// @route   PUT /api/admin/subscriptions/:userId
// @desc    Update user subscription
// @access  Private (Admin)
router.put('/subscriptions/:userId', adminAuth, async (req, res) => {
  try {
    const { plan, status } = req.body;

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (plan) {
      await user.upgradePlan(plan);
    }

    if (status) {
      user.status = status;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subscription'
    });
  }
});

// @route   GET /api/admin/ai-usage
// @desc    Get AI usage statistics
// @access  Private (Admin)
router.get('/ai-usage', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'aiCredits', sortOrder = 'desc' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [users, total] = await Promise.all([
      User.find({ aiCredits: { $lt: 999999 } })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments({ aiCredits: { $lt: 999999 } })
    ]);

    // Calculate totals
    const usageStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalCredits: { $sum: '$aiCredits' },
          totalResumes: { $sum: '$resumeGenerations' },
          totalInterviews: { $sum: '$interviewSessions' },
          avgCredits: { $avg: '$aiCredits' }
        }
      }
    ]);

    // Get top 10 heavy users
    const heavyUsers = await User.find({ aiCredits: { $lt: 999999 } })
      .sort({ aiCredits: -1 })
      .limit(10)
      .select('name email plan aiCredits resumeGenerations interviewSessions');

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: usageStats[0] || {
          totalCredits: 0,
          totalResumes: 0,
          totalInterviews: 0,
          avgCredits: 0
        },
        heavyUsers
      }
    });
  } catch (error) {
    console.error('AI usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching AI usage'
    });
  }
});

// @route   PUT /api/admin/ai-usage/:userId
// @desc    Update user AI credits
// @access  Private (Admin)
router.put('/ai-usage/:userId', adminAuth, async (req, res) => {
  try {
    const { aiCredits, resumeGenerations, interviewSessions } = req.body;

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (aiCredits !== undefined) user.aiCredits = aiCredits;
    if (resumeGenerations !== undefined) user.resumeGenerations = resumeGenerations;
    if (interviewSessions !== undefined) user.interviewSessions = interviewSessions;

    await user.save();

    res.json({
      success: true,
      message: 'AI usage updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update AI usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating AI usage'
    });
  }
});

// @route   GET /api/admin/export/users
// @desc    Export users as CSV
// @access  Private (Admin)
router.get('/export/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');

    // Create CSV
    const headers = ['Name', 'Email', 'Plan', 'Status', 'AI Credits', 'Created At'];
    const rows = users.map(user => [
      user.name || '',
      user.email,
      user.plan,
      user.status,
      user.aiCredits,
      new Date(user.createdAt).toISOString()
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=users-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting users'
    });
  }
});

// @route   POST /api/admin/broadcast
// @desc    Broadcast message to users (placeholder)
// @access  Private (Admin)
router.post('/broadcast', adminAuth, async (req, res) => {
  try {
    const { subject, message, target = 'all' } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    // Log the broadcast (in production, integrate with email service)
    console.log(`[BROADCAST] From: ${req.admin.email}`);
    console.log(`[BROADCAST] Target: ${target}`);
    console.log(`[BROADCAST] Subject: ${subject}`);
    console.log(`[BROADCAST] Message: ${message}`);

    res.json({
      success: true,
      message: 'Broadcast queued successfully',
      data: {
        subject,
        target,
        sentBy: req.admin.email,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending broadcast'
    });
  }
});

// ============================================
// Webhook Management Routes
// ============================================

// @route   POST /api/admin/webhooks
// @desc    Create a new webhook
// @access  Private (Admin)
router.post('/webhooks', adminAuth, async (req, res) => {
  try {
    const { name, url, events } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        success: false,
        message: 'Name and URL are required'
      });
    }

    const webhook = new Webhook({
      name,
      url,
      events: events || ['payment.completed'],
      createdBy: req.admin._id
    });

    webhook.generateSecret();
    await webhook.save();

    res.status(201).json({
      success: true,
      message: 'Webhook created successfully',
      data: {
        webhook,
        secret: webhook.secret
      }
    });
  } catch (error) {
    console.error('Create webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating webhook'
    });
  }
});

// @route   GET /api/admin/webhooks
// @desc    Get all webhooks
// @access  Private (Admin)
router.get('/webhooks', adminAuth, async (req, res) => {
  try {
    const webhooks = await Webhook.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: { webhooks }
    });
  } catch (error) {
    console.error('Get webhooks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching webhooks'
    });
  }
});

// @route   PUT /api/admin/webhooks/:id
// @desc    Update webhook
// @access  Private (Admin)
router.put('/webhooks/:id', adminAuth, async (req, res) => {
  try {
    const { name, url, isActive, events } = req.body;

    const webhook = await Webhook.findById(req.params.id);
    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found'
      });
    }

    if (name) webhook.name = name;
    if (url) webhook.url = url;
    if (isActive !== undefined) webhook.isActive = isActive;
    if (events) webhook.events = events;

    await webhook.save();

    res.json({
      success: true,
      message: 'Webhook updated successfully',
      data: { webhook }
    });
  } catch (error) {
    console.error('Update webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating webhook'
    });
  }
});

// @route   DELETE /api/admin/webhooks/:id
// @desc    Delete webhook
// @access  Private (Admin)
router.delete('/webhooks/:id', adminAuth, async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.id);
    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found'
      });
    }

    await Webhook.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting webhook'
    });
  }
});

// @route   POST /api/admin/webhooks/:id/regenerate
// @desc    Regenerate webhook secret
// @access  Private (Admin)
router.post('/webhooks/:id/regenerate', adminAuth, async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.id);
    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found'
      });
    }

    const newSecret = webhook.generateSecret();
    await webhook.save();

    res.json({
      success: true,
      message: 'Secret regenerated successfully',
      data: { secret: newSecret }
    });
  } catch (error) {
    console.error('Regenerate secret error:', error);
    res.status(500).json({
      success: false,
      message: 'Error regenerating secret'
    });
  }
});

// @route   POST /api/admin/webhooks/:id/test
// @desc    Test webhook
// @access  Private (Admin)
router.post('/webhooks/:id/test', adminAuth, async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.id);
    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found'
      });
    }

    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: { message: 'Test webhook from JobRobots Admin' }
    };

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret
        },
        body: JSON.stringify(testPayload)
      });

      webhook.lastTriggered = new Date();
      webhook.lastStatus = response.ok ? 'success' : 'failed';
      webhook.lastResponse = `HTTP ${response.status}`;
      webhook.triggerCount += 1;
      if (!response.ok) webhook.failureCount += 1;
      await webhook.save();

      res.json({
        success: true,
        message: 'Webhook test completed',
        data: { status: response.status, ok: response.ok }
      });
    } catch (fetchError) {
      webhook.lastTriggered = new Date();
      webhook.lastStatus = 'failed';
      webhook.lastResponse = fetchError.message;
      webhook.triggerCount += 1;
      webhook.failureCount += 1;
      await webhook.save();

      res.json({
        success: true,
        message: 'Webhook test failed',
        data: { error: fetchError.message }
      });
    }
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing webhook'
    });
  }
});

module.exports = router;
