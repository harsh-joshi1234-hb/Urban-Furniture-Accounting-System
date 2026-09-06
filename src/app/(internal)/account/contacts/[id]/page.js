'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import contactService from '@/services/contact.api';
import ContactForm from '@/components/forms/ContactForm';
import PortalAccessCard from '@/components/forms/PortalAccessCard';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';

export default function ContactDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, loading, error, reload } = useApiResource(() => contactService.get(id), [id]);

  const update = useSubmit((payload) => contactService.update(id, payload), {
    onSuccess: () => {
      toast.success('Contact updated');
      reload();
    },
  });

  const remove = useSubmit(() => contactService.remove(id), {
    onSuccess: () => {
      toast.success('Contact deleted');
      router.replace('/account/contacts');
    },
    onError: (err) => {
      setConfirmDelete(false);
      toast.error(err.message);
    },
  });

  if (loading) return <Loading label="Loading contact..." />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <ErrorState error={{ status: 404, message: 'Contact not found' }} />;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={data.name}
        subtitle={data.type === 'CUSTOMER' ? 'Customer' : 'Vendor'}
        backHref="/account/contacts"
        backLabel="Contacts"
        actions={
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        }
      />

      <ContactForm
        initial={data}
        onSubmit={update.submit}
        submitting={update.submitting}
        error={update.error}
        onCancel={() => router.push('/account/contacts')}
      />

      {/* Portal access only applies to customers - vendors have no portal. */}
      {data.type === 'CUSTOMER' && (
        <PortalAccessCard contactId={data.id} contactName={data.name} />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this contact?"
        message={`"${data.name}" will be removed. The backend refuses the delete if the contact is used by any document.`}
        confirmLabel="Delete"
        loading={remove.submitting}
        onConfirm={() => remove.submit()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
