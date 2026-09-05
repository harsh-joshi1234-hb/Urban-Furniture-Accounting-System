const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ALL_PERMISSIONS = [
  // Users
  { code: 'user.create', name: 'Create User', module: 'Auth' },
  { code: 'user.read', name: 'Read User', module: 'Auth' },
  { code: 'user.update', name: 'Update User', module: 'Auth' },
  { code: 'user.deactivate', name: 'Deactivate User', module: 'Auth' },
  
  // Invoices
  { code: 'invoice.create', name: 'Create Invoice', module: 'Sales' },
  { code: 'invoice.read', name: 'Read Invoice', module: 'Sales' },
  { code: 'invoice.confirm', name: 'Confirm Invoice', module: 'Sales' },
  { code: 'invoice.cancel', name: 'Cancel Invoice', module: 'Sales' },
  { code: 'invoice.pay', name: 'Pay Invoice', module: 'Sales' },
  
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
  console.log('Starting seed...');

  // 1. Seed Permissions
  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }
  console.log('Permissions seeded.');

  // 2. Seed Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  const accountantRole = await prisma.role.upsert({
    where: { name: 'ACCOUNTANT' },
    update: {},
    create: { name: 'ACCOUNTANT' },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER' },
  });
  console.log('Roles seeded.');

  // 3. Map Permissions to Roles
  const allDbPerms = await prisma.permission.findMany();
  
  const adminPerms = allDbPerms.map(p => ({ roleId: adminRole.id, permissionId: p.id }));
  const accountantPerms = allDbPerms
    .filter(p => !p.code.startsWith('user.'))
    .map(p => ({ roleId: accountantRole.id, permissionId: p.id }));
  // USER gets no internal permissions

  // Safe insert for RolePermissions
  for (const rp of [...adminPerms, ...accountantPerms]) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: rp.roleId,
          permissionId: rp.permissionId,
        },
      },
      update: {},
      create: rp,
    });
  }
  console.log('Role Permissions seeded.');

  // 4. Seed Initial Users
  const users = [
    {
      loginId: 'admin001',
      email: 'admin@example.com',
      name: 'System Admin',
      password: 'Admin@12345',
      roleId: adminRole.id,
    },
    {
      loginId: 'accountant001',
      email: 'accountant@example.com',
      name: 'System Accountant',
      password: 'Accountant@12345',
      roleId: accountantRole.id,
    },
    {
      loginId: 'user001',
      email: 'user@example.com',
      name: 'Portal User',
      password: 'User@12345',
      roleId: userRole.id,
    },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { loginId: u.loginId } });
    if (!existing) {
      const hash = await bcrypt.hash(u.password, 10);
      await prisma.user.create({
        data: {
          loginId: u.loginId,
          email: u.email,
          name: u.name,
          passwordHash: hash,
          roleId: u.roleId,
        }
      });
      console.log(`Created user ${u.loginId}`);
    }
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
