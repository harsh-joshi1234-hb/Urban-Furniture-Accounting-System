'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TextField, SelectField, CheckboxField } from '@/components/ui/Field';
import ImageInput from '@/components/ui/ImageInput';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FormError } from '@/components/ui/ErrorState';
import { PRODUCT_TYPES } from '@/utils/constants';

const EMPTY = {
  name: '',
  categoryId: '',
  productType: 'GOODS',
  salesPrice: '',
  cost: '',
  imageUrl: '',
  isActive: true,
};

export default function ProductForm({
  initial,
  categories = [],
  onSubmit,
  submitting,
  error,
  onCancel,
  isEdit = false,
}) {
  const [form, setForm] = useState({
    ...EMPTY,
    ...(initial
      ? {
          ...initial,
          salesPrice: String(initial.salesPrice ?? ''),
          cost: String(initial.cost ?? ''),
        }
      : {}),
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const errors = {};
    if (!form.name.trim()) errors.name = 'Product name is required';
    if (!form.categoryId) errors.categoryId = 'Category is required';
    if (!PRODUCT_TYPES.includes(form.productType)) errors.productType = 'Select a product type';
    if (form.salesPrice === '' || Number(form.salesPrice) < 0 || Number.isNaN(Number(form.salesPrice))) {
      errors.salesPrice = 'Sales price must be a non-negative number';
    }
    if (form.cost === '' || Number(form.cost) < 0 || Number.isNaN(Number(form.cost))) {
      errors.cost = 'Cost must be a non-negative number';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    onSubmit({
      name: form.name.trim(),
      categoryId: form.categoryId,
      productType: form.productType,
      salesPrice: Number(form.salesPrice),
      cost: Number(form.cost),
      imageUrl: form.imageUrl?.trim() || null,
      ...(isEdit ? { isActive: form.isActive } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormError error={error} />

      <Card title="Product details" bodyClassName="p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Product Name"
            name="name"
            required
            value={form.name}
            error={fieldErrors.name}
            onChange={update('name')}
          />
          <SelectField
            label="Product Type"
            name="productType"
            required
            placeholder={null}
            value={form.productType}
            error={fieldErrors.productType}
            onChange={update('productType')}
            options={PRODUCT_TYPES.map((type) => ({ value: type, label: type }))}
          />
          <div>
            <SelectField
              label="Category"
              name="categoryId"
              required
              value={form.categoryId}
              error={fieldErrors.categoryId}
              onChange={update('categoryId')}
              options={categories.map((category) => ({
                value: category.id,
                label: category.name,
              }))}
            />
            <Link
              href="/account/product-categories"
              className="mt-1 inline-block text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Manage categories
            </Link>
          </div>
          <ImageInput
            label="Product Image"
            value={form.imageUrl}
            onChange={(val) => setForm((curr) => ({ ...curr, imageUrl: val }))}
          />
          <TextField
            label="Sales Price"
            name="salesPrice"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.salesPrice}
            error={fieldErrors.salesPrice}
            onChange={update('salesPrice')}
          />
          <TextField
            label="Cost"
            name="cost"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.cost}
            error={fieldErrors.cost}
            onChange={update('cost')}
          />
          {isEdit && (
            <CheckboxField
              label="Active"
              name="isActive"
              className="sm:col-span-2"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
          )}
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
