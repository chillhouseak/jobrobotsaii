const express = require('express');
const router = express.Router();
const ipnService = require('../services/ipnService');
const { ipWhitelistMiddleware, getClientIP } = require('../middleware/ipWhitelist');
const IPNMapping = require('../models/IPNMapping');
const IPNTransaction = require('../models/IPNTransaction');
const Subscription = require('../models/Subscription');
const Webhook = require('../models/Webhook');
const { adminAuth } = require('../middleware/adminAuth');

// Apply IP whitelist middleware to all webhook routes
router.use(ipWhitelistMiddleware);

// Valid actions
const VALID_ACTIONS = ['SALE', 'PURCHASE', 'REFUND', 'CHARGEBACK', 'CANCEL', 'REBILL', 'UPSELL', 'DOWNGRADE'];

// Validate payload
const validatePayload = (body) => {
  const errors = [];

  if (!body.transaction_id) {
    errors.push('transaction_id is required');
  }

  if (!body.action) {
    errors.push('action is required');
  } else if (!VALID_ACTIONS.includes(body.action.toUpperCase())) {
    errors.push(`Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`);
  }

  if (!body.product_id && body.action.toUpperCase() !== 'REFUND') {
    errors.push('product_id is required');
  }

  if (!body.user || !body.user.email) {
    errors.push('user.email is required');
  }

  if (body.total_amount === undefined) {
    errors.push('total_amount is required');
  }

  return errors;
};

// POST /api/webhooks/ipn - Main IPN webhook endpoint
router.post('/ipn', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      _ipAddress: getClientIP(req),
      _userAgent: req.get('User-Agent')
    };

    console.log(`[IPN Webhook] Received: ${payload.action} - ${payload.transaction_id}`);

    // Validate payload
    const errors = validatePayload(payload);
    if (errors.length > 0) {
      console.log(`[IPN Webhook] Validation failed:`, errors);
      return res.status(400).json({
        success: false,
        message: 'Invalid payload',
        errors
      });
    }

    // Process the webhook
    const result = await ipnService.processWebhook(payload);

    // Return appropriate status
    if (result.duplicate) {
      return res.status(200).json(result);
    }

    if (result.success) {
      return res.status(200).json(result);
    }

    return res.status(400).json(result);

  } catch (error) {
    console.error('[IPN Webhook] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/webhooks/ipn/health - Health check endpoint
router.get('/ipn/health', (req, res) => {
  res.json({
    success: true,
    message: 'IPN webhook endpoint is healthy',
    timestamp: new Date().toISOString(),
    ip: getClientIP(req)
  });
});

// GET /api/webhooks/transactions - Get transaction history (admin only)
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, action, email } = req.query;

    const query = {};
    if (status) query.status = status;
    if (action) query.action = action.toUpperCase();
    if (email) query.userEmail = email.toLowerCase();

    const transactions = await IPNTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await IPNTransaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('[IPN] Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions'
    });
  }
});

// GET /api/webhooks/mappings - Get product mappings (admin only)
router.get('/mappings', async (req, res) => {
  try {
    const mappings = await IPNMapping.find({ isActive: true })
      .sort({ productId: 1 });

    res.json({
      success: true,
      data: mappings
    });

  } catch (error) {
    console.error('[IPN] Error fetching mappings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product mappings'
    });
  }
});

// POST /api/webhooks/mappings - Create product mapping (admin only)
router.post('/mappings', async (req, res) => {
  try {
    const { productId, planId, planName, productName, price } = req.body;

    const mapping = await IPNMapping.findOneAndUpdate(
      { productId },
      {
        productId,
        planId,
        planName,
        productName,
        price,
        isActive: true
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Product mapping created/updated',
      data: mapping
    });

  } catch (error) {
    console.error('[IPN] Error creating mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product mapping'
    });
  }
});

// ============================================
// Admin Webhook Management Routes
// ============================================

// @route   POST /api/admin/webhook
// @desc    Create a new webhook
// @access  Private (Admin)
router.post('/', adminAuth, async (req, res) => {
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

// @route   GET /api/admin/webhook
// @desc    Get all webhooks
// @access  Private (Admin)
router.get('/', adminAuth, async (req, res) => {
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

// @route   PUT /api/admin/webhook/:id
// @desc    Update webhook
// @access  Private (Admin)
router.put('/:id', adminAuth, async (req, res) => {
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

// @route   DELETE /api/admin/webhook/:id
// @desc    Delete webhook
// @access  Private (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
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

// @route   POST /api/admin/webhook/:id/regenerate
// @desc    Regenerate webhook secret
// @access  Private (Admin)
router.post('/:id/regenerate', adminAuth, async (req, res) => {
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

// @route   POST /api/admin/webhook/:id/test
// @desc    Test webhook
// @access  Private (Admin)
router.post('/:id/test', adminAuth, async (req, res) => {
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

// ============================================
// Subscription Stats Route
// ============================================

// GET /api/webhooks/subscriptions - Get subscription stats (admin only)
router.get('/subscriptions', async (req, res) => {
  try {
    const stats = await Subscription.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const planStats = await Subscription.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: '$planId',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {};
    stats.forEach(s => { statusCounts[s._id] = s.count; });

    const planCounts = {};
    planStats.forEach(p => { planCounts[p._id] = p.count; });

    res.json({
      success: true,
      data: {
        byStatus: statusCounts,
        byPlan: planCounts,
        total: Object.values(statusCounts).reduce((a, b) => a + b, 0)
      }
    });

  } catch (error) {
    console.error('[IPN] Error fetching subscription stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription stats'
    });
  }
});

module.exports = router;
