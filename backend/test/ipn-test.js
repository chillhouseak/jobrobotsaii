/**
 * IPN Webhook Test Script
 * Tests all webhook actions: SALE, PURCHASE, REFUND, CHARGEBACK, CANCEL, REBILL
 *
 * Usage:
 *   node test/ipn-test.js [action]
 *
 * Examples:
 *   node test/ipn-test.js SALE          # Test sale
 *   node test/ipn-test.js all            # Test all actions
 *   node test/ipn-test.js PURCHASE       # Test purchase
 */

const http = require('http');

const WEBHOOK_URL = 'http://localhost:5001/api/webhooks/ipn';
const TEST_EMAIL = `test_${Date.now()}@example.com`;

// Test payloads for each action
const testPayloads = {
  SALE: {
    transaction_id: `test_sale_${Date.now()}`,
    product_id: 1790,
    action: 'SALE',
    total_amount: 49.00,
    user: {
      email: TEST_EMAIL,
      name: 'Test User Sale'
    }
  },

  PURCHASE: {
    transaction_id: `test_purchase_${Date.now()}`,
    product_id: 1791,
    action: 'PURCHASE',
    total_amount: 149.00,
    user: {
      email: TEST_EMAIL,
      name: 'Test User Purchase'
    }
  },

  REBILL: {
    transaction_id: `test_rebill_${Date.now()}`,
    product_id: 1790,
    action: 'REBILL',
    total_amount: 49.00,
    user: {
      email: TEST_EMAIL,
      name: 'Test User Rebill'
    }
  },

  REFUND: {
    transaction_id: `test_refund_${Date.now()}`,
    product_id: 1790,
    action: 'REFUND',
    total_amount: 49.00,
    user: {
      email: TEST_EMAIL,
      name: 'Test User Refund'
    }
  },

  CANCEL: {
    transaction_id: `test_cancel_${Date.now()}`,
    product_id: 1790,
    action: 'CANCEL',
    total_amount: 49.00,
    user: {
      email: TEST_EMAIL,
      name: 'Test User Cancel'
    }
  },

  CHARGEBACK: {
    transaction_id: `test_chargeback_${Date.now()}`,
    product_id: 1790,
    action: 'CHARGEBACK',
    total_amount: 49.00,
    user: {
      email: TEST_EMAIL,
      name: 'Test User Chargeback'
    }
  },

  UPSELL: {
    transaction_id: `test_upsell_${Date.now()}`,
    product_id: 1792,
    action: 'UPSELL',
    total_amount: 79.00,
    user: {
      email: TEST_EMAIL,
      name: 'Test User Upsell'
    }
  },

  DUPLICATE: {
    transaction_id: `test_duplicate_${Date.now()}`,
    product_id: 1790,
    action: 'SALE',
    total_amount: 49.00,
    user: {
      email: TEST_EMAIL,
      name: 'Test User Duplicate'
    }
  }
};

// Send webhook request
function sendWebhook(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);

    const options = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/webhooks/ipn',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-Forwarded-For': '65.108.6.37' // Simulate LaunchpadJV IP
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(responseData)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Run single test
async function runTest(action) {
  const payload = testPayloads[action];

  if (!payload) {
    console.log(`❌ Unknown action: ${action}`);
    console.log(`   Available: ${Object.keys(testPayloads).join(', ')}`);
    return;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing: ${action}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📤 Payload:`, JSON.stringify(payload, null, 2));

  try {
    const result = await sendWebhook(payload);
    console.log(`\n📥 Response (${result.status}):`);
    console.log(JSON.stringify(result.data, null, 2));

    if (result.status === 200 && result.data.success) {
      console.log(`\n✅ ${action} test PASSED`);
    } else {
      console.log(`\n❌ ${action} test FAILED`);
    }
  } catch (error) {
    console.log(`\n❌ ${action} test ERROR:`, error.message);
  }
}

// Run all tests sequentially
async function runAllTests() {
  console.log('\n🚀 Starting IPN Webhook Tests\n');
  console.log(`📧 Test Email: ${TEST_EMAIL}`);
  console.log(`🔗 URL: ${WEBHOOK_URL}\n`);

  const actions = ['SALE', 'REBILL', 'REFUND', 'CANCEL', 'CHARGEBACK', 'DUPLICATE'];

  for (const action of actions) {
    await runTest(action);
    await new Promise(r => setTimeout(r, 500)); // Delay between tests
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 All Tests Complete');
  console.log('='.repeat(60));
}

// Validate payload test
async function runValidationTests() {
  console.log('\n🔍 Testing Payload Validation\n');

  const invalidPayloads = [
    { action: 'SALE' },                    // Missing transaction_id
    { transaction_id: 'test', action: 'INVALID' },  // Invalid action
    { transaction_id: 'test', action: 'SALE' },       // Missing user.email
  ];

  for (const payload of invalidPayloads) {
    try {
      const result = await sendWebhook(payload);
      console.log(`❌ Expected validation error (got ${result.status}):`, payload);
    } catch (error) {
      console.log(`✅ Validation working:`, error.message);
    }
  }
}

// Main
const action = process.argv[2]?.toUpperCase();

if (!action || action === 'ALL') {
  runAllTests();
} else if (action === 'VALIDATION') {
  runValidationTests();
} else {
  runTest(action);
}
