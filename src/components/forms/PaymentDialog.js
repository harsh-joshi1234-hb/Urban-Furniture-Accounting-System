'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SelectField, TextField, TextAreaField } from '@/components/ui/Field';
import { FormError } from '@/components/ui/ErrorState';
import { payDocument } from '@/services/payment.api';
import useSubmit from '@/hooks/useSubmit';
import { PAYMENT_METHODS } from '@/utils/constants';
import { formatCurrency, today } from '@/utils/format';

/**
 * Register a payment against one invoice or bill.
 *
 * The backend creates the payment, posts the journal entry and derives the new
 * document status from the allocation. The frontend never sets a paid status.
 */
export default function PaymentDialog({
  open,
  onClose,
  onPaid,
  documentType, // 'CUSTOMER_INVOICE' | 'VENDOR_BILL'
  documentId,
  partner,
  amountDue,
}) {
  const isReceive = documentType === 'CUSTOMER_INVOICE';
  const [form, setForm] = useState({
    amount: '',
    paymentDate: today(),
    paymentMethod: 'BANK',
    reference: '',
    note: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const { submit, submitting, error, setError } = useSubmit(
    (payload) => payDocument(payload),
    {
      onSuccess: () => {
        setForm({
          amount: '',
          paymentDate: today(),
          paymentMethod: 'BANK',
          reference: '',
          note: '',
        });
        setFieldErrors({});
        onPaid?.();
      },
    },
  );

  const close = () => {
    setError(null);
    setFieldErrors({});
    onClose?.();
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const errors = {};
    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    } else if (amountDue !== undefined && amount > Number(amountDue)) {
      errors.amount = `Cannot exceed the amount due (${formatCurrency(amountDue)})`;
    }
    if (!form.paymentDate) errors.paymentDate = 'Payment date is required';
    if (!PAYMENT_METHODS.includes(form.paymentMethod)) {
      errors.paymentMethod = 'Select a payment method';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    submit({
      partnerId: partner?.id,
      partnerType: isReceive ? 'CUSTOMER' : 'VENDOR',
      paymentType: isReceive ? 'RECEIVE' : 'SEND',
      amount,
      paymentDate: form.paymentDate,
      paymentMethod: form.paymentMethod,
      reference: form.reference,
      note: form.note,
      documentType,
      customerInvoiceId: isReceive ? documentId : undefined,
      vendorBillId: isReceive ? undefined : documentId,
    });
  };

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : close}
      title={isReceive ? 'Receive customer payment' : 'Send vendor payment'}
      description={`Payment Type: ${isReceive ? 'Receive' : 'Send'}`}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={submitting}>
            Confirm payment
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormError error={error} />

        <div className="rounded-md bg-slate-50 px-3 py-2 text-sm">
          <p className="text-slate-600">
            Partner: <span className="font-medium text-slate-900">{partner?.name}</span>
          </p>
          {amountDue !== undefined && (
            <p className="text-slate-600">
              Amount due:{' '}
              <span className="font-medium text-slate-900">{formatCurrency(amountDue)}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.amount}
            error={fieldErrors.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <TextField
            label="Date"
            name="paymentDate"
            type="date"
            required
            value={form.paymentDate}
            error={fieldErrors.paymentDate}
            onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
          />
          <SelectField
            label="Payment Via"
            name="paymentMethod"
            required
            placeholder={null}
            value={form.paymentMethod}
            error={fieldErrors.paymentMethod}
            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            options={PAYMENT_METHODS.map((method) => ({ value: method, label: method }))}
          />
          <TextField
            label="Reference"
            name="reference"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
          />
          <TextAreaField
            label="Note"
            name="note"
            className="sm:col-span-2"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>

        {amountDue !== undefined && Number(amountDue) > 0 && (
          <button
            type="button"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            onClick={() => setForm({ ...form, amount: String(amountDue) })}
          >
            Pay full amount due
          </button>
        )}
      </form>
    </Modal>
  );
}
