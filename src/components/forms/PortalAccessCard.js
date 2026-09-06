'use client';

import { useMemo, useState } from 'react';
import { useApiResource } from '@/hooks/useApiResource';
import contactService from '@/services/contact.api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { SelectField } from '@/components/ui/Field';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';

/**
 * Grants portal accounts access to one customer's documents.
 *
 * The backend keys portal visibility off this mapping, so a customer's invoices
 * are visible to exactly the accounts listed here - and to nobody else. A new
 * portal account sees an empty portal until it is added to a customer.
 */
export default function PortalAccessCard({
  contactId,
  contactName,
  title = 'Portal access',
  subtitle = "Accounts that can sign in and see this customer's invoices and payments",
  className = 'mt-4',
}) {
  const toast = useToast();
  const [selected, setSelected] = useState('');
  const [revoking, setRevoking] = useState(null);

  const linked = useApiResource(() => contactService.portalUsers(contactId), [contactId]);
  const candidates = useApiResource(() => contactService.portalCandidates(), []);

  const linkedUsers = useMemo(() => linked.data ?? [], [linked.data]);

  // Only offer accounts that do not already have access.
  const available = useMemo(() => {
    const has = new Set(linkedUsers.map((u) => u.id));
    return (candidates.data ?? []).filter((u) => !has.has(u.id));
  }, [candidates.data, linkedUsers]);

  const grant = useSubmit(() => contactService.grantPortalAccess(contactId, selected), {
    onSuccess: () => {
      toast.success('Portal access granted');
      setSelected('');
      linked.reload();
    },
    onError: (err) => toast.error(err.message),
  });

  const revoke = useSubmit(() => contactService.revokePortalAccess(contactId, revoking.id), {
    onSuccess: () => {
      toast.success('Portal access revoked');
      setRevoking(null);
      linked.reload();
    },
    onError: (err) => {
      setRevoking(null);
      toast.error(err.message);
    },
  });

  return (
    <Card className={className} title={title} subtitle={subtitle}>
      {linked.loading ? (
        <Loading label="Loading portal access..." />
      ) : linked.error ? (
        <ErrorState error={linked.error} onRetry={linked.reload} />
      ) : (
        <>
          {linkedUsers.length === 0 ? (
            <EmptyState
              icon="🔒"
              title="No portal access yet"
              description={`No one can see ${contactName || 'this customer'}'s invoices in the portal. Grant a portal account below.`}
            />
          ) : (
            <ul className="divide-y divide-stone-100">
              {linkedUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900">
                      {user.name || user.loginId}
                    </p>
                    <p className="text-xs text-stone-500">
                      {user.loginId} &middot; {user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={user.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    <Button size="sm" variant="danger" onClick={() => setRevoking(user)}>
                      Revoke
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-end gap-3 border-t border-stone-200 p-4">
            <SelectField
              label="Grant access to a portal account"
              name="portalUser"
              className="min-w-[240px] flex-1"
              placeholder={
                available.length === 0 ? 'No portal accounts available' : 'Select an account'
              }
              value={selected}
              disabled={available.length === 0}
              hint="Only registered portal (USER) accounts appear here"
              onChange={(e) => setSelected(e.target.value)}
              options={available.map((user) => ({
                value: user.id,
                label: `${user.name || user.loginId} (${user.loginId})`,
              }))}
            />
            <Button
              onClick={() => grant.submit()}
              disabled={!selected}
              loading={grant.submitting}
            >
              Grant access
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(revoking)}
        title="Revoke portal access?"
        message={`${revoking?.name || revoking?.loginId} will no longer see ${contactName || 'this customer'}'s invoices or payments in the portal.`}
        confirmLabel="Revoke"
        loading={revoke.submitting}
        onConfirm={() => revoke.submit()}
        onCancel={() => setRevoking(null)}
      />
    </Card>
  );
}
