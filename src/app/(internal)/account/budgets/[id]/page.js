'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import budgetService from '@/services/budget.api';
import PageHeader from '@/components/ui/PageHeader';
import Card, { StatCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import ErrorState, { FormError } from '@/components/ui/ErrorState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import { TextField } from '@/components/ui/Field';
import ProgressBar from '@/components/accounting/ProgressBar';
import PieChartModal from '@/components/ui/PieChartModal';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate, formatNumber, toDateInput } from '@/utils/format';

export default function BudgetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();

  const [confirmAction, setConfirmAction] = useState(null);
  const [editing, setEditing] = useState(false);
  const [revising, setRevising] = useState(false);
  const [pieChartOpen, setPieChartOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: '',
    committedAmount: '',
    startDate: '',
    endDate: '',
  });
  const [revision, setRevision] = useState({ committedAmount: '', endDate: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const budget = useApiResource(() => budgetService.get(id), [id]);

  const confirmBudget = useSubmit(() => budgetService.confirm(id), {
    onSuccess: () => {
      toast.success('Budget confirmed');
      setConfirmAction(null);
      budget.reload();
    },
    onError: (err) => {
      setConfirmAction(null);
      toast.error(err.message);
    },
  });

  const cancelBudget = useSubmit(() => budgetService.cancel(id), {
    onSuccess: () => {
      toast.success('Budget cancelled');
      setConfirmAction(null);
      budget.reload();
    },
    onError: (err) => {
      setConfirmAction(null);
      toast.error(err.message);
    },
  });

  const save = useSubmit(
    () =>
      budgetService.update(id, {
        name: draft.name.trim(),
        committedAmount: Number(draft.committedAmount),
        startDate: draft.startDate,
        endDate: draft.endDate,
      }),
    {
      onSuccess: () => {
        toast.success('Budget updated');
        setEditing(false);
        budget.reload();
      },
    },
  );

  const revise = useSubmit(
    () =>
      budgetService.revise(id, {
        committedAmount: Number(revision.committedAmount),
        ...(revision.endDate ? { endDate: revision.endDate } : {}),
      }),
    {
      onSuccess: (response) => {
        toast.success('Budget revised');
        setRevising(false);
        // The backend returns the new CONFIRMED budget; the original becomes REVISED.
        router.push(`/account/budgets/${response.data.id}`);
      },
    },
  );

  if (budget.loading) return <Loading label="Loading budget..." />;
  if (budget.error) return <ErrorState error={budget.error} onRetry={budget.reload} />;
  if (!budget.data) return <ErrorState error={{ status: 404, message: 'Budget not found' }} />;

  const doc = budget.data;
  const isDraft = doc.status === 'DRAFT';
  const isConfirmed = doc.status === 'CONFIRMED';
  const canCancel = !['CANCELLED', 'REVISED'].includes(doc.status);

  const startEdit = () => {
    setDraft({
      name: doc.name,
      committedAmount: String(Number(doc.committedAmount)),
      startDate: toDateInput(doc.startDate),
      endDate: toDateInput(doc.endDate),
    });
    setFieldErrors({});
    setEditing(true);
  };

  const openRevise = () => {
    setRevision({ committedAmount: String(Number(doc.committedAmount)), endDate: '' });
    setFieldErrors({});
    setRevising(true);
  };

  const onSave = (event) => {
    event.preventDefault();
    const errors = {};
    if (!draft.name.trim()) errors.name = 'Name is required';
    if (
      draft.committedAmount === '' ||
      Number.isNaN(Number(draft.committedAmount)) ||
      Number(draft.committedAmount) < 0
    ) {
      errors.committedAmount = 'Committed amount must be a non-negative number';
    }
    if (draft.startDate && draft.endDate && new Date(draft.endDate) < new Date(draft.startDate)) {
      errors.endDate = 'End date cannot be before start date';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    save.submit();
  };

  const onRevise = (event) => {
    event.preventDefault();
    const errors = {};
    if (
      revision.committedAmount === '' ||
      Number.isNaN(Number(revision.committedAmount)) ||
      Number(revision.committedAmount) < 0
    ) {
      errors.revisedAmount = 'Enter the new committed amount';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    revise.submit();
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={doc.name}
        subtitle={`${doc.analyticAccount?.name || ''} - ${formatDate(doc.startDate)} to ${formatDate(doc.endDate)}`}
        backHref="/account/budgets"
        backLabel="Budgets"
        actions={
          <>
            <Button variant="secondary" onClick={() => setPieChartOpen(true)} title="View Budget Chart">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 -mx-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
              </svg>
            </Button>
            {isDraft && !editing && (
              <Button variant="secondary" onClick={startEdit}>
                Edit
              </Button>
            )}
            {isDraft && (
              <Button variant="success" onClick={() => setConfirmAction('confirm')}>
                Confirm
              </Button>
            )}
            {isConfirmed && <Button onClick={openRevise}>Revise</Button>}
            {canCancel && (
              <Button variant="danger" onClick={() => setConfirmAction('cancel')}>
                Cancel
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Committed" value={formatCurrency(doc.committedAmount)} />
        <StatCard label="Achieved" value={formatCurrency(doc.achievedAmount)} tone="green" />
        <StatCard
          label="Amount To Achieve"
          value={formatCurrency(doc.amountToAchieve)}
          tone={Number(doc.amountToAchieve) < 0 ? 'red' : 'amber'}
        />
        <StatCard
          label="Achieved %"
          value={`${formatNumber(doc.achievedPct, 1)}%`}
          tone="brand"
        />
      </div>

      <Card className="mt-4" bodyClassName="p-4">
        <ProgressBar value={doc.achievedPct} />
        <p className="mt-2 text-xs text-stone-500">
          Achieved, amount to achieve and percentage are computed by the backend from
          confirmed {doc.type === 'INCOME' ? 'customer invoice' : 'vendor bill'} lines
          carrying this analytic account within the budget period.
        </p>
      </Card>

      <Card
        className="mt-4"
        title="Budget details"
        actions={<Badge status={doc.status} />}
        bodyClassName="p-4"
      >
        {editing ? (
          <form onSubmit={onSave} className="space-y-4" noValidate>
            <FormError error={save.error} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="Budget Name"
                name="name"
                required
                className="sm:col-span-2"
                value={draft.name}
                error={fieldErrors.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
              <TextField
                label="Start Date"
                name="startDate"
                type="date"
                value={draft.startDate}
                onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
              />
              <TextField
                label="End Date"
                name="endDate"
                type="date"
                value={draft.endDate}
                error={fieldErrors.endDate}
                onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
              />
              <TextField
                label="Committed Amount"
                name="committedAmount"
                type="number"
                min="0"
                step="0.01"
                required
                value={draft.committedAmount}
                error={fieldErrors.committedAmount}
                onChange={(e) => setDraft({ ...draft, committedAmount: e.target.value })}
              />
            </div>
            <p className="text-xs text-stone-500">
              Only draft budgets can be edited. The analytic account and responsible contact
              are fixed once created.
            </p>
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
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Analyticals</dt>
              <dd className="mt-0.5 text-stone-800">{doc.analyticAccount?.name || '-'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Type</dt>
              <dd className="mt-0.5 text-stone-800">{doc.type}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Responsible</dt>
              <dd className="mt-0.5 text-stone-800">{doc.responsibleContact?.name || '-'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Budget Period</dt>
              <dd className="mt-0.5 text-stone-800">
                {formatDate(doc.startDate)} to {formatDate(doc.endDate)}
              </dd>
            </div>
            {doc.revisionOf && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-stone-500">Revision Of</dt>
                <dd className="mt-0.5">
                  <Link
                    href={`/account/budgets/${doc.revisionOf.id}`}
                    className="text-brand-600 hover:text-brand-700"
                  >
                    {doc.revisionOf.name}
                  </Link>
                </dd>
              </div>
            )}
            {doc.revisedBudgets?.length > 0 && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-stone-500">Revised With</dt>
                <dd className="mt-0.5 space-y-0.5">
                  {doc.revisedBudgets.map((revised) => (
                    <Link
                      key={revised.id}
                      href={`/account/budgets/${revised.id}`}
                      className="block text-brand-600 hover:text-brand-700"
                    >
                      {revised.name}
                    </Link>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        )}
      </Card>

      <Modal
        open={revising}
        onClose={revise.submitting ? undefined : () => setRevising(false)}
        title="Revise this budget"
        description="This budget moves to REVISED and a new confirmed budget is created, linked back to it."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRevising(false)}
              disabled={revise.submitting}
            >
              Cancel
            </Button>
            <Button onClick={onRevise} loading={revise.submitting}>
              Revise
            </Button>
          </>
        }
      >
        <form onSubmit={onRevise} className="space-y-4" noValidate>
          <FormError error={revise.error} />
          <TextField
            label="New Committed Amount"
            name="revisedAmount"
            type="number"
            min="0"
            step="0.01"
            required
            value={revision.committedAmount}
            error={fieldErrors.revisedAmount}
            onChange={(e) => setRevision({ ...revision, committedAmount: e.target.value })}
          />
          <TextField
            label="New End Date"
            name="revisedEndDate"
            type="date"
            hint="Optional - leave blank to keep the current end date"
            value={revision.endDate}
            onChange={(e) => setRevision({ ...revision, endDate: e.target.value })}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmAction === 'confirm'}
        title="Confirm this budget?"
        message="Confirming locks the budget. After that it can only be revised or cancelled."
        confirmLabel="Confirm"
        variant="success"
        loading={confirmBudget.submitting}
        onConfirm={() => confirmBudget.submit()}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'cancel'}
        title="Cancel this budget?"
        message="The budget moves to CANCELLED. Revised budgets cannot be cancelled directly."
        confirmLabel="Cancel budget"
        loading={cancelBudget.submitting}
        onConfirm={() => cancelBudget.submit()}
        onCancel={() => setConfirmAction(null)}
      />

      <PieChartModal 
        isOpen={pieChartOpen} 
        data={doc} 
        onClose={() => setPieChartOpen(false)} 
      />
    </div>
  );
}
