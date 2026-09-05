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
  const portalUserId = data.data.user.id;

  // Setup: Create a customer
  res = await fetch('http://localhost:5000/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Sales Customer A', type: 'CUSTOMER', email: `custA_${Date.now()}@test.com` })
  });
  data = await res.json();
  const custA = data.data.id;

  // Setup: Create a second customer for IDOR check
  res = await fetch('http://localhost:5000/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Sales Customer B', type: 'CUSTOMER', email: `custB_${Date.now()}@test.com` })
  });
  data = await res.json();
  const custB = data.data.id;

  // Setup: Create a product
  res = await fetch('http://localhost:5000/api/product-categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: `Cat_${Date.now()}` })
  });
  const catId = (await res.json()).data.id;
  
  res = await fetch('http://localhost:5000/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Test Sofa', categoryId: catId, productType: 'GOODS', salesPrice: 500.00, cost: 200.00 })
  });
  const prodId = (await res.json()).data.id;

  // Setup: Get Account ID for '400000'
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const account = await prisma.chartOfAccount.findUnique({ where: { code: '400000' } });
  const accId = account.id;

  // 1. SALES ORDER
  console.log('Testing Sales Order Creation...');
  res = await fetch('http://localhost:5000/api/sales-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      customerId: custA,
      orderDate: '2026-09-01',
      lines: [{ productId: prodId, quantity: 2 }] // Backend should calculate 2 * 500 = 1000
    })
  });
  data = await res.json();
  assert.equal(res.status, 201);
  const soId = data.data.id;
  
  // Verify backend calculation
  res = await fetch(`http://localhost:5000/api/sales-orders/${soId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  data = await res.json();
  assert.equal(data.data.lines[0].total, '1000'); // Prisma Decimal is serialized as string

  console.log('Testing SO Confirmation...');
  res = await fetch(`http://localhost:5000/api/sales-orders/${soId}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(res.status, 200);

  // 2. INVOICE FROM SO
  console.log('Testing Create Invoice from SO...');
  res = await fetch(`http://localhost:5000/api/invoices/from-so/${soId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  data = await res.json();
  assert.equal(res.status, 201);
  const invId = data.data.id;

  console.log('Testing Invoice Confirmation...');
  res = await fetch(`http://localhost:5000/api/invoices/${invId}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(res.status, 200);

  // 3. DIRECT INVOICE FOR CUST B (IDOR Target)
  res = await fetch('http://localhost:5000/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      customerId: custB,
      invoiceDate: '2026-09-01',
      dueDate: '2026-10-01',
      lines: [{ productId: prodId, accountId: accId, quantity: 1 }]
    })
  });
  data = await res.json();
  const invBId = data.data.id;

  res = await fetch(`http://localhost:5000/api/invoices/${invBId}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(res.status, 200);

  // 4. PAYMENTS & ALLOCATION
  console.log('Testing Payment & Allocation...');
  res = await fetch('http://localhost:5000/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      partnerId: custA,
      paymentType: 'RECEIVE',
      partnerType: 'CUSTOMER',
      amount: 1000,
      paymentDate: '2026-09-02',
      paymentMethod: 'BANK'
    })
  });
  data = await res.json();
  assert.equal(res.status, 201);
  const payId = data.data.id;

  console.log('Allocating Partial Payment...');
  res = await fetch(`http://localhost:5000/api/payments/${payId}/allocations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      documentType: 'CUSTOMER_INVOICE',
      customerInvoiceId: invId,
      allocatedAmount: 400
    })
  });
  assert.equal(res.status, 201);

  // Check Invoice Status
  res = await fetch(`http://localhost:5000/api/invoices/${invId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  data = await res.json();
  assert.equal(data.data.status, 'PARTIALLY_PAID');

  // 5. SECURITY & PORTAL IDOR
  console.log('Testing Portal Security...');
  
  // Create mapping manually using admin token on a mock script, or we just map it in DB
  await prisma.customerUser.create({
    data: { userId: portalUserId, customerId: custA }
  });

  // Now test portal
  res = await fetch('http://localhost:5000/api/portal/invoices', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  data = await res.json();
  assert.ok(data.data.length >= 1);
  assert.ok(data.data.some(i => i.id === invId));

  console.log('Testing IDOR on Customer B Invoice...');
  res = await fetch(`http://localhost:5000/api/portal/invoices/${invBId}`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert.equal(res.status, 404); // Should be completely hidden!

  console.log('All Sales Tests Passed!');
}
run().catch(console.error);
