const fs = require('fs');
const { spawn } = require('child_process');

// 1. Read .env.local
const envPath = '.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');

let resendKey = null;
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) {
    const idx = t.indexOf('=');
    const k = t.slice(0, idx).trim();
    const v = t.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (k === 'RESEND_API_KEY') {
      resendKey = v;
    }
  }
}

if (!resendKey) {
  console.error('ERROR: RESEND_API_KEY not found in .env.local!');
  process.exit(1);
}
console.log('✓ Found RESEND_API_KEY in .env.local (length: ' + resendKey.length + ')');

// 2. Append EMAIL_FROM to .env.local if not present
const emailFromVal = 'Agmeta <onboarding@resend.dev>';
if (!envContent.includes('EMAIL_FROM=')) {
  const lineToAdd = (envContent.endsWith('\n') ? '' : '\n') + `EMAIL_FROM=${emailFromVal}\n`;
  fs.appendFileSync(envPath, lineToAdd);
  console.log('✓ Appended EMAIL_FROM=' + emailFromVal + ' to .env.local');
} else {
  console.log('✓ EMAIL_FROM already present in .env.local');
}

// 3. Helper to run vercel env add with stdin
function addEnv(name, envTarget, val, isSensitive) {
  return new Promise((resolve, reject) => {
    // We try positional first as user wrote: vercel env add <name> <env> --sensitive
    // and fallback to --environment <env> if needed.
    const args = [
      '/c',
      'vercel',
      'env',
      'add',
      name,
      envTarget,
      isSensitive ? '--sensitive' : '--no-sensitive',
      '--yes',
    ];

    console.log(`Adding ${name} to ${envTarget} (${isSensitive ? 'sensitive' : 'plain'})...`);
    const proc = spawn('cmd.exe', args, { stdio: ['pipe', 'pipe', 'pipe'] });

    proc.stdin.write(val);
    proc.stdin.end();

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', d => { stdout += d; });
    proc.stderr.on('data', d => { stderr += d; });

    proc.on('close', code => {
      const combined = stdout + ' ' + stderr;
      if (code === 0) {
        console.log(`✓ Added ${name} to ${envTarget} successfully.`);
        resolve();
      } else if (combined.includes('already exists') || combined.includes('already added')) {
        console.log(`Skipped ${name} for ${envTarget}: already exists.`);
        resolve();
      } else {
        const safeErr = (stderr || stdout).replace(new RegExp(resendKey, 'g'), '[REDACTED]');
        console.error(`Failed to add ${name} to ${envTarget} (exit code ${code}):`, safeErr);
        reject(new Error(`Failed to add ${name} to ${envTarget}`));
      }
    });
  });
}

async function main() {
  // Step 1: Add RESEND_API_KEY to production and preview
  await addEnv('RESEND_API_KEY', 'production', resendKey, true);
  await addEnv('RESEND_API_KEY', 'preview', resendKey, true);

  // Step 2: Add EMAIL_FROM to production and preview
  await addEnv('EMAIL_FROM', 'production', emailFromVal, false);
  await addEnv('EMAIL_FROM', 'preview', emailFromVal, false);

  console.log('\nAll environment variables added successfully!');
}

main().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});

