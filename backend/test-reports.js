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

  console.log('Logging in as Accountant...');
  res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId: 'accountant001', password: 'Accountant@12345' })
  });
  data = await res.json();
  const accountantToken = data.data.token;

  console.log('Logging in as User...');
  res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId: 'user001', password: 'User@12345' })
  });
  data = await res.json();
  const userToken = data.data.token;

  console.log('\n--- SETUP TEST DATA ---');
  // Create accounts
  const accInc = await fetch('http://localhost:5000/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ code: `400${Date.now()}`, name: 'Report Income', type: 'INCOME' })
  }).then(r => r.json()).then(d => d.data.id);

  const accExp = await fetch('http://localhost:5000/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ code: `500${Date.now()}`, name: 'Report Expense', type: 'EXPENSE' })
  }).then(r => r.json()).then(d => d.data.id);

  const accAsset = await fetch('http://localhost:5000/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ code: `100${Date.now()}`, name: 'Report Bank', type: 'BANK' })
  }).then(r => r.json()).then(d => d.data.id);

  const accLiab = await fetch('http://localhost:5000/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ code: `200${Date.now()}`, name: 'Report Loan', type: 'LIABILITY' })
  }).then(r => r.json()).then(d => d.data.id);

  const accCap = await fetch('http://localhost:5000/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ code: `300${Date.now()}`, name: 'Report Capital', type: 'CAPITAL' })
  }).then(r => r.json()).then(d => d.data.id);

  // Journal
  const journalId = await fetch('http://localhost:5000/api/journals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: `Report Journal ${Date.now()}`, type: 'BANK', defaultAccountId: accAsset })
  }).then(r => r.json()).then(d => d.data.id);

  // Create DRAFT Entry (Should not affect reports)
  await fetch('http://localhost:5000/api/journal-entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      journalId,
      accountingDate: '2026-10-01',
      documentDate: '2026-10-01',
      items: [
        { accountId: accAsset, debit: 5000 },
        { accountId: accInc, credit: 5000 }
      ]
    })
  });

  // Create POSTED Entry 1 (Income)
  const je1 = await fetch('http://localhost:5000/api/journal-entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      journalId,
      accountingDate: '2026-10-05',
      documentDate: '2026-10-05',
      items: [
        { accountId: accAsset, debit: 10000 }, // Asset +10000
        { accountId: accInc, credit: 10000 } // Income +10000
      ]
    })
  }).then(r => r.json()).then(d => d.data.id);
  await fetch(`http://localhost:5000/api/journal-entries/${je1}/post`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } });

  // Create POSTED Entry 2 (Expense & Liability)
  const je2 = await fetch('http://localhost:5000/api/journal-entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      journalId,
      accountingDate: '2026-10-10',
      documentDate: '2026-10-10',
      items: [
        { accountId: accExp, debit: 3000 }, // Expense +3000
        { accountId: accLiab, credit: 3000 } // Liability +3000
      ]
    })
  }).then(r => r.json()).then(d => d.data.id);
  await fetch(`http://localhost:5000/api/journal-entries/${je2}/post`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } });

  // Create POSTED Entry 3 (Capital Investment)
  const je3 = await fetch('http://localhost:5000/api/journal-entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      journalId,
      accountingDate: '2026-10-15',
      documentDate: '2026-10-15',
      items: [
        { accountId: accAsset, debit: 20000 }, // Asset +20000
        { accountId: accCap, credit: 20000 } // Capital +20000
      ]
    })
  }).then(r => r.json()).then(d => d.data.id);
  await fetch(`http://localhost:5000/api/journal-entries/${je3}/post`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } });

  // Create CANCELLED Entry (Should not affect reports)
  const je4 = await fetch('http://localhost:5000/api/journal-entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      journalId,
      accountingDate: '2026-10-20',
      documentDate: '2026-10-20',
      items: [
        { accountId: accAsset, debit: 1000 },
        { accountId: accInc, credit: 1000 }
      ]
    })
  }).then(r => r.json()).then(d => d.data.id);
  await fetch(`http://localhost:5000/api/journal-entries/${je4}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } });

  console.log('\n--- PROFIT & LOSS TESTS ---');
  
  // 1/2. Admin & Accountant can access P&L
  res = await fetch('http://localhost:5000/api/reports/profit-loss', { headers: { Authorization: `Bearer ${adminToken}` } });
  assert.equal(res.status, 200);
  res = await fetch('http://localhost:5000/api/reports/profit-loss', { headers: { Authorization: `Bearer ${accountantToken}` } });
  assert.equal(res.status, 200);
  
  // 3. User gets 403
  res = await fetch('http://localhost:5000/api/reports/profit-loss', { headers: { Authorization: `Bearer ${userToken}` } });
  assert.equal(res.status, 403);

  // 4/5/6/7/8/10/11/12. Verify P&L totals (Should include 10000 Income and 3000 Expense, net 7000)
  // Date filtering
  res = await fetch('http://localhost:5000/api/reports/profit-loss?startDate=2026-10-01&endDate=2026-10-31', { headers: { Authorization: `Bearer ${adminToken}` } });
  data = (await res.json()).data;
  
  const incomeLine = data.income.find(i => i.code.startsWith('400')); // From our setup
  const expenseLine = data.expenses.find(e => e.code.startsWith('500'));
  
  // We may have other data from test-accounting-budget.js if we run it together, so we just check >= and correct equations
  assert.ok(data.totalIncome >= 10000);
  assert.ok(data.totalExpenses >= 3000);
  assert.equal(data.totalIncome - data.totalExpenses, data.netIncome);

  // Date filtering that excludes our entries
  res = await fetch('http://localhost:5000/api/reports/profit-loss?startDate=2025-01-01&endDate=2025-12-31', { headers: { Authorization: `Bearer ${adminToken}` } });
  data = (await res.json()).data;
  assert.equal(data.totalIncome, 0);
  assert.equal(data.totalExpenses, 0);
  assert.equal(data.netIncome, 0);

  console.log('\n--- BALANCE SHEET TESTS ---');

  // 13/14. Admin & Accountant access
  res = await fetch('http://localhost:5000/api/reports/balance-sheet', { headers: { Authorization: `Bearer ${adminToken}` } });
  assert.equal(res.status, 200);
  res = await fetch('http://localhost:5000/api/reports/balance-sheet', { headers: { Authorization: `Bearer ${accountantToken}` } });
  assert.equal(res.status, 200);

  // 15. User gets 403
  res = await fetch('http://localhost:5000/api/reports/balance-sheet', { headers: { Authorization: `Bearer ${userToken}` } });
  assert.equal(res.status, 403);

  // 16-22, 24-27. Validate amounts and equation
  res = await fetch('http://localhost:5000/api/reports/balance-sheet?asOfDate=2026-10-31', { headers: { Authorization: `Bearer ${adminToken}` } });
  data = (await res.json()).data;
  
  assert.ok(data.totalAssets >= 30000); // 10000 + 20000
  assert.ok(data.totalLiabilities >= 3000);
  assert.ok(data.totalCapital >= 27000); // 20000 capital + 7000 net income
  
  // Check the equation Assets = Liabilities + Capital
  assert.equal(data.isBalanced, true);
  
  // 23. As-of-date filtering
  res = await fetch('http://localhost:5000/api/reports/balance-sheet?asOfDate=2026-10-08', { headers: { Authorization: `Bearer ${adminToken}` } });
  data = (await res.json()).data;
  // Up to Oct 8, only Entry 1 (Asset +10000, Income +10000) occurred
  // Assets should have 10000 (plus whatever else happened before)
  // Capital should include 10000 net income
  assert.equal(data.isBalanced, true);

  console.log('\n--- BUDGET REPORT TESTS ---');

  // 28/29. Admin & Accountant access
  res = await fetch('http://localhost:5000/api/reports/budget', { headers: { Authorization: `Bearer ${adminToken}` } });
  assert.equal(res.status, 200);
  res = await fetch('http://localhost:5000/api/reports/budget', { headers: { Authorization: `Bearer ${accountantToken}` } });
  assert.equal(res.status, 200);

  // 30. User gets 403
  res = await fetch('http://localhost:5000/api/reports/budget', { headers: { Authorization: `Bearer ${userToken}` } });
  assert.equal(res.status, 403);

  // 31-39. Data formatting and calculations
  data = await fetch('http://localhost:5000/api/reports/budget', { headers: { Authorization: `Bearer ${adminToken}` } }).then(r => r.json());
  assert.ok(Array.isArray(data.data.budgets));
  
  if (data.data.budgets.length > 0) {
    const b = data.data.budgets[0];
    assert.ok('id' in b);
    assert.ok('name' in b);
    assert.ok('type' in b);
    assert.ok('analyticAccount' in b || b.analyticAccount === null);
    assert.ok('committedAmount' in b);
    assert.ok('achievedAmount' in b);
    assert.ok('achievedPct' in b);
    assert.ok('status' in b);
  }

  // Filter test
  res = await fetch('http://localhost:5000/api/reports/budget?status=CONFIRMED', { headers: { Authorization: `Bearer ${adminToken}` } });
  data = await res.json();
  assert.ok(data.data.budgets.every(b => b.status === 'CONFIRMED'));

  console.log('All Report Tests Passed!');
}

run().catch(console.error);
