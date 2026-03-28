const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Webhook name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  url: {
    type: String,
    required: [true, 'Webhook URL is required'],
    trim: true,
    match: [/^https?:\/\/.+/, 'Please enter a valid URL']
  },
  secret: {
    type: String,
    default: null,
    select: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  events: [{
    type: String,
    enum: ['payment.completed', 'payment.failed', 'subscription.created', 'subscription.upgraded', 'subscription.cancelled']
  }],
  headers: {
    type: Map,
    of: String,
    default: new Map()
  },
  lastTriggered: {
    type: Date,
    default: null
  },
  lastStatus: {
    type: String,
    enum: ['success', 'failed', null],
    default: null
  },
  lastResponse: {
    type: String,
    default: null
  },
  triggerCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index
webhookSchema.index({ url: 1 });
webhookSchema.index({ isActive: 1 });

// Generate a secret for the webhook
webhookSchema.methods.generateSecret = function() {
  const crypto = require('crypto');
  const secret = crypto.randomBytes(32).toString('hex');
  this.secret = secret;
  return secret;
};

// Validate secret
webhookSchema.methods.validateSecret = function(incomingSecret) {
  if (!this.secret) return false;
  const crypto = require('crypto');
  const hash = crypto.createHmac('sha256', this.secret).digest('hex');
  return hash === incomingSecret;
};

module.exports = mongoose.model('Webhook', webhookSchema);
