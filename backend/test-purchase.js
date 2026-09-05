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

  // Setup: Get Account ID for '500000'
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const account = await prisma.chartOfAccount.findUnique({ where: { code: '500000' } });
  const accId = account.id;

  // Setup: Create a vendor
  res = await fetch('http://localhost:5000/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Purchase Vendor A', type: 'VENDOR', email: `vendorA_${Date.now()}@test.com` })
  });
  const vendorA = (await res.json()).data.id;

  // Setup: Create a customer (to test cross-type rejection)
  res = await fetch('http://localhost:5000/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Purchase Customer', type: 'CUSTOMER', email: `cust_${Date.now()}@test.com` })
  });
  const custId = (await res.json()).data.id;

  // Setup: Create a product
  res = await fetch('http://localhost:5000/api/product-categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: `Cat_PO_${Date.now()}` })
  });
  const catId = (await res.json()).data.id;
  
  res = await fetch('http://localhost:5000/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Test Wood', categoryId: catId, productType: 'GOODS', salesPrice: 50.00, cost: 20.00 })
  });
  const prodId = (await res.json()).data.id;

  // 1. PURCHASE ORDER
  console.log('Testing Purchase Order Creation...');
  // Should fail if CUSTOMER is used as vendor
  res = await fetch('http://localhost:5000/api/purchase-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      vendorId: custId,
      orderDate: '2026-09-01',
      lines: [{ productId: prodId, quantity: 10 }]
    })
  });
  assert.equal(res.status, 400);

  // Success with VENDOR
  res = await fetch('http://localhost:5000/api/purchase-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      vendorId: vendorA,
      orderDate: '2026-09-01',
      lines: [{ productId: prodId, quantity: 10 }] // Backend calculated: 10 * 20 = 200
    })
  });
  data = await res.json();
  assert.equal(res.status, 201);
  const poId = data.data.id;

  // Verify backend calculation used cost (20.00)
  res = await fetch(`http://localhost:5000/api/purchase-orders/${poId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  data = await res.json();
  assert.equal(data.data.lines[0].total, '200');

  // RBAC test
  res = await fetch(`http://localhost:5000/api/purchase-orders/${poId}`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert.equal(res.status, 403);

  console.log('Testing PO Confirmation...');
  res = await fetch(`http://localhost:5000/api/purchase-orders/${poId}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(res.status, 200);

  // 2. VENDOR BILL FROM PO
  console.log('Testing Create Vendor Bill from PO...');
  res = await fetch(`http://localhost:5000/api/vendor-bills/from-po/${poId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  data = await res.json();
  assert.equal(res.status, 201);
  const billId = data.data.id;

  console.log('Testing Bill Confirmation...');
  res = await fetch(`http://localhost:5000/api/vendor-bills/${billId}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(res.status, 200);

  // 3. VENDOR PAYMENT & ALLOCATION
  console.log('Testing SEND Payment...');
  // Failure: SEND but partnerType CUSTOMER
  res = await fetch('http://localhost:5000/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      partnerId: custId,
      paymentType: 'SEND',
      partnerType: 'CUSTOMER',
      amount: 200,
      paymentDate: '2026-09-02',
      paymentMethod: 'BANK'
    })
  });
  assert.equal(res.status, 400);

  // Success SEND VENDOR
  res = await fetch('http://localhost:5000/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      partnerId: vendorA,
      paymentType: 'SEND',
      partnerType: 'VENDOR',
      amount: 200,
      paymentDate: '2026-09-02',
      paymentMethod: 'BANK'
    })
  });
  data = await res.json();
  assert.equal(res.status, 201);
  const payId = data.data.id;

  console.log('Allocating Payment to Bill...');
  // Failure: Allocation of SEND to CUSTOMER_INVOICE
  res = await fetch(`http://localhost:5000/api/payments/${payId}/allocations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      documentType: 'CUSTOMER_INVOICE',
      customerInvoiceId: billId, // Purposely passing bill id as invoice id to trigger bad request
      allocatedAmount: 200
    })
  });
  assert.equal(res.status, 400);

  // Success: VENDOR_BILL allocation
  res = await fetch(`http://localhost:5000/api/payments/${payId}/allocations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      documentType: 'VENDOR_BILL',
      vendorBillId: billId,
      allocatedAmount: 100 // Partial payment
    })
  });
  assert.equal(res.status, 201);

  // Check Bill Status
  res = await fetch(`http://localhost:5000/api/vendor-bills/${billId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  data = await res.json();
  assert.equal(data.data.status, 'PARTIALLY_PAID');

  // Allocate remaining
  res = await fetch(`http://localhost:5000/api/payments/${payId}/allocations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      documentType: 'VENDOR_BILL',
      vendorBillId: billId,
      allocatedAmount: 100 // Full payment now
    })
  });
  assert.equal(res.status, 201);

  // Check Bill Status
  res = await fetch(`http://localhost:5000/api/vendor-bills/${billId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  data = await res.json();
  assert.equal(data.data.status, 'PAID');

  console.log('All Purchase Tests Passed!');
}
run().catch(console.error);
