import api from '@/lib/apiClient';

export const paymentService = {
  list: () => api.get('/payments'),
  /** Backend creates the payment already CONFIRMED and posts the journal entry. */
  create: (payload) => api.post('/payments', payload),
  /** Allocation is what moves an invoice / bill to PARTIALLY_PAID or PAID. */
  allocate: (paymentId, payload) => api.post(`/payments/${paymentId}/allocations`, payload),
};

/** Convenience: register a payment and allocate it to one document in one flow. */
export async function payDocument({
  partnerId,
  partnerType,
  paymentType,
  amount,
  paymentDate,
  paymentMethod,
  reference,
  note,
  documentType,
  customerInvoiceId,
  vendorBillId,
}) {
  const created = await paymentService.create({
    partnerId,
    partnerType,
    paymentType,
    amount: Number(amount),
    paymentDate,
    paymentMethod,
    reference: reference || undefined,
    note: note || undefined,
  });

  const payment = created?.data;
  const allocation = await paymentService.allocate(payment.id, {
    documentType,
    customerInvoiceId,
    vendorBillId,
    allocatedAmount: Number(amount),
  });

  return { payment, allocation: allocation?.data };
}

export default paymentService;
