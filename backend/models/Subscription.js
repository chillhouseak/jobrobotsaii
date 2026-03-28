const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  planId: {
    type: String,
    required: true,
    enum: ['free', 'standard', 'unlimited', 'agency'],
    default: 'free'
  },
  planName: {
    type: String,
    required: true,
    default: 'Free'
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'suspended', 'expired', 'pending'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  nextBillingDate: {
    type: Date
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly', 'lifetime'],
    default: 'monthly'
  },
  transactionId: {
    type: String
  },
  productId: {
    type: Number
  },
  amount: {
    type: Number
  },
  currency: {
    type: String,
    default: 'USD'
  },
  createdVia: {
    type: String,
    enum: ['webhook', 'manual', 'admin', 'trial'],
    default: 'webhook'
  },
  suspendedReason: {
    type: String
  },
  cancelledAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Compound indexes
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ userId: 1, planId: 1 });
subscriptionSchema.index({ status: 1, endDate: 1 });

// Virtual to check if subscription is valid
subscriptionSchema.virtual('isValid').get(function() {
  if (this.status !== 'active') return false;
  if (this.endDate && new Date() > this.endDate) return false;
  return true;
});

// Method to extend subscription
subscriptionSchema.methods.extend = async function(days = 30) {
  if (this.endDate) {
    this.endDate = new Date(this.endDate.getTime() + days * 24 * 60 * 60 * 1000);
  } else {
    this.endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  this.nextBillingDate = this.endDate;
  return this.save();
};

// Static method to get active subscription for user
subscriptionSchema.statics.getActiveForUser = async function(userId) {
  return this.findOne({
    userId,
    status: 'active'
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
