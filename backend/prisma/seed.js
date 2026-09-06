const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ALL_PERMISSIONS = [
  // Users
  { code: 'user.create', name: 'Create User', module: 'Auth' },
  { code: 'user.read', name: 'Read User', module: 'Auth' },
  { code: 'user.update', name: 'Update User', module: 'Auth' },
  { code: 'user.deactivate', name: 'Deactivate User', module: 'Auth' },
  { code: 'user.delete', name: 'Delete User', module: 'Auth' },
  // Sales Orders
  { code: 'sales_order.create', name: 'Create Sales Order', module: 'Sales' },
  { code: 'sales_order.read', name: 'Read Sales Order', module: 'Sales' },
  { code: 'sales_order.update', name: 'Update Sales Order', module: 'Sales' },
  { code: 'sales_order.confirm', name: 'Confirm Sales Order', module: 'Sales' },
  { code: 'sales_order.cancel', name: 'Cancel Sales Order', module: 'Sales' },
  // Invoices
  { code: 'invoice.create', name: 'Create Invoice', module: 'Sales' },
  { code: 'invoice.read', name: 'Read Invoice', module: 'Sales' },
  { code: 'invoice.confirm', name: 'Confirm Invoice', module: 'Sales' },
  { code: 'invoice.cancel', name: 'Cancel Invoice', module: 'Sales' },
  { code: 'invoice.pay', name: 'Pay Invoice', module: 'Sales' },
  // Purchase Orders
  { code: 'purchase_order.create', name: 'Create Purchase Order', module: 'Purchase' },
  { code: 'purchase_order.read', name: 'Read Purchase Order', module: 'Purchase' },
  { code: 'purchase_order.update', name: 'Update Purchase Order', module: 'Purchase' },
  { code: 'purchase_order.confirm', name: 'Confirm Purchase Order', module: 'Purchase' },
  { code: 'purchase_order.cancel', name: 'Cancel Purchase Order', module: 'Purchase' },
  // Bills
  { code: 'bill.create', name: 'Create Bill', module: 'Purchase' },
  { code: 'bill.read', name: 'Read Bill', module: 'Purchase' },
  { code: 'bill.confirm', name: 'Confirm Bill', module: 'Purchase' },
  { code: 'bill.cancel', name: 'Cancel Bill', module: 'Purchase' },
  { code: 'bill.pay', name: 'Pay Bill', module: 'Purchase' },
  // Payments
  { code: 'payment.create', name: 'Create Payment', module: 'Payments' },
  { code: 'payment.read', name: 'Read Payment', module: 'Payments' },
  { code: 'payment.confirm', name: 'Confirm Payment', module: 'Payments' },
  { code: 'payment.cancel', name: 'Cancel Payment', module: 'Payments' },
  // Accounts
  { code: 'account.create', name: 'Create Account', module: 'Accounting' },
  { code: 'account.read', name: 'Read Account', module: 'Accounting' },
  { code: 'account.update', name: 'Update Account', module: 'Accounting' },
  // Journals
  { code: 'journal.create', name: 'Create Journal', module: 'Accounting' },
  { code: 'journal.read', name: 'Read Journal', module: 'Accounting' },
  { code: 'journal.post', name: 'Post Journal', module: 'Accounting' },
  { code: 'journal.cancel', name: 'Cancel Journal', module: 'Accounting' },
  // Journal Entries - required by src/routes/journalEntry.routes.js
  { code: 'journal_entry.create', name: 'Create Journal Entry', module: 'Accounting' },
  { code: 'journal_entry.read', name: 'Read Journal Entry', module: 'Accounting' },
  { code: 'journal_entry.post', name: 'Post Journal Entry', module: 'Accounting' },
  { code: 'journal_entry.cancel', name: 'Cancel Journal Entry', module: 'Accounting' },
  // Budgets
  { code: 'budget.create', name: 'Create Budget', module: 'Budget' },
  { code: 'budget.read', name: 'Read Budget', module: 'Budget' },
  { code: 'budget.update', name: 'Update Budget', module: 'Budget' },
  { code: 'budget.confirm', name: 'Confirm Budget', module: 'Budget' },
  { code: 'budget.revise', name: 'Revise Budget', module: 'Budget' },
  { code: 'budget.cancel', name: 'Cancel Budget', module: 'Budget' },
  // Reports
  { code: 'report.read', name: 'Read Reports', module: 'Reports' },
  // Contacts
  { code: 'contact.create', name: 'Create Contact', module: 'Master Data' },
  { code: 'contact.read', name: 'Read Contact', module: 'Master Data' },
  { code: 'contact.update', name: 'Update Contact', module: 'Master Data' },
  { code: 'contact.delete', name: 'Delete Contact', module: 'Master Data' },
  // Products
  { code: 'product.create', name: 'Create Product', module: 'Master Data' },
  { code: 'product.read', name: 'Read Product', module: 'Master Data' },
  { code: 'product.update', name: 'Update Product', module: 'Master Data' },
  { code: 'product.delete', name: 'Delete Product', module: 'Master Data' },
];

async function main() {
  console.log('Starting massive seed...');

  // 1. Permissions & Roles
  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }
  const adminRole = await prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } });
  const accountantRole = await prisma.role.upsert({ where: { name: 'ACCOUNTANT' }, update: {}, create: { name: 'ACCOUNTANT' } });
  const userRole = await prisma.role.upsert({ where: { name: 'USER' }, update: {}, create: { name: 'USER' } });
  
  const allDbPerms = await prisma.permission.findMany();
  const adminPerms = allDbPerms.map(p => ({ roleId: adminRole.id, permissionId: p.id }));
  const accountantPerms = allDbPerms.filter(p => !p.code.startsWith('user.')).map(p => ({ roleId: accountantRole.id, permissionId: p.id }));

  for (const rp of [...adminPerms, ...accountantPerms]) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: rp.roleId, permissionId: rp.permissionId } },
      update: {}, create: rp,
    });
  }

  // 2. Users
  // Passwords come from the environment in a real deployment. The defaults are
  // the local development credentials - always override them in production.
  const users = [
    { loginId: 'admin001', email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com', name: 'System Admin', password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345', roleId: adminRole.id },
    { loginId: 'accountant001', email: process.env.SEED_ACCOUNTANT_EMAIL || 'accountant@example.com', name: 'System Accountant', password: process.env.SEED_ACCOUNTANT_PASSWORD || 'Accountant@12345', roleId: accountantRole.id },
    { loginId: 'user001', email: process.env.SEED_USER_EMAIL || 'user@example.com', name: 'Portal User', password: process.env.SEED_USER_PASSWORD || 'User@12345', roleId: userRole.id },
  ];

  let adminUser;
  for (const u of users) {
    let existing = await prisma.user.findUnique({ where: { loginId: u.loginId } });
    if (!existing) {
      const hash = await bcrypt.hash(u.password, 10);
      existing = await prisma.user.create({ data: { loginId: u.loginId, email: u.email, name: u.name, passwordHash: hash, roleId: u.roleId } });
    }
    if (u.loginId === 'admin001') adminUser = existing;
  }

  // 3. Chart of Accounts & Journals
  const salesAccount = await prisma.chartOfAccount.upsert({ where: { code: '400000' }, update: {}, create: { code: '400000', name: 'Product Sales', type: 'INCOME' } });
  const expenseAccount = await prisma.chartOfAccount.upsert({ where: { code: '500000' }, update: {}, create: { code: '500000', name: 'Goods Purchased', type: 'EXPENSE' } });
  const bankAccount = await prisma.chartOfAccount.upsert({ where: { code: '100000' }, update: {}, create: { code: '100000', name: 'Main Bank Account', type: 'BANK' } });
  const receivableAccount = await prisma.chartOfAccount.upsert({ where: { code: '120000' }, update: {}, create: { code: '120000', name: 'Accounts Receivable', type: 'ASSET' } });
  const payableAccount = await prisma.chartOfAccount.upsert({ where: { code: '210000' }, update: {}, create: { code: '210000', name: 'Accounts Payable', type: 'LIABILITY' } });

  // Ids are left to Prisma so each journal gets a real UUID - the journal-entry
  // validator requires a GUID, so hardcoded ids produce journals that cannot be
  // used for manual entries.
  const ensureJournal = async (type, name, defaultAccountId) => {
    const existing = await prisma.journal.findFirst({ where: { type } });
    if (existing) return existing;
    return prisma.journal.create({ data: { name, type, defaultAccountId } });
  };

  const salesJournal = await ensureJournal('SALES', 'Sales Journal', salesAccount.id);
  const purchaseJournal = await ensureJournal('PURCHASE', 'Purchase Journal', expenseAccount.id);
  const bankJournal = await ensureJournal('BANK', 'Bank Journal', bankAccount.id);
  await ensureJournal('CASH', 'Cash Journal', bankAccount.id);

  // ---------------------------------------------------------------------
  // Everything above is the minimum a deployment needs: permissions, roles,
  // sign-in accounts, the chart of accounts and the system journals. It is all
  // idempotent, so re-running is safe.
  //
  // Everything below is demo data for local development. It is skipped unless
  // SEED_DEMO_DATA=true, so a production database never gets invented
  // contacts, invoices or payments.
  // ---------------------------------------------------------------------
  if (process.env.SEED_DEMO_DATA !== 'true') {
    console.log('Core seed complete (roles, users, chart of accounts, journals).');
    console.log('Set SEED_DEMO_DATA=true to also generate demo records.');
    return;
  }

  // --- DUMMY DATA GENERATION ---
  const { faker } = require('@faker-js/faker');
  console.log('Clearing previous demo records...');
  await prisma.paymentAllocation.deleteMany({});
  await prisma.paymentGatewayTransaction.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.customerInvoiceLine.deleteMany({});
  await prisma.customerInvoice.deleteMany({});
  await prisma.vendorBillLine.deleteMany({});
  await prisma.vendorBill.deleteMany({});
  await prisma.salesOrderLine.deleteMany({});
  await prisma.salesOrder.deleteMany({});
  await prisma.purchaseOrderLine.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.journalItem.deleteMany({});
  await prisma.journalEntry.deleteMany({});
  await prisma.budget.deleteMany({});
  await prisma.analyticAccount.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customerUser.deleteMany({});
  await prisma.contact.deleteMany({});

  console.log('Generating rich demo data with photos...');

  const CUSTOMER_AVATARS = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&q=80',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200&q=80',
  ];

  const VENDOR_AVATARS = [
    'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&q=80',
    'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=200&q=80',
    'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=200&q=80',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200&q=80',
    'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=200&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&q=80',
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=200&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&q=80',
  ];

  // Contacts
  const customers = [];
  for (let i = 0; i < 15; i++) {
    const c = await prisma.contact.create({
      data: {
        name: faker.person.fullName() + ' (' + faker.company.name() + ')',
        type: 'CUSTOMER',
        imageUrl: CUSTOMER_AVATARS[i % CUSTOMER_AVATARS.length],
        email: faker.internet.email().toLowerCase(),
        phone: '+91 ' + faker.string.numeric(10),
        city: faker.location.city(),
        country: 'India'
      }
    });
    customers.push(c);
  }
  
  // Link user001 to first customer
  const baseUser = await prisma.user.findUnique({ where: { loginId: 'user001' }});
  await prisma.customerUser.upsert({
    where: { userId_customerId: { userId: baseUser.id, customerId: customers[0].id } },
    update: {}, create: { userId: baseUser.id, customerId: customers[0].id }
  });

  const vendors = [];
  for (let i = 0; i < 10; i++) {
    const v = await prisma.contact.create({
      data: {
        name: faker.company.name() + ' Timber & Hardware',
        type: 'VENDOR',
        imageUrl: VENDOR_AVATARS[i % VENDOR_AVATARS.length],
        email: faker.internet.email().toLowerCase(),
        phone: '+91 ' + faker.string.numeric(10),
        city: faker.location.city(),
        country: 'India'
      }
    });
    vendors.push(v);
  }

  // Categories & Products
  const categories = ['Living Room', 'Office Office', 'Bedroom', 'Dining', 'Outdoor'];
  const dbCats = {};
  for (const c of categories) {
    const cat = await prisma.productCategory.upsert({ where: { name: c }, update: {}, create: { name: c } });
    dbCats[c] = cat.id;
  }

  const FURNITURE_CATALOG = [
    { name: 'Ergonomic Executive Mesh Chair', category: 'Office Office', image: 'https://images.unsplash.com/photo-1580481077197-2a4f4efb71d9?w=600&q=80', salesPrice: 14500, cost: 7200 },
    { name: 'Solid Walnut Standing Desk', category: 'Office Office', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80', salesPrice: 28000, cost: 14000 },
    { name: 'Nordic Velvet 3-Seater Sofa', category: 'Living Room', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', salesPrice: 42000, cost: 21000 },
    { name: 'Scandinavian Oak Dining Table', category: 'Dining', image: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=600&q=80', salesPrice: 32000, cost: 16000 },
    { name: 'Modern Upholstered Queen Bed', category: 'Bedroom', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80', salesPrice: 38000, cost: 19000 },
    { name: 'Industrial Teak Patio Dining Set', category: 'Outdoor', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80', salesPrice: 49000, cost: 24500 },
    { name: 'Mid-Century Leather Lounge Armchair', category: 'Living Room', image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80', salesPrice: 18500, cost: 9200 },
    { name: 'Minimalist Oak Bookshelf', category: 'Living Room', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80', salesPrice: 16000, cost: 8000 },
    { name: 'Ceramic Top Nesting Coffee Tables', category: 'Living Room', image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&q=80', salesPrice: 12500, cost: 6200 },
    { name: 'Velvet Cushioned Dining Chairs (Pair)', category: 'Dining', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80', salesPrice: 11000, cost: 5500 },
    { name: 'Solid Wood 2-Drawer Nightstand', category: 'Bedroom', image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&q=80', salesPrice: 7500, cost: 3800 },
    { name: 'Adjustable Steel Swivel Barstool', category: 'Dining', image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&q=80', salesPrice: 6500, cost: 3200 },
    { name: 'Modular Sectional Corner Couch', category: 'Living Room', image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80', salesPrice: 56000, cost: 28000 },
    { name: 'Contemporary Sliding Credenza', category: 'Living Room', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80', salesPrice: 22000, cost: 11000 },
    { name: 'High-Back Ergonomic Task Chair', category: 'Office Office', image: 'https://images.unsplash.com/photo-1589834390005-5d4fb9bf3d32?w=600&q=80', salesPrice: 13500, cost: 6800 },
    { name: '6-Door Wardrobe with Mirror', category: 'Bedroom', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80', salesPrice: 45000, cost: 22500 },
    { name: 'All-Weather Rattan Sun Lounger', category: 'Outdoor', image: 'https://images.unsplash.com/photo-1519643381401-22c77e60520e?w=600&q=80', salesPrice: 19500, cost: 9800 },
    { name: 'Compact Home Office Workstation', category: 'Office Office', image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80', salesPrice: 21000, cost: 10500 },
    { name: 'Round Marble Bistro Dining Table', category: 'Dining', image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=600&q=80', salesPrice: 26000, cost: 13000 },
    { name: 'Outdoor Garden Bench with Cushion', category: 'Outdoor', image: 'https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=600&q=80', salesPrice: 14000, cost: 7000 },
  ];

  const products = [];
  for (const item of FURNITURE_CATALOG) {
    const p = await prisma.product.create({
      data: {
        name: item.name,
        imageUrl: item.image,
        categoryId: dbCats[item.category] || Object.values(dbCats)[0],
        productType: 'GOODS',
        salesPrice: item.salesPrice,
        cost: item.cost,
        isActive: true
      }
    });
    products.push(p);
  }

  // Analytic Accounts
  const analytics = [];
  for (const name of ['Q1 Marketing', 'R&D', 'HQ Operations']) {
    const a = await prisma.analyticAccount.create({ data: { name, type: 'EXPENSE' } });
    analytics.push(a);
  }

  // Budgets
  for (const a of analytics) {
    await prisma.budget.create({
      data: {
        name: a.name + ' Budget',
        analyticAccountId: a.id,
        type: 'EXPENSE',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        committedAmount: faker.number.int({ min: 50000, max: 200000 }),
        responsibleContactId: vendors[0].id,
        status: 'CONFIRMED'
      }
    });
  }

  // Generate Invoices & Journal Entries
  // To ensure the dashboard looks good, we'll manually create the data rather than calling services
  // so we can simulate past dates easily.
  
  console.log('Generating Invoices, Bills, and Financials...');
  let invCounter = 1;
  let jeCounter = 1;
  let payCounter = 1;
  let billCounter = 1;
  
  // Document numbers must follow the same scheme the services generate
  // (PREFIX/2026/0001), or the next generated number collides with a seeded one.
  const seq = { INV: 0, BILL: 0, PAY: 0, SALES: 0, PURCHASE: 0, BANK: 0, SO: 0, PO: 0 };
  const nextNumber = (prefix) => `${prefix}/2026/${String((seq[prefix] += 1)).padStart(4, '0')}`;

  for (let i = 0; i < 100; i++) {
    const isSales = i < 65; // 65 Sales / Invoices, 35 Purchases / Bills
    const date = faker.date.recent({ days: 60 });
    const contact = isSales ? faker.helpers.arrayElement(customers) : faker.helpers.arrayElement(vendors);
    const prod = faker.helpers.arrayElement(products);
    const qty = faker.number.int({ min: 1, max: 5 });
    const price = isSales ? prod.salesPrice : prod.cost;
    const total = Number(qty) * Number(price);
    const isPaid = faker.datatype.boolean(0.7); // 70% chance of being paid

    if (isSales) {
      // 0. Sales Order
      const soDate = faker.date.recent({ days: 5, refDate: date });
      const so = await prisma.salesOrder.create({
        data: {
          number: nextNumber('SO'),
          customerId: contact.id,
          orderDate: soDate,
          status: 'CONFIRMED',
          createdBy: adminUser.id,
          createdAt: soDate,
          lines: {
            create: [{
              productId: prod.id,
              quantity: qty,
              unitPrice: price,
              total: total
            }]
          }
        }
      });

      // 1. Customer Invoice
      const inv = await prisma.customerInvoice.create({
        data: {
          number: nextNumber('INV'),
          salesOrderId: so.id,
          customerId: contact.id,
          invoiceDate: date,
          dueDate: faker.date.soon({ days: 30, refDate: date }),
          status: isPaid ? 'PAID' : 'CONFIRMED',
          createdBy: adminUser.id,
          createdAt: date,
          lines: {
            create: [{
              productId: prod.id,
              accountId: salesAccount.id,
              quantity: qty,
              unitPrice: price,
              total: total
            }]
          }
        }
      });
      invCounter++;

      // 2. Sales Journal Entry (AR Debit, Sales Credit)
      const je = await prisma.journalEntry.create({
        data: {
          number: nextNumber('SALES'),
          journalId: salesJournal.id,
          partnerId: contact.id,
          accountingDate: date,
          documentDate: date,
          status: 'POSTED',
          sourceType: 'CUSTOMER_INVOICE',
          sourceId: inv.id,
          total: total,
          createdAt: date,
          postedAt: date,
          items: {
            create: [
              { accountId: receivableAccount.id, debit: total, credit: 0, partnerId: contact.id },
              { accountId: salesAccount.id, debit: 0, credit: total, partnerId: contact.id }
            ]
          }
        }
      });
      jeCounter++;

      // 3. Payment
      if (isPaid) {
        const payDate = faker.date.soon({ days: 10, refDate: date });
        const pay = await prisma.payment.create({
          data: {
            number: nextNumber('PAY'),
            paymentType: 'RECEIVE',
            partnerType: 'CUSTOMER',
            partnerId: contact.id,
            amount: total,
            paymentDate: payDate,
            paymentMethod: 'BANK',
            status: 'CONFIRMED',
            createdBy: adminUser.id,
            createdAt: payDate,
            confirmedAt: payDate,
            allocations: {
              create: [{
                documentType: 'CUSTOMER_INVOICE',
                customerInvoiceId: inv.id,
                allocatedAmount: total,
                createdAt: payDate
              }]
            }
          }
        });
        payCounter++;

        // Bank Journal Entry (Bank Debit, AR Credit)
        await prisma.journalEntry.create({
          data: {
            number: nextNumber('BANK'),
            journalId: bankJournal.id,
            partnerId: contact.id,
            accountingDate: payDate,
            documentDate: payDate,
            status: 'POSTED',
            sourceType: 'CUSTOMER_PAYMENT',
            sourceId: pay.id,
            total: total,
            createdAt: payDate,
            postedAt: payDate,
            items: {
              create: [
                { accountId: bankAccount.id, debit: total, credit: 0, partnerId: contact.id },
                { accountId: receivableAccount.id, debit: 0, credit: total, partnerId: contact.id }
              ]
            }
          }
        });
        jeCounter++;
      }
    } else {
      // 0. Purchase Order
      const poDate = faker.date.recent({ days: 5, refDate: date });
      const billAnalyticId = faker.helpers.arrayElement(analytics).id;
      const po = await prisma.purchaseOrder.create({
        data: {
          number: nextNumber('PO'),
          vendorId: contact.id,
          orderDate: poDate,
          status: 'CONFIRMED',
          createdBy: adminUser.id,
          createdAt: poDate,
          lines: {
            create: [{
              productId: prod.id,
              quantity: qty,
              unitPrice: price,
              total: total,
              analyticAccountId: billAnalyticId
            }]
          }
        }
      });

      // 1. Vendor Bill
      const bill = await prisma.vendorBill.create({
        data: {
          number: nextNumber('BILL'),
          purchaseOrderId: po.id,
          vendorId: contact.id,
          billDate: date,
          dueDate: faker.date.soon({ days: 30, refDate: date }),
          status: isPaid ? 'PAID' : 'CONFIRMED',
          createdBy: adminUser.id,
          createdAt: date,
          lines: {
            create: [{
              productId: prod.id,
              accountId: expenseAccount.id,
              analyticAccountId: billAnalyticId,
              quantity: qty,
              unitPrice: price,
              total: total
            }]
          }
        }
      });
      billCounter++;

      // Purchase Journal Entry (Expense Debit, AP Credit)
      const je = await prisma.journalEntry.create({
        data: {
          number: nextNumber('PURCHASE'),
          journalId: purchaseJournal.id,
          partnerId: contact.id,
          accountingDate: date,
          documentDate: date,
          status: 'POSTED',
          sourceType: 'VENDOR_BILL',
          sourceId: bill.id,
          total: total,
          createdAt: date,
          postedAt: date,
          items: {
            create: [
              { accountId: expenseAccount.id, debit: total, credit: 0, partnerId: contact.id, analyticAccountId: billAnalyticId },
              { accountId: payableAccount.id, debit: 0, credit: total, partnerId: contact.id }
            ]
          }
        }
      });
      jeCounter++;

      if (isPaid) {
        const payDate = faker.date.soon({ days: 10, refDate: date });
        const pay = await prisma.payment.create({
          data: {
            number: nextNumber('PAY'),
            paymentType: 'SEND',
            partnerType: 'VENDOR',
            partnerId: contact.id,
            amount: total,
            paymentDate: payDate,
            paymentMethod: 'BANK',
            status: 'CONFIRMED',
            createdBy: adminUser.id,
            createdAt: payDate,
            confirmedAt: payDate,
            allocations: {
              create: [{
                documentType: 'VENDOR_BILL',
                vendorBillId: bill.id,
                allocatedAmount: total,
                createdAt: payDate
              }]
            }
          }
        });
        payCounter++;

        // Bank Journal Entry (AP Debit, Bank Credit)
        await prisma.journalEntry.create({
          data: {
            number: nextNumber('BANK'),
            journalId: bankJournal.id,
            partnerId: contact.id,
            accountingDate: payDate,
            documentDate: payDate,
            status: 'POSTED',
            sourceType: 'VENDOR_PAYMENT',
            sourceId: pay.id,
            total: total,
            createdAt: payDate,
            postedAt: payDate,
            items: {
              create: [
                { accountId: payableAccount.id, debit: total, credit: 0, partnerId: contact.id },
                { accountId: bankAccount.id, debit: 0, credit: total, partnerId: contact.id }
              ]
            }
          }
        });
        jeCounter++;
      }
    }
  }

  console.log('=============================================');
  console.log('SEED COMPLETE! Database populated for Dashboard.');
  console.log('=============================================');
  console.log('Credentials:');
  console.log('- Admin:      admin001      / Admin@12345');
  console.log('- Accountant: accountant001 / Accountant@12345');
  console.log('- User:       user001       / User@12345');
  console.log('=============================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
