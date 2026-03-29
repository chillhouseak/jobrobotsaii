import connectDB from '../db.js';
import User from '../../backend/models/User.js';
import IPNTransaction from '../../backend/models/IPNTransaction.js';

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
    // Health check
    if (action === 'health' && method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'Webhook endpoint is healthy',
        timestamp: new Date().toISOString()
      });
    }

    // IPN Handler
    if (action === 'ipn' && method === 'POST') {
      const { transaction_id, action: ipnAction, user, total_amount, product_id } = body;

      console.log(`[IPN] Received: ${ipnAction} - ${transaction_id}`);

      // Validate required fields
      if (!transaction_id || !ipnAction || !user?.email) {
        return res.status(400).json({
          success: false,
          message: 'Invalid IPN payload'
        });
      }

      // Check for duplicate
      const existing = await IPNTransaction.findOne({ transactionId: transaction_id });
      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Duplicate transaction',
          duplicate: true
        });
      }

      // Find or create user
      let appUser = await User.findOne({ email: user.email.toLowerCase() });

      if (!appUser) {
        appUser = new User({
          name: user.name || user.email.split('@')[0],
          email: user.email.toLowerCase(),
          password: 'default_password_' + Date.now(),
          createdVia: 'webhook'
        });
      }

      // Update based on action
      const actionUpper = ipnAction.toUpperCase();

      if (actionUpper === 'SALE' || actionUpper === 'PURCHASE' || actionUpper === 'REBILL') {
        // Determine plan from product_id (customize based on your product IDs)
        const planMap = {
          'standard': 'standard',
          'unlimited': 'unlimited',
          'agency': 'agency'
        };
        const plan = planMap[product_id] || 'standard';
        await appUser.upgradePlan(plan);
      }

      if (actionUpper === 'REFUND' || actionUpper === 'CHARGEBACK' || actionUpper === 'CANCEL') {
        await appUser.downgradeToFree();
      }

      if (actionUpper === 'UPSELL') {
        const newPlan = product_id || 'unlimited';
        await appUser.upgradePlan(newPlan);
      }

      if (actionUpper === 'DOWNGRADE') {
        await appUser.upgradePlan('standard');
      }

      // Save user
      await appUser.save();

      // Record transaction
      const transaction = new IPNTransaction({
        transactionId: transaction_id,
        action: actionUpper,
        userEmail: user.email,
        amount: total_amount,
        productId: product_id,
        status: 'completed',
        rawData: body
      });
      await transaction.save();

      return res.status(200).json({
        success: true,
        message: 'IPN processed successfully',
        userId: appUser._id,
        plan: appUser.plan
      });
    }

    // Get transactions
    if (action === 'transactions' && method === 'GET') {
      const transactions = await IPNTransaction.find()
        .sort({ createdAt: -1 })
        .limit(100);

      return res.status(200).json({
        success: true,
        data: { transactions }
      });
    }

    res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('Webhook API Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
}
