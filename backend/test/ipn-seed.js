/**
 * IPN Product Mappings Seeder
 * Seeds the IPNMapping collection with LaunchpadJV product IDs
 *
 * Usage:
 *   node test/ipn-seed.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const IPNMapping = require('../models/IPNMapping');

const productMappings = [
  {
    productId: 1790,
    planId: 'standard',
    planName: 'Standard Plan',
    productName: 'JobRobots AI Standard',
    price: 19,
    isActive: true
  },
  {
    productId: 1791,
    planId: 'unlimited',
    planName: 'Unlimited Plan',
    productName: 'JobRobots AI Unlimited',
    price: 49,
    isActive: true
  },
  {
    productId: 1792,
    planId: 'agency',
    planName: 'Agency Plan',
    productName: 'JobRobots AI Agency',
    price: 149,
    isActive: true
  }
];

async function seedMappings() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📦 Seeding product mappings...\n');

    for (const mapping of productMappings) {
      const existing = await IPNMapping.findOne({ productId: mapping.productId });

      if (existing) {
        await IPNMapping.updateOne(
          { productId: mapping.productId },
          mapping
        );
        console.log(`   🔄 Updated: ${mapping.productName} (ID: ${mapping.productId})`);
      } else {
        await IPNMapping.create(mapping);
        console.log(`   ✅ Created: ${mapping.productName} (ID: ${mapping.productId})`);
      }
    }

    console.log('\n📋 Current mappings:');
    const allMappings = await IPNMapping.find({}).sort({ productId: 1 });
    console.log(allMappings.map(m =>
      `   ${m.productId} → ${m.planId} ($${m.price})`
    ).join('\n'));

    console.log('\n✨ Seeding complete!');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedMappings();
