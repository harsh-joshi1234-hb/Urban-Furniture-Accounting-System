export const ROLES = {
  ADMIN: 'ADMIN',
  ACCOUNTANT: 'ACCOUNTANT',
  USER: 'USER',
};

export const INTERNAL_ROLES = [ROLES.ADMIN, ROLES.ACCOUNTANT];

export const CONTACT_TYPES = ['CUSTOMER', 'VENDOR'];
export const PRODUCT_TYPES = ['GOODS', 'SERVICE', 'COMBO'];
export const ANALYTIC_TYPES = ['INCOME', 'EXPENSE'];
export const PAYMENT_METHODS = ['BANK', 'CASH', 'ONLINE'];
export const ORDER_STATUSES = ['DRAFT', 'CONFIRMED', 'CANCELLED'];
export const INVOICE_STATUSES = [
  'DRAFT',
  'CONFIRMED',
  'PARTIALLY_PAID',
  'PAID',
  'CANCELLED',
];

export const BUDGET_STATUSES = ['DRAFT', 'CONFIRMED', 'REVISED', 'CANCELLED'];
export const JOURNAL_TYPES = ['SALES', 'PURCHASE', 'BANK', 'CASH'];
export const ENTRY_STATUSES = ['DRAFT', 'POSTED', 'CANCELLED'];

export const ACCOUNT_TYPES = [
  'ASSET',
  'LIABILITY',
  'BANK',
  'CASH',
  'CAPITAL',
  'INCOME',
  'EXPENSE',
  'OTHER_EXPENSE',
];

/** Tailwind classes per document status, used by the Badge component. */
export const STATUS_TONES = {
  DRAFT: 'slate',
  CONFIRMED: 'blue',
  PARTIALLY_PAID: 'amber',
  PAID: 'green',
  CANCELLED: 'red',
  POSTED: 'green',
  REVISED: 'amber',
  ACTIVE: 'green',
  INACTIVE: 'slate',
};
