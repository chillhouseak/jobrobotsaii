const User = require('../models/User');
const Subscription = require('../models/Subscription');
const IPNMapping = require('../models/IPNMapping');
const IPNTransaction = require('../models/IPNTransaction');

class IPNService {
  constructor() {
    // Default plan configuration
    this.defaultPlan = {
      planId: 'free',
      planName: 'Free',
      aiCredits: 10
    };

    // Plan configurations
    this.planConfigs = {
      free: { aiCredits: 10 },
      standard: { aiCredits: 50 },
      unlimited: { aiCredits: 999999 },
      agency: { aiCredits: 999999 }
    };
  }

  // Get plan info from product ID
  async getPlanFromProductId(productId) {
    const mapping = await IPNMapping.findOne({ productId, isActive: true });
    if (mapping) {
      return {
        planId: mapping.planId,
        planName: mapping.planName,
        productName: mapping.productName
      };
    }

    // Default fallback based on price
    const priceMapping = {
      19: { planId: 'standard', planName: 'Standard' },
      49: { planId: 'unlimited', planName: 'Unlimited' },
      149: { planId: 'agency', planName: 'Agency' }
    };

    return priceMapping[productId] || this.defaultPlan;
  }

  // Log transaction
  async logTransaction(payload, status, response, errorMessage = null) {
    try {
      await IPNTransaction.create({
        transactionId: payload.transaction_id,
        action: payload.action,
        productId: payload.product_id,
        totalAmount: payload.total_amount,
        userEmail: payload.user?.email,
        userName: payload.user?.name,
        status,
        rawPayload: payload,
        response,
        errorMessage,
        ipAddress: payload._ipAddress,
        userAgent: payload._userAgent
      });
    } catch (error) {
      console.error('[IPN] Failed to log transaction:', error.message);
    }
  }

  // Check for duplicate transaction
  async isDuplicateTransaction(transactionId) {
    const existing = await IPNTransaction.findOne({ transactionId });
    return !!existing;
  }

  // Find or create user by email
  async findOrCreateUser(userData) {
    let user = await User.findOne({ email: userData.email.toLowerCase() });

    if (!user) {
      // Create new user
      const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      user = await User.create({
        name: userData.name || '',
        email: userData.email.toLowerCase(),
        password: tempPassword,
        createdVia: 'webhook',
        plan: 'free',
        status: 'active'
      });

      console.log(`[IPN] Created new user: ${user.email}`);

      // Create initial free subscription
      await Subscription.create({
        userId: user._id,
        planId: 'free',
        planName: 'Free',
        status: 'active',
        createdVia: 'webhook'
      });
    }

    return user;
  }

  // Create or update subscription
  async createOrUpdateSubscription(userId, planInfo, transactionId, productId, amount, action) {
    let subscription = await Subscription.findOne({
      userId,
      status: 'active'
    });

    const endDate = this.calculateEndDate(action);

    if (subscription) {
      // Update existing
      subscription.planId = planInfo.planId;
      subscription.planName = planInfo.planName;
      subscription.transactionId = transactionId;
      subscription.productId = productId;
      subscription.amount = amount;
      subscription.endDate = endDate;
      subscription.nextBillingDate = endDate;
      subscription.billingCycle = action === 'REBILL' ? subscription.billingCycle : 'monthly';

      if (action === 'REBILL') {
        // Extend existing subscription
        await subscription.extend(30);
      }

      await subscription.save();
    } else {
      // Create new subscription
      subscription = await Subscription.create({
        userId,
        planId: planInfo.planId,
        planName: planInfo.planName,
        status: 'active',
        startDate: new Date(),
        endDate,
        nextBillingDate: endDate,
        billingCycle: 'monthly',
        transactionId,
        productId,
        amount,
        createdVia: 'webhook'
      });
    }

    // Update user's subscription reference
    await User.findByIdAndUpdate(userId, {
      subscriptionId: subscription._id
    });

    return subscription;
  }

  // Calculate end date based on action
  calculateEndDate(action) {
    const now = new Date();

    switch (action) {
      case 'REBILL':
        // Extend by 30 days
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'SALE':
      case 'PURCHASE':
        // Start new 30-day period
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  }

  // Process SALE/PURCHASE action
  async handleSale(payload) {
    const { user, product_id, total_amount, transaction_id } = payload;
    const planInfo = await this.getPlanFromProductId(product_id);

    // Find or create user
    const targetUser = await this.findOrCreateUser(user);

    // Create/update subscription
    await this.createOrUpdateSubscription(
      targetUser._id,
      planInfo,
      transaction_id,
      product_id,
      total_amount,
      payload.action
    );

    // Upgrade user's plan
    const endDate = this.calculateEndDate(payload.action);
    await targetUser.upgradePlan(planInfo.planId, endDate);

    // Create subscription record if doesn't exist
    await Subscription.findOneAndUpdate(
      { userId: targetUser._id, status: 'active' },
      {
        userId: targetUser._id,
        planId: planInfo.planId,
        planName: planInfo.planName,
        status: 'active',
        endDate,
        transactionId: transaction_id,
        productId: product_id,
        amount: total_amount
      },
      { upsert: true, new: true }
    );

    return {
      success: true,
      message: `${payload.action} processed successfully`,
      userId: targetUser._id,
      email: targetUser.email,
      plan: planInfo.planId
    };
  }

  // Process REFUND action
  async handleRefund(payload) {
    const { user, transaction_id } = payload;

    const targetUser = await User.findOne({ email: user.email.toLowerCase() });
    if (!targetUser) {
      return { success: false, message: 'User not found' };
    }

    // Downgrade to free
    await targetUser.downgradeToFree();

    // Cancel active subscription
    await Subscription.findOneAndUpdate(
      { userId: targetUser._id, status: 'active' },
      {
        status: 'cancelled',
        cancelledAt: new Date()
      }
    );

    return {
      success: true,
      message: 'REFUND processed - Downgraded to free plan',
      userId: targetUser._id,
      email: targetUser.email,
      plan: 'free'
    };
  }

  // Process CHARGEBACK action
  async handleChargeback(payload) {
    const { user, transaction_id } = payload;

    const targetUser = await User.findOne({ email: user.email.toLowerCase() });
    if (!targetUser) {
      return { success: false, message: 'User not found' };
    }

    // Suspend user account
    await targetUser.suspend('Chargeback - Payment dispute');

    // Cancel subscription
    await Subscription.findOneAndUpdate(
      { userId: targetUser._id, status: 'active' },
      {
        status: 'suspended',
        suspendedReason: 'Chargeback'
      }
    );

    return {
      success: true,
      message: 'CHARGEBACK processed - User suspended',
      userId: targetUser._id,
      email: targetUser.email,
      status: 'suspended'
    };
  }

  // Process CANCEL action
  async handleCancel(payload) {
    const { user, transaction_id } = payload;

    const targetUser = await User.findOne({ email: user.email.toLowerCase() });
    if (!targetUser) {
      return { success: false, message: 'User not found' };
    }

    // Downgrade to free but keep access until end of billing period
    await targetUser.downgradeToFree();

    // Cancel subscription
    await Subscription.findOneAndUpdate(
      { userId: targetUser._id, status: 'active' },
      {
        status: 'cancelled',
        cancelledAt: new Date()
      }
    );

    return {
      success: true,
      message: 'CANCEL processed - Downgraded to free plan',
      userId: targetUser._id,
      email: targetUser.email,
      plan: 'free'
    };
  }

  // Process REBILL action
  async handleRebill(payload) {
    const { user, product_id, total_amount, transaction_id } = payload;
    const planInfo = await this.getPlanFromProductId(product_id);

    const targetUser = await User.findOne({ email: user.email.toLowerCase() });
    if (!targetUser) {
      return { success: false, message: 'User not found' };
    }

    // Extend subscription
    const subscription = await Subscription.findOne({
      userId: targetUser._id,
      status: 'active'
    });

    if (subscription) {
      await subscription.extend(30);
    }

    // Ensure user is on correct plan
    await targetUser.upgradePlan(planInfo.planId);

    return {
      success: true,
      message: 'REBILL processed - Subscription extended',
      userId: targetUser._id,
      email: targetUser.email,
      plan: planInfo.planId,
      newEndDate: subscription?.endDate
    };
  }

  // Main process method
  async processWebhook(payload) {
    const { transaction_id, action } = payload;

    // Check for duplicate
    if (await this.isDuplicateTransaction(transaction_id)) {
      await this.logTransaction(payload, 'duplicate', { message: 'Duplicate transaction' });
      return {
        success: true,
        duplicate: true,
        message: 'Transaction already processed'
      };
    }

    let result;
    let response;

    try {
      switch (action.toUpperCase()) {
        case 'SALE':
        case 'PURCHASE':
          result = await this.handleSale(payload);
          break;

        case 'REFUND':
          result = await this.handleRefund(payload);
          break;

        case 'CHARGEBACK':
          result = await this.handleChargeback(payload);
          break;

        case 'CANCEL':
          result = await this.handleCancel(payload);
          break;

        case 'REBILL':
          result = await this.handleRebill(payload);
          break;

        case 'UPSELL':
          // Treat upsell as sale
          result = await this.handleSale(payload);
          break;

        case 'DOWNGRADE':
          // Treat downgrade as cancel
          result = await this.handleCancel(payload);
          break;

        default:
          result = {
            success: false,
            message: `Unknown action: ${action}`
          };
      }

      // Log successful transaction
      response = {
        success: result.success,
        message: result.message,
        userId: result.userId,
        data: {
          email: result.email,
          plan: result.plan,
          status: result.status,
          newEndDate: result.newEndDate
        }
      };

      await this.logTransaction(payload, 'processed', response);

      return response;

    } catch (error) {
      console.error(`[IPN] Error processing ${action}:`, error);

      response = {
        success: false,
        message: error.message
      };

      await this.logTransaction(payload, 'failed', response, error.message);

      throw error;
    }
  }
}

// Export singleton instance
const ipnService = new IPNService();

module.exports = ipnService;
