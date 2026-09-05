'use client';

import AppShell from '@/components/layout/AppShell';
import { INTERNAL_ROLES } from '@/utils/constants';

export default function InternalLayout({ children }) {
  return <AppShell allow={INTERNAL_ROLES}>{children}</AppShell>;
}
