'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import productService, { productCategoryService } from '@/services/product.api';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { TextField, SelectField } from '@/components/ui/Field';
import { formatCurrency } from '@/utils/format';
import { PRODUCT_TYPES } from '@/utils/constants';

export default function ProductsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({ categoryId: '', productType: '' });
  const [search, setSearch] = useState('');

  const products = useApiResource(
    () =>
      productService.list({
        categoryId: filters.categoryId || undefined,
        productType: filters.productType || undefined,
      }),
    [filters.categoryId, filters.productType],
  );
  const categories = useApiResource(() => productCategoryService.list(), []);

  const rows = useMemo(() => {
    const list = products.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((product) => product.name.toLowerCase().includes(term));
  }, [products.data, search]);

  const columns = [
    {
      key: 'name',
      header: 'Product',
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    { key: 'category', header: 'Category', render: (row) => row.category?.name || '-' },
    { key: 'productType', header: 'Type', render: (row) => <Badge tone="slate">{row.productType}</Badge> },
    {
      key: 'salesPrice',
      header: 'Sales Price',
      align: 'right',
      render: (row) => formatCurrency(row.salesPrice),
    },
    { key: 'cost', header: 'Cost', align: 'right', render: (row) => formatCurrency(row.cost) },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => <Badge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Goods, services and combos sold or purchased."
        actions={
          <>
            <Link href="/account/product-categories">
              <Button variant="secondary">Categories</Button>
            </Link>
            <Link href="/account/products/new">
              <Button>New</Button>
            </Link>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4">
          <TextField
            label="Search"
            name="search"
            placeholder="Product name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] flex-1"
          />
          <SelectField
            label="Category"
            name="categoryId"
            placeholder="All"
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            options={(categories.data ?? []).map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            className="w-48"
          />
          <SelectField
            label="Type"
            name="productType"
            placeholder="All"
            value={filters.productType}
            onChange={(e) => setFilters({ ...filters, productType: e.target.value })}
            options={PRODUCT_TYPES.map((type) => ({ value: type, label: type }))}
            className="w-40"
          />
        </div>

        <Table
          columns={columns}
          rows={rows}
          loading={products.loading}
          error={products.error}
          onRetry={products.reload}
          onRowClick={(row) => router.push(`/account/products/${row.id}`)}
          emptyTitle="No products found"
          emptyDescription="Create a product to use it on orders, invoices and bills."
          emptyAction={
            <Link href="/account/products/new">
              <Button size="sm">New product</Button>
            </Link>
          }
        />
      </Card>
    </div>
  );
}
