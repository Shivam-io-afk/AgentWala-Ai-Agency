async function verifyHtmlLeak() {
  const forbidden = [
    'account_number',
    'ifsc',
    'upi_id',
    '"pan"',
    'gstin',
    'target_mrr',
    'ai_monthly_cap',
    'pause_all_outbound',
  ];

  const urls = [
    'http://localhost:3000/',
    'http://localhost:3000/salons',
  ];

  let anyFailed = false;

  for (const url of urls) {
    console.log(`\n========================================`);
    console.log(`Testing URL: ${url}`);
    console.log(`========================================`);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: status ${res.status}`);
    }
    const html = await res.text();
    console.log(`HTML size: ${html.length} bytes`);

    for (const token of forbidden) {
      const found = html.includes(token);
      if (found) {
        console.error(`  ✗ [FAIL] Leaked token detected: ${token}`);
        anyFailed = true;
      } else {
        console.log(`  ✓ [PASS] Token absent: ${token}`);
      }
    }

    // Verify pricing section and prices
    const prices = ['₹7,999', '₹19,999', '₹49,999', '₹24,999', '₹59,999', '₹99,999', '₹2,99,999'];
    console.log('\nChecking pricing displays:');
    for (const price of prices) {
      const found = html.includes(price);
      console.log(`  Price ${price}: ${found ? 'PRESENT ✓' : 'NOT FOUND ✗'}`);
      if (!found) anyFailed = true;
    }
  }

  // Verify /api/public/pricing
  console.log('\n========================================');
  console.log('Testing /api/public/pricing');
  console.log('========================================');
  const pricingRes = await fetch('http://localhost:3000/api/public/pricing');
  console.log('Status:', pricingRes.status);
  console.log('Cache-Control:', pricingRes.headers.get('cache-control'));
  const json = await pricingRes.json();
  console.log('Payload:', JSON.stringify(json));
  if (json.success !== true || !json.package_prices) {
    console.error('Invalid pricing payload');
    anyFailed = true;
  }

  if (anyFailed) {
    console.error('\n✗ VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('\n✓ ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  }
}

verifyHtmlLeak().catch(err => {
  console.error(err);
  process.exit(1);
});
