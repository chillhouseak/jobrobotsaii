import mongoose from 'mongoose';
import IPNTransaction from '../backend/models/IPNTransaction.js';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI not set in Vercel project settings');
  if (mongoose.connection.readyState) return;
  await mongoose.connect(uri, { bufferCommands: false });
};

export const setCors = (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query || {};
  const { method, body } = req;

  try {
    await connectDB();
  } catch (e) {
    return res.status(503).json({ success: false, message: e.message });
  }

  try {
    // Health
    if (action === 'health' && method === 'GET') {
      return res.status(200).json({ success: true, message: 'Webhook endpoint healthy', timestamp: new Date().toISOString() });
    }

    // IPN
    if (action === 'ipn' && method === 'POST') {
      const { transaction_id, action: ipnAction, user: userId, total_amount, product_id } = body || {};
      console.log(`[IPN] ${ipnAction} - ${transaction_id}`);

      await IPNTransaction.create({
        transactionId: transaction_id,
        action: ipnAction,
        userId,
        amount: total_amount,
        productId: product_id,
        status: 'received',
        rawBody: body
      });

      return res.status(200).json({ success: true, message: 'IPN received' });
    }

    return res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
