import mongoose from 'mongoose';
import crypto from 'crypto';

const webhookSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true, match: [/^https?:\/\/.+/, 'Invalid URL'] },
  secret: { type: String, default: null, select: false },
  isActive: { type: Boolean, default: true },
  events: [{ type: String, enum: ['payment.completed', 'payment.failed', 'subscription.created', 'subscription.upgraded', 'subscription.cancelled'] }],
  headers: { type: Map, of: String, default: new Map() },
  lastTriggered: { type: Date, default: null },
  lastStatus: { type: String, enum: ['success', 'failed', null], default: null },
  lastResponse: { type: String, default: null },
  triggerCount: { type: Number, default: 0 },
  failureCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null }
}, { timestamps: true });

webhookSchema.index({ url: 1 });
webhookSchema.index({ isActive: 1 });

webhookSchema.methods.generateSecret = function() {
  this.secret = crypto.randomBytes(32).toString('hex');
  return this.secret;
};

webhookSchema.methods.validateSecret = function(incomingSecret) {
  if (!this.secret) return false;
  const hash = crypto.createHmac('sha256', this.secret).digest('hex');
  return hash === incomingSecret;
};

const Webhook = mongoose.model('Webhook', webhookSchema);
export default Webhook;
