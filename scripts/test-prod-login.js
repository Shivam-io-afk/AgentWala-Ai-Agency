const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) {
    const idx = t.indexOf('=');
    const k = t.slice(0, idx).trim();
    const v = t.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    env[k] = v;
  }
}

const baseUrl = 'https://agent-wala-ai-agency.vercel.app';
const email = (env.FOUNDER_EMAILS || '').split(',')[0].trim();
const code = (env.FOUNDER_LOGIN_CODE || '').trim();

async function run() {
  console.log('==================================================');
  console.log('    PRODUCTION FOUNDER LOGIN & SMOKE TEST         ');
  console.log('==================================================');
  console.log('Production URL:', baseUrl);
  console.log('Founder email:', email);

  // 1. POST /api/auth/verify
  console.log('\n--- STEP 1: Founder Login ---');
  const loginRes = await fetch(baseUrl + '/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  console.log('POST /api/auth/verify -> Status:', loginRes.status);
  const loginText = await loginRes.text();
  let loginJson = null;
  try { loginJson = JSON.parse(loginText); } catch {}
  console.log('Login Response:', loginJson || loginText.slice(0, 200));

  const setCookie = loginRes.headers.get('set-cookie');
  if (!setCookie) {
    console.error('Failed to obtain Set-Cookie from production login!');
    return;
  }
  console.log('Set-Cookie received: YES (session token present)');

  const cookieVal = setCookie.split(';')[0];

  // 2. GET /api/admin/clients with cookie
  console.log('\n--- STEP 2: Authenticated Client List ---');
  const getRes = await fetch(baseUrl + '/api/admin/clients', {
    method: 'GET',
    headers: { Cookie: cookieVal },
  });
  console.log('GET /api/admin/clients -> Status:', getRes.status, '(Note: route only defines POST, dashboard data uses /api/admin/data)');

  // Also query /api/admin/data to get the complete client list from the app
  const dataRes = await fetch(baseUrl + '/api/admin/data', {
    method: 'GET',
    headers: { Cookie: cookieVal },
  });
  console.log('GET /api/admin/data -> Status:', dataRes.status);
  const dataJson = await dataRes.json().catch(() => ({}));
  const clients = dataJson.clients || [];
  console.log('Total clients returned:', clients.length);
  console.log('Client names:');
  clients.forEach((c, i) => {
    console.log(`  ${i + 1}. [${c.id}] ${c.name}`);
  });

  // 3. Delete 'DELETE ME Preview Test' if found
  console.log('\n--- STEP 3: Delete Test Client Check ---');
  const targetToDelete = clients.find(c => c.name && (c.name.includes('DELETE ME') || c.name.includes('Preview Test')));
  if (targetToDelete) {
    console.log('Found target client to delete:', targetToDelete.id, targetToDelete.name);
    const delRes = await fetch(baseUrl + '/api/admin/clients/' + targetToDelete.id, {
      method: 'DELETE',
      headers: { Cookie: cookieVal },
    });
    console.log('DELETE /api/admin/clients/' + targetToDelete.id + ' -> Status:', delRes.status);
    const delJson = await delRes.json().catch(() => ({}));
    console.log('Delete result:', delJson);

    // Re-check count
    const afterRes = await fetch(baseUrl + '/api/admin/data', {
      headers: { Cookie: cookieVal },
    });
    const afterJson = await afterRes.json().catch(() => ({}));
    const afterClients = afterJson.clients || [];
    console.log('Client count after deletion:', afterClients.length);
  } else {
    console.log('No client named "DELETE ME Preview Test" found in database.');
    console.log('Current client count remains:', clients.length);
  }

  // 4. Smoke Test on Production
  console.log('\n--- STEP 4: Smoke Test (Status Codes) ---');
  // GET /
  const homeRes = await fetch(baseUrl + '/', { redirect: 'manual' });
  console.log('GET / -> Status:', homeRes.status);

  // GET /admin without cookie (expect 307 redirect to /login)
  const adminRes = await fetch(baseUrl + '/admin', { redirect: 'manual' });
  console.log('GET /admin (no cookie) -> Status:', adminRes.status, 'Location:', adminRes.headers.get('location'));

  // GET /api/admin/clients without cookie (expect 401)
  const unauthApiRes = await fetch(baseUrl + '/api/admin/clients', { redirect: 'manual' });
  console.log('GET /api/admin/clients (no cookie) -> Status:', unauthApiRes.status);

  console.log('\n==================================================');
  console.log('    PRODUCTION VERIFICATION SUITE FINISHED        ');
  console.log('==================================================');
}

run().catch(e => console.error('Error during production test:', e));

