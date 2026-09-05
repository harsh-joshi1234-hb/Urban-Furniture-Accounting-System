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
import ViewToggle from '@/components/ui/ViewToggle';
import KanbanBoard from '@/components/ui/KanbanBoard';
import { formatCurrency } from '@/utils/format';
import { PRODUCT_TYPES } from '@/utils/constants';

export default function ProductsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({ categoryId: '', productType: '' });
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');

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
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            <div
              className="h-8 w-8 shrink-0 rounded bg-cover bg-center ring-1 ring-slate-200"
              style={{ backgroundImage: `url(${row.imageUrl})` }}
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100 ring-1 ring-slate-200 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </div>
          )}
          <span className="font-medium text-slate-900">{row.name}</span>
        </div>
      ),
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
          <div className="flex items-center gap-3">
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />
            <Link href="/account/product-categories">
              <Button variant="secondary">Categories</Button>
            </Link>
            <Link href="/account/products/new">
              <Button>New</Button>
            </Link>
          </div>
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

        {viewMode === 'list' ? (
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
        ) : (
          <KanbanBoard
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
            renderCard={(row) => (
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-400 overflow-hidden">
                  {row.imageUrl ? (
                    <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${row.imageUrl})` }} />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="truncate font-semibold text-slate-900">{row.name}</h3>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Sales Price:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(row.salesPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Cost:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(row.cost)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </Card>
    </div>
  );
}
