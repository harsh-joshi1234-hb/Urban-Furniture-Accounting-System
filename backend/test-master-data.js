const assert = require('assert');

async function run() {
  console.log('Logging in as Admin...');
  let res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId: 'admin001', password: 'Admin@12345' })
  });
  let data = await res.json();
  const adminToken = data.data.token;

  console.log('Logging in as User...');
  res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId: 'user001', password: 'User@12345' })
  });
  data = await res.json();
  const userToken = data.data.token;

  // 1. Create Contact
  console.log('Testing Contact Creation (Admin)...');
  res = await fetch('http://localhost:5000/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Acme Corp', type: 'VENDOR', email: `acme_${Date.now()}@example.com` })
  });
  data = await res.json();
  assert.equal(res.status, 201);
  const contactId = data.data.id;

  console.log('Testing Contact Creation Invalid Type...');
  res = await fetch('http://localhost:5000/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Invalid', type: 'SOME_TYPE' })
  });
  assert.equal(res.status, 400);

  console.log('Testing Contact Access (User)...');
  res = await fetch('http://localhost:5000/api/contacts', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert.equal(res.status, 403);

  // 2. PRODUCT CATEGORY
  console.log('Testing Product Category Creation...');
  res = await fetch('http://localhost:5000/api/product-categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Chairs' })
  });
  data = await res.json();
  assert.equal(res.status, 201);
  const catId = data.data.id;

  // 3. PRODUCT
  console.log('Testing Product Creation...');
  res = await fetch('http://localhost:5000/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Office Chair', categoryId: catId, productType: 'GOODS', salesPrice: 150.00, cost: 80.00 })
  });
  data = await res.json();
  assert.equal(res.status, 201);
  const prodId = data.data.id;

  console.log('Testing Product Creation with negative price...');
  res = await fetch('http://localhost:5000/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Bad Chair', categoryId: catId, productType: 'GOODS', salesPrice: -10, cost: 5 })
  });
  assert.equal(res.status, 400);

  console.log('Testing Deleting Category (Conflict)...');
  res = await fetch(`http://localhost:5000/api/product-categories/${catId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(res.status, 409); // referenced by product

  // 4. ANALYTICAL ACCOUNT
  console.log('Testing Analytical Account...');
  res = await fetch('http://localhost:5000/api/analytic-accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Sales Revenue 2026', type: 'INCOME' })
  });
  assert.equal(res.status, 201);
  
  console.log('All Master Data Tests Passed!');
}
run().catch(console.error);
