'use client';

import AppShell from '@/components/layout/AppShell';
import { ROLES } from '@/utils/constants';

/**
 * Customer portal shell. Only USER accounts get here; internal staff are shown
 * an Access Denied state by the guard.
 */
export default function PortalLayout({ children }) {
  return <AppShell allow={[ROLES.USER]}>{children}</AppShell>;
}
