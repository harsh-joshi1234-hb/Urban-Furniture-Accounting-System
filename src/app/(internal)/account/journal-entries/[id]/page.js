'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import { journalEntryService, accountService } from '@/services/accounting.api';
import contactService from '@/services/contact.api';
import analyticAccountService from '@/services/analytic.service';
import PageHeader from '@/components/ui/PageHeader';
import Card, { StatCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import ErrorState, { FormError } from '@/components/ui/ErrorState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { TextField, SelectField } from '@/components/ui/Field';
import JournalItemsEditor, {
  toEditorItems,
  toItemsPayload,
  validateItems,
} from '@/components/accounting/JournalItemsEditor';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate, titleCase, toDateInput } from '@/utils/format';
import { sumAmounts } from '@/utils/money';

/** Links a posted entry back to the document that produced it. */
function sourceHref(entry) {
  if (!entry?.sourceId) return null;
  switch (entry.sourceType) {
    case 'CUSTOMER_INVOICE':
      return `/sales/invoices/${entry.sourceId}`;
    case 'VENDOR_BILL':
      return `/purchase/bills/${entry.sourceId}`;
    default:
      return null;
  }
}

export default function JournalEntryDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [confirmAction, setConfirmAction] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ accountingDate: '', documentDate: '', partnerId: '' });
  const [items, setItems] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  const entry = useApiResource(() => journalEntryService.get(id), [id]);
  const accounts = useApiResource(() => accountService.list(), []);
  const contacts = useApiResource(() => contactService.list(), []);
  const analytics = useApiResource(() => analyticAccountService.list(), []);

  const postEntry = useSubmit(() => journalEntryService.post(id), {
    onSuccess: () => {
      toast.success('Journal entry posted');
      setConfirmAction(null);
      entry.reload();
    },
    onError: (err) => {
      setConfirmAction(null);
      toast.error(err.message);
    },
  });

  const cancelEntry = useSubmit(() => journalEntryService.cancel(id), {
    onSuccess: () => {
      toast.success('Journal entry cancelled');
      setConfirmAction(null);
      entry.reload();
    },
    onError: (err) => {
      setConfirmAction(null);
      toast.error(err.message);
    },
  });

  const save = useSubmit(
    () =>
      journalEntryService.update(id, {
        accountingDate: draft.accountingDate,
        documentDate: draft.documentDate,
        partnerId: draft.partnerId || null,
        items: toItemsPayload(items),
      }),
    {
      onSuccess: () => {
        toast.success('Journal entry updated');
        setEditing(false);
        entry.reload();
      },
    },
  );

  if (entry.loading) return <Loading label="Loading journal entry..." />;
  if (entry.error) return <ErrorState error={entry.error} onRetry={entry.reload} />;
  if (!entry.data) {
    return <ErrorState error={{ status: 404, message: 'Journal entry not found' }} />;
  }

  const doc = entry.data;
  const isDraft = doc.status === 'DRAFT';
  const totalDebit = sumAmounts((doc.items ?? []).map((item) => item.debit));
  const totalCredit = sumAmounts((doc.items ?? []).map((item) => item.credit));
  const accountList = accounts.data ?? [];
  const contactList = contacts.data ?? [];

  const accountLabel = (accountId) => {
    const account = accountList.find((item) => item.id === accountId);
    return account ? `${account.code} - ${account.name}` : '-';
  };
  const contactName = (partnerId) =>
    contactList.find((item) => item.id === partnerId)?.name || '-';

  const startEdit = () => {
    setDraft({
      accountingDate: toDateInput(doc.accountingDate),
      documentDate: toDateInput(doc.documentDate),
      partnerId: doc.partnerId || '',
    });
    setItems(toEditorItems(doc.items));
    setFieldErrors({});
    setEditing(true);
  };

  const onSave = (event) => {
    event.preventDefault();
    const errors = validateItems(items);
    if (!draft.accountingDate) errors.accountingDate = 'Required';
    if (!draft.documentDate) errors.documentDate = 'Required';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    save.submit();
  };

  const href = sourceHref(doc);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={doc.number}
        subtitle={`${doc.journal?.name || ''} - ${formatDate(doc.accountingDate)}`}
        backHref="/account/journal-entries"
        backLabel="Journal entries"
        actions={
          <>
            {href && (
              <Link href={href}>
                <Button variant="secondary">Source document</Button>
              </Link>
            )}
            {isDraft && !editing && (
              <Button variant="secondary" onClick={startEdit}>
                Edit
              </Button>
            )}
            {isDraft && (
              <Button variant="success" onClick={() => setConfirmAction('post')}>
                Post
              </Button>
            )}
            {doc.status !== 'CANCELLED' && (
              <Button variant="danger" onClick={() => setConfirmAction('cancel')}>
                Cancel
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Debit" value={formatCurrency(totalDebit)} />
        <StatCard label="Total Credit" value={formatCurrency(totalCredit)} />
        <StatCard label="Entry Total" value={formatCurrency(doc.total)} tone="brand" />
      </div>

      <Card
        className="mt-4"
        title="Entry details"
        actions={<Badge status={doc.status} />}
        bodyClassName="p-4"
      >
        {editing ? (
          <form onSubmit={onSave} className="space-y-4" noValidate>
            <FormError error={save.error} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TextField
                label="Accounting Date"
                name="accountingDate"
                type="date"
                required
                value={draft.accountingDate}
                error={fieldErrors.accountingDate}
                onChange={(e) => setDraft({ ...draft, accountingDate: e.target.value })}
              />
              <TextField
                label="Document Date"
                name="documentDate"
                type="date"
                required
                value={draft.documentDate}
                error={fieldErrors.documentDate}
                onChange={(e) => setDraft({ ...draft, documentDate: e.target.value })}
              />
              <SelectField
                label="Partner"
                name="partnerId"
                placeholder="None"
                value={draft.partnerId}
                onChange={(e) => setDraft({ ...draft, partnerId: e.target.value })}
                options={contactList.map((contact) => ({
                  value: contact.id,
                  label: contact.name,
                }))}
              />
            </div>
            {fieldErrors.items && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {fieldErrors.items}
              </div>
            )}
            <JournalItemsEditor
              items={items}
              onChange={setItems}
              accounts={accountList.filter((account) => account.isActive)}
              partners={contactList}
              analyticAccounts={analytics.data ?? []}
              errors={fieldErrors}
            />
            <p className="text-xs text-stone-500">Only draft entries can be edited.</p>
            <div className="flex gap-2">
              <Button type="submit" loading={save.submitting}>
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => setEditing(false)}
                disabled={save.submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Number</dt>
              <dd className="mt-0.5 font-medium text-stone-900">{doc.number}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Journal</dt>
              <dd className="mt-0.5 text-stone-800">
                {doc.journal ? `${doc.journal.name} (${doc.journal.type})` : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Accounting Date</dt>
              <dd className="mt-0.5 text-stone-800">{formatDate(doc.accountingDate)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Document Date</dt>
              <dd className="mt-0.5 text-stone-800">{formatDate(doc.documentDate)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Source</dt>
              <dd className="mt-0.5 text-stone-800">{titleCase(doc.sourceType)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Partner</dt>
              <dd className="mt-0.5 text-stone-800">
                {doc.partnerId ? contactName(doc.partnerId) : '-'}
              </dd>
            </div>
            {doc.postedAt && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-stone-500">Posted</dt>
                <dd className="mt-0.5 text-stone-800">{formatDate(doc.postedAt)}</dd>
              </div>
            )}
            {doc.cancelledAt && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-stone-500">Cancelled</dt>
                <dd className="mt-0.5 text-stone-800">{formatDate(doc.cancelledAt)}</dd>
              </div>
            )}
          </dl>
        )}
      </Card>

      {!editing && (
        <Card title="Entry lines" className="mt-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-stone-500">
                    Account
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-stone-500">
                    Partner
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-stone-500">
                    Description
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-stone-500">
                    Debit
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-stone-500">
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(doc.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-stone-800">{accountLabel(item.accountId)}</td>
                    <td className="px-4 py-2 text-stone-600">
                      {item.partnerId ? contactName(item.partnerId) : '-'}
                    </td>
                    <td className="px-4 py-2 text-stone-600">{item.description || '-'}</td>
                    <td className="px-4 py-2 text-right text-stone-700">
                      {Number(item.debit) ? formatCurrency(item.debit) : '-'}
                    </td>
                    <td className="px-4 py-2 text-right text-stone-700">
                      {Number(item.credit) ? formatCurrency(item.credit) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-stone-50">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-stone-700">
                    Totals
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-stone-900">
                    {formatCurrency(totalDebit)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-stone-900">
                    {formatCurrency(totalCredit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={confirmAction === 'post'}
        title="Post this journal entry?"
        message="Posting makes the entry affect account balances and the reports. It can no longer be edited."
        confirmLabel="Post"
        variant="success"
        loading={postEntry.submitting}
        onConfirm={() => postEntry.submit()}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'cancel'}
        title="Cancel this journal entry?"
        message="The entry moves to CANCELLED and stops affecting balances."
        confirmLabel="Cancel entry"
        loading={cancelEntry.submitting}
        onConfirm={() => cancelEntry.submit()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
