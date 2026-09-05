'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import {
  journalEntryService,
  journalService,
  accountService,
} from '@/services/accounting.api';
import contactService from '@/services/contact.api';
import analyticAccountService from '@/services/analytic.service';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import ErrorState, { FormError } from '@/components/ui/ErrorState';
import { SelectField, TextField } from '@/components/ui/Field';
import JournalItemsEditor, {
  emptyItem,
  toItemsPayload,
  validateItems,
} from '@/components/accounting/JournalItemsEditor';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';
import { today } from '@/utils/format';

export default function NewJournalEntryPage() {
  const router = useRouter();
  const toast = useToast();

  const journals = useApiResource(() => journalService.list(), []);
  const accounts = useApiResource(() => accountService.list({ isActive: 'true' }), []);
  const contacts = useApiResource(() => contactService.list(), []);
  const analytics = useApiResource(() => analyticAccountService.list(), []);

  const [form, setForm] = useState({
    journalId: '',
    partnerId: '',
    accountingDate: today(),
    documentDate: today(),
  });
  const [items, setItems] = useState([emptyItem(), emptyItem()]);
  const [fieldErrors, setFieldErrors] = useState({});

  const { submit, submitting, error } = useSubmit(
    (payload) => journalEntryService.create(payload),
    {
      onSuccess: (response) => {
        toast.success('Journal entry created as draft');
        router.replace(`/account/journal-entries/${response.data.id}`);
      },
    },
  );

  const onSubmit = (event) => {
    event.preventDefault();
    const errors = validateItems(items);
    if (!form.journalId) errors.journalId = 'Journal is required';
    if (!form.accountingDate) errors.accountingDate = 'Accounting date is required';
    if (!form.documentDate) errors.documentDate = 'Document date is required';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    submit({
      journalId: form.journalId,
      partnerId: form.partnerId || null,
      accountingDate: form.accountingDate,
      documentDate: form.documentDate,
      sourceType: 'MANUAL',
      items: toItemsPayload(items),
    });
  };

  const loading =
    journals.loading || accounts.loading || contacts.loading || analytics.loading;
  const loadError = journals.error || accounts.error || contacts.error || analytics.error;

  if (loading) return <Loading label="Loading accounting masters..." />;
  if (loadError) {
    return (
      <ErrorState
        error={loadError}
        onRetry={() => {
          journals.reload();
          accounts.reload();
          contacts.reload();
          analytics.reload();
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="New journal entry"
        subtitle="Saved as a draft. Posting is a separate step and requires a balanced entry."
        backHref="/account/journal-entries"
        backLabel="Journal entries"
      />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError error={error} />
        {fieldErrors.items && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {fieldErrors.items}
          </div>
        )}

        <Card title="Entry details" bodyClassName="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectField
              label="Journal"
              name="journalId"
              required
              value={form.journalId}
              error={fieldErrors.journalId}
              onChange={(e) => setForm({ ...form, journalId: e.target.value })}
              options={(journals.data ?? [])
                .filter((journal) => journal.isActive)
                .map((journal) => ({
                  value: journal.id,
                  label: `${journal.name} (${journal.type})`,
                }))}
            />
            <SelectField
              label="Partner"
              name="partnerId"
              placeholder="None"
              value={form.partnerId}
              onChange={(e) => setForm({ ...form, partnerId: e.target.value })}
              options={(contacts.data ?? []).map((contact) => ({
                value: contact.id,
                label: contact.name,
              }))}
            />
            <TextField
              label="Accounting Date"
              name="accountingDate"
              type="date"
              required
              value={form.accountingDate}
              error={fieldErrors.accountingDate}
              onChange={(e) => setForm({ ...form, accountingDate: e.target.value })}
            />
            <TextField
              label="Document Date"
              name="documentDate"
              type="date"
              required
              value={form.documentDate}
              error={fieldErrors.documentDate}
              onChange={(e) => setForm({ ...form, documentDate: e.target.value })}
            />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            The entry number is generated by the backend from the journal type.
          </p>
        </Card>

        <Card title="Entry lines">
          <JournalItemsEditor
            items={items}
            onChange={setItems}
            accounts={accounts.data ?? []}
            partners={contacts.data ?? []}
            analyticAccounts={analytics.data ?? []}
            errors={fieldErrors}
          />
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={submitting}>
            Save as draft
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/account/journal-entries')}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
