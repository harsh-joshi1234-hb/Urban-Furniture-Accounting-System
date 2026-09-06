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
  console.log('Generating dummy data...');

  // Contacts
  const customers = [];
  for (let i = 0; i < 15; i++) {
    const c = await prisma.contact.create({
      data: {
        name: faker.company.name(),
        type: 'CUSTOMER',
        email: faker.internet.email(),
        phone: faker.phone.number(),
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
        name: faker.company.name() + ' Supplier',
        type: 'VENDOR',
        email: faker.internet.email(),
        phone: faker.phone.number(),
        city: faker.location.city(),
        country: 'India'
      }
    });
    vendors.push(v);
  }

  // Categories & Products
  const categories = ['Living Room', 'Office Office', 'Bedroom', 'Dining', 'Outdoor'];
  const dbCats = [];
  for (const c of categories) {
    dbCats.push(await prisma.productCategory.upsert({ where: { name: c }, update: {}, create: { name: c } }));
  }

  const products = [];
  for (let i = 0; i < 30; i++) {
    const p = await prisma.product.create({
      data: {
        name: faker.commerce.productName() + ' ' + faker.commerce.productAdjective(),
        categoryId: faker.helpers.arrayElement(dbCats).id,
        productType: 'GOODS',
        salesPrice: faker.commerce.price({ min: 1000, max: 20000 }),
        cost: faker.commerce.price({ min: 500, max: 9000 }),
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
  const seq = { INV: 0, BILL: 0, PAY: 0, SALES: 0, PURCHASE: 0, BANK: 0 };
  const nextNumber = (prefix) => `${prefix}/2026/${String((seq[prefix] += 1)).padStart(4, '0')}`;

  for (let i = 0; i < 40; i++) {
    const isSales = i < 25; // 25 Invoices, 15 Bills
    const date = faker.date.recent({ days: 60 });
    const contact = isSales ? faker.helpers.arrayElement(customers) : faker.helpers.arrayElement(vendors);
    const prod = faker.helpers.arrayElement(products);
    const qty = faker.number.int({ min: 1, max: 5 });
    const price = isSales ? prod.salesPrice : prod.cost;
    const total = Number(qty) * Number(price);
    const isPaid = faker.datatype.boolean(0.7); // 70% chance of being paid

    if (isSales) {
      // 1. Customer Invoice
      const inv = await prisma.customerInvoice.create({
        data: {
          number: nextNumber('INV'),
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
      // Vendor Bill
      const billAnalyticId = faker.helpers.arrayElement(analytics).id;
      const bill = await prisma.vendorBill.create({
        data: {
          number: nextNumber('BILL'),
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
