import { ROLES } from '@/utils/constants';

/**
 * Sidebar structure taken from the wireframe:
 * Sales / Purchase / Account / Report, plus Users for ADMIN only.
 * `roles` limits who sees a group; page-level guards enforce the same rule.
 */
export const INTERNAL_NAV = [
  {
    label: 'Dashboard',
    items: [{ label: 'Dashboard', href: '/dashboard' }],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Sales Orders', href: '/sales/orders' },
      { label: 'Sale Invoice', href: '/sales/invoices' },
      { label: 'Receipt', href: '/sales/receipts' },
    ],
  },
  {
    label: 'Purchase',
    items: [
      { label: 'Purchase Orders', href: '/purchase/orders' },
      { label: 'Purchase Bills', href: '/purchase/bills' },
      { label: 'Payment', href: '/purchase/payments' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Contact', href: '/account/contacts' },
      { label: 'Product', href: '/account/products' },
      { label: 'Analyticals', href: '/account/analyticals' },
      { label: 'Analytical Budget', href: '/account/budgets' },
      { label: 'Chart of Account', href: '/account/chart-of-accounts' },
      { label: 'Journals', href: '/account/journals' },
      { label: 'Journal Entries', href: '/account/journal-entries' },
      { label: 'Ledger', href: '/account/ledger' },
    ],
  },
  {
    label: 'Report',
    items: [
      { label: 'Balance Sheet', href: '/reports/balance-sheet' },
      { label: 'Profit and Loss', href: '/reports/profit-and-loss' },
      { label: 'Budget Report', href: '/reports/budget' },
    ],
  },
  {
    label: 'Administration',
    roles: [ROLES.ADMIN],
    items: [{ label: 'Users', href: '/users' }],
  },
];

export const PORTAL_NAV = [
  {
    label: 'Portal',
    items: [
      { label: 'Dashboard', href: '/portal' },
      { label: 'My Invoices', href: '/portal/invoices' },
      { label: 'My Payments', href: '/portal/payments' },
      { label: 'Profile', href: '/portal/profile' },
    ],
  },
];

export function navForRole(role) {
  if (role === ROLES.USER) return PORTAL_NAV;
  return INTERNAL_NAV.filter((group) => !group.roles || group.roles.includes(role));
}
