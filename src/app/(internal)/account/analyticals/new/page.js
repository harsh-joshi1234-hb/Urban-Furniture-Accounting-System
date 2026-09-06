'use client';

import { useRouter } from 'next/navigation';
import analyticAccountService from '@/services/analytic.service';
import AnalyticAccountForm from '@/components/forms/AnalyticAccountForm';
import PageHeader from '@/components/ui/PageHeader';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';

export default function NewAnalyticAccountPage() {
  const router = useRouter();
  const toast = useToast();

  const { submit, submitting, error } = useSubmit(
    (payload) => analyticAccountService.create(payload),
    {
      onSuccess: (response) => {
        toast.success('Analytic account created');
        router.replace(`/account/analyticals/${response.data.id}`);
      },
    },
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New analytic account"
        backHref="/account/analyticals"
        backLabel="Analyticals"
      />
      <AnalyticAccountForm
        onSubmit={submit}
        submitting={submitting}
        error={error}
        onCancel={() => router.push('/account/analyticals')}
      />
    </div>
  );
}
