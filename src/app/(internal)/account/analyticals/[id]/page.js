'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import analyticAccountService from '@/services/analytic.service';
import AnalyticAccountForm from '@/components/forms/AnalyticAccountForm';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';

export default function AnalyticAccountDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, loading, error, reload } = useApiResource(
    () => analyticAccountService.get(id),
    [id],
  );

  const update = useSubmit((payload) => analyticAccountService.update(id, payload), {
    onSuccess: () => {
      toast.success('Analytic account updated');
      reload();
    },
  });

  const remove = useSubmit(() => analyticAccountService.remove(id), {
    onSuccess: () => {
      toast.success('Analytic account deleted');
      router.replace('/account/analyticals');
    },
    onError: (err) => {
      setConfirmDelete(false);
      toast.error(err.message);
    },
  });

  if (loading) return <Loading label="Loading analytic account..." />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <ErrorState error={{ status: 404, message: 'Analytic account not found' }} />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={data.name}
        subtitle={data.type}
        backHref="/account/analyticals"
        backLabel="Analyticals"
        actions={
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        }
      />

      <AnalyticAccountForm
        isEdit
        initial={data}
        onSubmit={update.submit}
        submitting={update.submitting}
        error={update.error}
        onCancel={() => router.push('/account/analyticals')}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this analytic account?"
        message={`"${data.name}" will be removed. The backend blocks the delete when budgets or document lines reference it - deactivate it instead.`}
        confirmLabel="Delete"
        loading={remove.submitting}
        onConfirm={() => remove.submit()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
