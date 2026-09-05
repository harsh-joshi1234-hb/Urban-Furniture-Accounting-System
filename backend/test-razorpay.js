const axios = require('axios');
const prisma = require('./src/config/prisma');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
let adminToken, userToken, user2Token;
let customer1Id, customer2Id, productId, accountId, invoiceId, partiallyPaidInvoiceId, paidInvoiceId, cancelledInvoiceId;

const log = (msg) => console.log(`[Test] ${msg}`);

async function setup() {
  log('Setting up test data...');

  // 1. Login as ADMIN
  const loginRes = await axios.post(`${API_URL}/auth/login`, { loginId: 'admin001', password: 'Admin@12345' });
  adminToken = loginRes.data.data.token;
  const adminAxios = axios.create({ headers: { Authorization: `Bearer ${adminToken}` } });

  // 2. Fetch existing products and accounts for invoice
  const cat = await prisma.productCategory.findFirst();
  const prod = await prisma.product.findFirst();
  const acc = await prisma.chartOfAccount.findFirst({ where: { type: 'INCOME' } });
  
  const catId = cat.id;
  productId = prod.id;
  accountId = acc.id;

  // 3. Create two customers and map them to two distinct users
  const c1Name = 'RZP Customer ' + Date.now();
  const c2Name = 'RZP Customer2 ' + Date.now();
  const c1Email = `rzp_${Date.now()}@test.com`;
  const c2Email = `rzp2_${Date.now()}@test.com`;
  const c1Res = await adminAxios.post(`${API_URL}/contacts`, { name: c1Name, type: 'CUSTOMER', email: c1Email });
  customer1Id = c1Res.data.data.id;
  
  const c2Res = await adminAxios.post(`${API_URL}/contacts`, { name: c2Name, type: 'CUSTOMER', email: c2Email });
  customer2Id = c2Res.data.data.id;

  // Create Users
  const userRole = await prisma.role.findUnique({ where: { name: 'USER' } });
  const roleId = userRole.id;
  const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
  const u1Name = 'rzpu1_' + randomSuffix;
  const u2Name = 'rzpu2_' + randomSuffix;
  const u1Res = await adminAxios.post(`${API_URL}/users`, { name: 'RZP User 1', loginId: u1Name, email: `${u1Name}@test.com`, password: 'User@12345', roleId });
  const u2Res = await adminAxios.post(`${API_URL}/users`, { name: 'RZP User 2', loginId: u2Name, email: `${u2Name}@test.com`, password: 'User@12345', roleId });

  // Map users to customers directly
  await prisma.customerUser.create({ data: { userId: u1Res.data.data.id, customerId: customer1Id } });
  await prisma.customerUser.create({ data: { userId: u2Res.data.data.id, customerId: customer2Id } });

  // Login users
  const login1Res = await axios.post(`${API_URL}/auth/login`, { loginId: u1Name, password: 'User@12345' });
  userToken = login1Res.data.data.token;
  
  const login2Res = await axios.post(`${API_URL}/auth/login`, { loginId: u2Name, password: 'User@12345' });
  user2Token = login2Res.data.data.token;

  // 4. Create Invoices for Customer 1
  // Unpaid Invoice
  const invRes = await adminAxios.post(`${API_URL}/invoices`, {
    customerId: customer1Id, invoiceDate: new Date(), dueDate: new Date(),
    lines: [{ productId, accountId, quantity: 2, unitPrice: 100 }] // total 200
  });
  invoiceId = invRes.data.data.id;
  await adminAxios.post(`${API_URL}/invoices/${invoiceId}/confirm`);

  // Partially Paid Invoice (Total 200, paid 50)
  const pInvRes = await adminAxios.post(`${API_URL}/invoices`, {
    customerId: customer1Id, invoiceDate: new Date(), dueDate: new Date(),
    lines: [{ productId, accountId, quantity: 2, unitPrice: 100 }] // total 200
  });
  partiallyPaidInvoiceId = pInvRes.data.data.id;
  await adminAxios.post(`${API_URL}/invoices/${partiallyPaidInvoiceId}/confirm`);
  
  // Make partial payment
  const payRes = await adminAxios.post(`${API_URL}/payments`, {
    partnerId: customer1Id, paymentType: 'RECEIVE', partnerType: 'CUSTOMER', amount: 50, paymentDate: new Date(), paymentMethod: 'BANK'
  });
  await adminAxios.post(`${API_URL}/payments/${payRes.data.data.id}/allocations`, {
    documentType: 'CUSTOMER_INVOICE', customerInvoiceId: partiallyPaidInvoiceId, allocatedAmount: 50
  });

  // Fully Paid Invoice
  const fpInvRes = await adminAxios.post(`${API_URL}/invoices`, {
    customerId: customer1Id, invoiceDate: new Date(), dueDate: new Date(),
    lines: [{ productId, accountId, quantity: 1, unitPrice: 100 }] // total 100
  });
  paidInvoiceId = fpInvRes.data.data.id;
  await adminAxios.post(`${API_URL}/invoices/${paidInvoiceId}/confirm`);
  const fpPayRes = await adminAxios.post(`${API_URL}/payments`, {
    partnerId: customer1Id, paymentType: 'RECEIVE', partnerType: 'CUSTOMER', amount: 100, paymentDate: new Date(), paymentMethod: 'BANK'
  });
  await adminAxios.post(`${API_URL}/payments/${fpPayRes.data.data.id}/allocations`, {
    documentType: 'CUSTOMER_INVOICE', customerInvoiceId: paidInvoiceId, allocatedAmount: 100
  });

  // Cancelled Invoice
  const cInvRes = await adminAxios.post(`${API_URL}/invoices`, {
    customerId: customer1Id, invoiceDate: new Date(), dueDate: new Date(),
    lines: [{ productId, accountId, quantity: 1, unitPrice: 100 }]
  });
  cancelledInvoiceId = cInvRes.data.data.id;
  await adminAxios.post(`${API_URL}/invoices/${cancelledInvoiceId}/cancel`);
}

async function runTests() {
  await setup();
  const userAxios = axios.create({ headers: { Authorization: `Bearer ${userToken}` } });
  const user2Axios = axios.create({ headers: { Authorization: `Bearer ${user2Token}` } });

  let passed = 0; let failed = 0;
  const assert = (condition, msg) => {
    if (condition) { passed++; console.log(`✅ PASS: ${msg}`); }
    else { failed++; console.error(`❌ FAIL: ${msg}`); }
  };

  // Test 1: Authenticated customer can create an order for their own unpaid invoice
  try {
    const res = await userAxios.post(`${API_URL}/payments/razorpay/order`, { invoiceId });
    assert(res.status === 201, 'Created order for unpaid invoice');
    assert(res.data.data.amount === 200, 'Calculated full amount correctly (200)');
    assert(res.data.data.razorpayOrderId.startsWith('order_'), 'Razorpay order ID returned');
    assert(res.data.data.paymentId !== undefined, 'Internal payment ID returned');
    
    // Verify DB records
    const pay = await prisma.payment.findUnique({ where: { id: res.data.data.paymentId }, include: { gatewayTxns: true } });
    assert(pay.paymentMethod === 'ONLINE' && pay.paymentType === 'RECEIVE' && pay.status === 'DRAFT', 'Payment created as ONLINE, RECEIVE, DRAFT');
    assert(pay.gatewayTxns.length === 1 && pay.gatewayTxns[0].status === 'PENDING', 'Gateway transaction created as PENDING');
    assert(pay.gatewayTxns[0].providerOrderId === res.data.data.razorpayOrderId, 'Razorpay order ID stored in DB');
  } catch (err) { assert(false, `Test 1 failed: ${err.message} - ${err.response?.data?.message || 'No msg'}`); }

  // Test 2: Another customer cannot create an order for the invoice
  try {
    await user2Axios.post(`${API_URL}/payments/razorpay/order`, { invoiceId });
    assert(false, 'Should not allow access to another customers invoice');
  } catch (err) {
    assert(err.response?.status === 404, 'Returns 404 for another customers invoice');
  }

  // Test 3: Already-paid invoice is rejected
  try {
    await userAxios.post(`${API_URL}/payments/razorpay/order`, { invoiceId: paidInvoiceId });
    assert(false, 'Should not allow paid invoice');
  } catch (err) {
    assert(err.response?.status === 400 && err.response.data.message.includes('valid payable status'), 'Rejects paid invoice');
  }

  // Test 4: Cancelled invoice is rejected
  try {
    await userAxios.post(`${API_URL}/payments/razorpay/order`, { invoiceId: cancelledInvoiceId });
    assert(false, 'Should not allow cancelled invoice');
  } catch (err) {
    assert(err.response?.status === 400 && err.response.data.message.includes('valid payable status'), 'Rejects cancelled invoice');
  }

  // Test 5: Backend calculates amount due correctly after previous allocations (Partially Paid)
  try {
    const res = await userAxios.post(`${API_URL}/payments/razorpay/order`, { invoiceId: partiallyPaidInvoiceId });
    assert(res.status === 201, 'Created order for partially paid invoice');
    assert(res.data.data.amount === 150, 'Calculated partial amount correctly (200 - 50 = 150)');
  } catch (err) { assert(false, `Test 5 failed: ${err.message}`); }

  // Test 6: Deduplication - requesting again for the same unpaid invoice returns existing pending order
  try {
    const res1 = await userAxios.post(`${API_URL}/payments/razorpay/order`, { invoiceId });
    const res2 = await userAxios.post(`${API_URL}/payments/razorpay/order`, { invoiceId });
    assert(res1.data.data.razorpayOrderId === res2.data.data.razorpayOrderId, 'Deduplication reuses existing order');
  } catch (err) { assert(false, `Test 6 failed: ${err.message}`); }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => { console.error(e); process.exit(1); });
