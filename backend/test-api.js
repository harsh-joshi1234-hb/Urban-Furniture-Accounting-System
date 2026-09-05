const assert = require('assert');

async function run() {
  console.log('Testing /api/health...');
  let res = await fetch('http://localhost:5000/api/health');
  let data = await res.json();
  assert.equal(data.success, true);
  console.log('Health OK');

  console.log('Testing Login as admin001...');
  res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId: 'admin001', password: 'Admin@12345' })
  });
  data = await res.json();
  assert.equal(data.success, true);
  const adminToken = data.data.token;
  console.log('Login OK');

  console.log('Testing GET /api/auth/me...');
  res = await fetch('http://localhost:5000/api/auth/me', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.loginId, 'admin001');
  console.log('Auth Me OK');

  console.log('Testing GET /api/users (Admin)...');
  res = await fetch('http://localhost:5000/api/users', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  data = await res.json();
  assert.equal(data.success, true);
  assert(data.data.length >= 3);
  console.log('Users (Admin) OK');

  console.log('Testing Login as accountant001...');
  res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId: 'accountant001', password: 'Accountant@12345' })
  });
  data = await res.json();
  assert.equal(data.success, true);
  const accToken = data.data.token;
  
  console.log('Testing GET /api/users (Accountant) - should fail...');
  res = await fetch('http://localhost:5000/api/users', {
    headers: { Authorization: `Bearer ${accToken}` }
  });
  assert.equal(res.status, 403);
  console.log('RBAC Check OK');
  
  console.log('All tests passed!');
}
run().catch(console.error);
