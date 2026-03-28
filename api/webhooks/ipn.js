import connectDB from '../_lib/db';
import User from '../../backend/models/User';
import Subscription from '../../backend/models/Subscription';
import IPNTransaction from '../../backend/models/IPNTransaction';
import IPNMapping from '../../backend/models/IPNMapping';

const WHITELIST_IPS = ['65.108.6.37'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.connection?.remoteAddress
    || 'unknown';

  if (!WHITELIST_IPS.includes(clientIP)) {
    console.error(`IPN: Unauthorized IP ${clientIP}`);
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  await connectDB();

  const { customer_id, plan_id, status, transaction_id, refund_id } = req.body;

  console.log('IPN received:', req.body);

  try {
    const ipnRecord = await IPNTransaction.findOne({ transactionId: transaction_id });
    if (ipnRecord) {
      console.log('IPN: Duplicate transaction, skipping');
      return res.json({ success: true, message: 'Duplicate transaction' });
    }

    await IPNTransaction.create({
      customerId: customer_id,
      planId: plan_id,
      status,
      transactionId: transaction_id,
      rawData: req.body,
      ipAddress: clientIP
    });

    const user = await User.findOne({
      $or: [
        { launchpadCustomerId: customer_id },
        { stripeCustomerId: customer_id }
      ]
    });

    if (!user) {
      console.error('IPN: User not found for customer_id:', customer_id);
      return res.json({ success: true, message: 'User not found' });
    }

    const mapping = await IPNMapping.findOne({ launchpadProductId: plan_id });

    switch (status) {
      case 'SALE':
      case 'PURCHASE': {
        const plan = mapping?.planId || 'standard';
        await user.upgradePlan(plan);
        console.log(`IPN: User ${user.email} upgraded to ${plan}`);
        break;
      }
      case 'REBILL': {
        const plan = mapping?.planId || 'standard';
        await user.upgradePlan(plan);
        console.log(`IPN: User ${user.email} rebilled, plan ${plan}`);
        break;
      }
      case 'CANCEL':
      case 'REFUND': {
        await user.downgradeToFree();
        console.log(`IPN: User ${user.email} cancelled/refunded, downgraded to free`);
        break;
      }
      case 'CHARGEBACK': {
        await user.suspend('Chargeback received');
        console.log(`IPN: User ${user.email} suspended due to chargeback`);
        break;
      }
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('IPN processing error:', error);
    return res.status(500).json({ success: false, message: 'Processing error' });
  }
}
