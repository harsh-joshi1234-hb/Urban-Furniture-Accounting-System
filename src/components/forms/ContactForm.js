'use client';

import { useState } from 'react';
import { TextField, SelectField } from '@/components/ui/Field';
import ImageInput from '@/components/ui/ImageInput';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FormError } from '@/components/ui/ErrorState';
import { CONTACT_TYPES } from '@/utils/constants';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY = {
  name: '',
  type: 'CUSTOMER',
  imageUrl: '',
  phone: '',
  email: '',
  street: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
};

export default function ContactForm({ initial, onSubmit, submitting, error, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY, ...(initial || {}) });
  const [fieldErrors, setFieldErrors] = useState({});

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const errors = {};
    if (!form.name.trim()) errors.name = 'Contact name is required';
    if (!CONTACT_TYPES.includes(form.type)) errors.type = 'Select customer or vendor';
    if (form.email && !EMAIL_RE.test(form.email)) errors.email = 'Enter a valid email';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      type: form.type,
      imageUrl: form.imageUrl?.trim() || null,
      phone: form.phone?.trim() || null,
      email: form.email?.trim() || null,
      street: form.street?.trim() || null,
      city: form.city?.trim() || null,
      state: form.state?.trim() || null,
      country: form.country?.trim() || null,
      pincode: form.pincode?.trim() || null,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormError error={error} />

      <Card title="Contact details" bodyClassName="p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Contact Name"
            name="name"
            required
            value={form.name}
            error={fieldErrors.name}
            onChange={update('name')}
          />
          <SelectField
            label="Customer / Vendor"
            name="type"
            required
            placeholder={null}
            value={form.type}
            error={fieldErrors.type}
            onChange={update('type')}
            options={CONTACT_TYPES.map((type) => ({
              value: type,
              label: type === 'CUSTOMER' ? 'Customer' : 'Vendor',
            }))}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email || ''}
            error={fieldErrors.email}
            hint="Must be unique across contacts"
            onChange={update('email')}
          />
          <TextField
            label="Phone"
            name="phone"
            value={form.phone || ''}
            onChange={update('phone')}
          />
          <div className="sm:col-span-2">
            <ImageInput
              label="Contact Image"
              value={form.imageUrl}
              onChange={(val) => setForm((curr) => ({ ...curr, imageUrl: val }))}
            />
          </div>
        </div>
      </Card>

      <Card title="Address" bodyClassName="p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Street"
            name="street"
            className="sm:col-span-2"
            value={form.street || ''}
            onChange={update('street')}
          />
          <TextField label="City" name="city" value={form.city || ''} onChange={update('city')} />
          <TextField
            label="State"
            name="state"
            value={form.state || ''}
            onChange={update('state')}
          />
          <TextField
            label="Country"
            name="country"
            value={form.country || ''}
            onChange={update('country')}
          />
          <TextField
            label="Pincode"
            name="pincode"
            value={form.pincode || ''}
            onChange={update('pincode')}
          />
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={submitting}>
          Save
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
