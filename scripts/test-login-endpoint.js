async function testLogin() {
  const res = await fetch('https://agent-wala-ai-agency.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'shivam.mishra.cuh@gmail.com' }),
  });

  console.log('Status code:', res.status);
  const data = await res.json().catch(() => ({}));
  console.log('Response success:', data.success);
  console.log('Response message:', data.message);
  if (data.token || data.verifyUrl) {
    console.log('[WARNING] Token or verifyUrl unexpectedly returned in production!');
  }
}

testLogin().catch(err => console.error(err));

