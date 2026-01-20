const { calculateQuote } = require('./utils/pricing-calculator');

console.log('🧪 Testing Buildcert Pricing Engine\n');

// Test 1: Swimming Pool - Gold - CDC
console.log('Test 1: Swimming Pool - Gold - CDC - $50,000');
try {
  const result1 = calculateQuote({
    client_category: 'Gold',
    development_type: 'Swimming Pool',
    approval_type: 'CDC',
    cost_of_works: 50000
  });
  console.log('✅ PASS');
  console.log(`   Subtotal: $${result1.subtotal}`);
  console.log(`   GST: $${result1.gst}`);
  console.log(`   Total: $${result1.total}`);
  console.log(`   Line items: ${result1.line_items.length}`);
} catch (error) {
  console.log('❌ FAIL:', error.message);
}

console.log('\nTest 2: Single Dwelling - Platinum - CC - $250,000');
try {
  const result2 = calculateQuote({
    client_category: 'Platinum',
    development_type: 'Single Dwelling',
    approval_type: 'CC',
    cost_of_works: 250000
  });
  console.log('✅ PASS');
  console.log(`   Subtotal: $${result2.subtotal}`);
  console.log(`   GST: $${result2.gst}`);
  console.log(`   Total: $${result2.total}`);
  console.log(`   Line items: ${result2.line_items.length}`);
} catch (error) {
  console.log('❌ FAIL:', error.message);
}

console.log('\nTest 3: Alterations & Additions - Silver - CDC - $100,000');
try {
  const result3 = calculateQuote({
    client_category: 'Silver',
    development_type: 'Alterations & Additions',
    approval_type: 'CDC',
    cost_of_works: 100000
  });
  console.log('✅ PASS');
  console.log(`   Subtotal: $${result3.subtotal}`);
  console.log(`   GST: $${result3.gst}`);
  console.log(`   Total: $${result3.total}`);
  console.log(`   Line items: ${result3.line_items.length}`);
} catch (error) {
  console.log('❌ FAIL:', error.message);
}

console.log('\nTest 4: Missing parameter (should fail gracefully)');
try {
  const result4 = calculateQuote({
    client_category: 'Gold',
    development_type: 'Swimming Pool'
    // Missing approval_type and cost_of_works
  });
  console.log('❌ FAIL: Should have thrown error');
} catch (error) {
  console.log('✅ PASS: Correctly caught error:', error.message);
}

console.log('\n✅ All tests complete!');
