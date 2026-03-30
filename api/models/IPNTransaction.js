import mongoose from 'mongoose';

const ipnTransactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  action: { type: String, required: true, enum: ['SALE', 'PURCHASE', 'REFUND', 'CHARGEBACK', 'CANCEL', 'REBILL', 'UPSELL', 'DOWNGRADE', 'OTHER'], uppercase: true },
  productId: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  userEmail: { type: String, required: true, lowercase: true },
  userName: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  planId: { type: String },
  status: { type: String, enum: ['pending', 'processed', 'failed', 'duplicate'], default: 'pending' },
  rawPayload: { type: mongoose.Schema.Types.Mixed },
  response: { type: mongoose.Schema.Types.Mixed },
  errorMessage: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  processedAt: { type: Date }
}, { timestamps: true });

ipnTransactionSchema.index({ userEmail: 1 });
ipnTransactionSchema.index({ createdAt: -1 });
ipnTransactionSchema.index({ status: 1, action: 1 });

ipnTransactionSchema.virtual('isDuplicate').get(function() {
  return this.status === 'duplicate';
});

const IPNTransaction = mongoose.model('IPNTransaction', ipnTransactionSchema);
export default IPNTransaction;
