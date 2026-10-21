const fs = require('fs');

async function testTelemetry() {
  const publicRoutes = [
    'http://localhost:3000/',
    'http://localhost:3000/salons',
    'http://localhost:3000/privacy',
    'http://localhost:3000/login',
    'http://localhost:3000/p/tok_sunrise_dent_782',
  ];

  const telemetryTokens = [
    'Network Telemetry',
    'Real-time Telemetry',
    'bottom-3 right-3',
    'REQ SENDING',
    'WAITING RESP',
  ];

  console.log('==============================================');
  console.log('1. Checking Public Routes (Expect NO pill)');
  console.log('==============================================');

  let anyPublicFailed = false;
  for (const url of publicRoutes) {
    const res = await fetch(url);
    const html = await res.text();
    console.log(`\nURL: ${url} (status: ${res.status}, size: ${html.length})`);

    let foundToken = false;
    for (const token of telemetryTokens) {
      if (html.includes(token)) {
        console.error(`  ✗ [FAIL] Found telemetry token "${token}" in ${url}`);
        foundToken = true;
      }
    }
    if (!foundToken) {
      console.log(`  ✓ [PASS] Zero telemetry pill tokens found in DOM`);
    } else {
      anyPublicFailed = true;
    }
  }

  console.log('\n==============================================');
  console.log('2. Checking /admin Page (Expect pill present)');
  console.log('==============================================');

  // Read login credentials from .env.local to get cookie
  const envContent = fs.readFileSync('.env.local', 'utf8');
  let email = '';
  let code = '';
  for (const line of envContent.split('\n')) {
    const t = line.trim();
    if (t.startsWith('FOUNDER_EMAILS=')) email = t.split('=')[1].split(',')[0].trim();
    if (t.startsWith('FOUNDER_LOGIN_CODE=')) code = t.split('=')[1].trim();
  }

  const loginRes = await fetch('http://localhost:3000/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  const cookie = loginRes.headers.get('set-cookie');
  if (!cookie) {
    throw new Error('Failed to get session cookie from login');
  }

  const adminRes = await fetch('http://localhost:3000/admin', {
    headers: { Cookie: cookie.split(';')[0] },
  });

  const adminHtml = await adminRes.text();
  console.log(`URL: http://localhost:3000/admin (status: ${adminRes.status}, size: ${adminHtml.length})`);

  let adminHasPill = false;
  for (const token of telemetryTokens) {
    if (adminHtml.includes(token)) {
      console.log(`  ✓ [PASS] Found expected telemetry token "${token}" on /admin`);
      adminHasPill = true;
    }
  }

  if (!adminHasPill) {
    console.error('  ✗ [FAIL] Telemetry pill not found in /admin DOM!');
  }

  if (anyPublicFailed || !adminHasPill) {
    console.error('\n✗ VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('\n✓ ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  }
}

testTelemetry().catch(err => {
  console.error(err);
  process.exit(1);
});
