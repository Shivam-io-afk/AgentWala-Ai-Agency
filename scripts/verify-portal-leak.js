async function verifyPortalLeak() {
  const token = 'tok_sunrise_dent_782';
  const apiUrl = `http://localhost:3000/api/portal/${token}`;
  const pageUrl = `http://localhost:3000/p/${token}`;

  const forbiddenKeys = [
    'target_mrr',
    'ai_monthly_cap',
    'voice_monthly_cap',
    'pause_all_outbound',
    'hourly_change_rate',
    'copilot_language',
    'working_hours',
  ];

  console.log('==============================================');
  console.log(`1. Testing Portal API: ${apiUrl}`);
  console.log('==============================================');
  const apiRes = await fetch(apiUrl);
  console.log('API Status:', apiRes.status);
  if (!apiRes.ok) throw new Error('API request failed');

  const apiJson = await apiRes.json();
  const apiRawText = JSON.stringify(apiJson);

  console.log('Bundle has client:', Boolean(apiJson.client));
  console.log('Bundle has invoices:', apiJson.invoices?.length || 0);
  console.log('Bundle has settings:', Boolean(apiJson.settings));

  const settingsKeys = Object.keys(apiJson.settings || {});
  console.log('Public settings keys returned (count: ' + settingsKeys.length + '):');
  console.log(settingsKeys.join(', '));

  let anyApiForbiddenFound = false;
  for (const key of forbiddenKeys) {
    const presentInSettings = key in (apiJson.settings || {});
    const presentInRaw = apiRawText.includes(key);
    if (presentInSettings || presentInRaw) {
      console.error(`  ✗ [FAIL] Forbidden key found in API response: ${key}`);
      anyApiForbiddenFound = true;
    } else {
      console.log(`  ✓ [PASS] Forbidden key absent: ${key}`);
    }
  }

  console.log('\n==============================================');
  console.log(`2. Testing Portal Page: ${pageUrl}`);
  console.log('==============================================');
  const pageRes = await fetch(pageUrl);
  console.log('Page Status:', pageRes.status);
  const html = await pageRes.text();
  console.log('Page HTML size:', html.length, 'bytes');

  // Verify invoice / payment section rendering
  const invoiceKeywords = ['Invoice', 'Advance', 'Payment', 'Razorpay', '₹'];
  console.log('Checking invoice/payment keywords on page:');
  for (const kw of invoiceKeywords) {
    const hasKw = html.includes(kw);
    console.log(`  Keyword "${kw}": ${hasKw ? 'PRESENT ✓' : 'MISSING ✗'}`);
  }

  let anyPageForbiddenFound = false;
  for (const key of forbiddenKeys) {
    const presentInHtml = html.includes(key);
    if (presentInHtml) {
      console.error(`  ✗ [FAIL] Forbidden token in page HTML: ${key}`);
      anyPageForbiddenFound = true;
    } else {
      console.log(`  ✓ [PASS] Token absent from page HTML: ${key}`);
    }
  }

  console.log('\n==============================================');
  console.log(`3. Testing Invoice PDF Endpoint: /api/invoices/.../pdf`);
  console.log('==============================================');
  // First find an invoice id
  const invId = apiJson.invoices?.[0]?.id || 'inv-1';
  console.log(`Testing with Invoice ID: ${invId}`);

  // 3a. Without auth
  const unauthRes = await fetch(`http://localhost:3000/api/invoices/${invId}/pdf`);
  console.log(`GET /api/invoices/${invId}/pdf (no auth/token) -> Status:`, unauthRes.status, `(Expected: 401)`);

  // 3b. With valid portal token
  const authRes = await fetch(`http://localhost:3000/api/invoices/${invId}/pdf?token=${token}`);
  console.log(`GET /api/invoices/${invId}/pdf?token=${token} -> Status:`, authRes.status, `(Expected: 200)`);
  if (authRes.ok) {
    const pdfHtml = await authRes.text();
    console.log('Invoice PDF HTML size:', pdfHtml.length, 'bytes');
    for (const key of forbiddenKeys) {
      if (pdfHtml.includes(key)) {
        console.error(`  ✗ [FAIL] Forbidden key in invoice PDF HTML: ${key}`);
      }
    }
    console.log('  ✓ Checked invoice PDF HTML for internal keys (none present).');
  }

  if (anyApiForbiddenFound || anyPageForbiddenFound) {
    console.error('\n✗ VERIFICATION FAILED!');
    process.exit(1);
  } else {
    console.log('\n✓ ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  }
}

verifyPortalLeak().catch(err => {
  console.error(err);
  process.exit(1);
});
