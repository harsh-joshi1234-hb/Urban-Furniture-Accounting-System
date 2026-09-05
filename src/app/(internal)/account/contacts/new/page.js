'use client';

import { useRouter } from 'next/navigation';
import contactService from '@/services/contact.api';
import ContactForm from '@/components/forms/ContactForm';
import PageHeader from '@/components/ui/PageHeader';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';

export default function NewContactPage() {
  const router = useRouter();
  const toast = useToast();

  const { submit, submitting, error } = useSubmit(
    (payload) => contactService.create(payload),
    {
      onSuccess: (response) => {
        toast.success('Contact created');
        router.replace(`/account/contacts/${response.data.id}`);
      },
    },
  );

  return (
    <div className="max-w-4xl">
      <PageHeader title="New contact" backHref="/account/contacts" backLabel="Contacts" />
      <ContactForm
        onSubmit={submit}
        submitting={submitting}
        error={error}
        onCancel={() => router.push('/account/contacts')}
      />
    </div>
  );
}
