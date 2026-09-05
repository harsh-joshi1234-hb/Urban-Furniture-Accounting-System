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
import Avatar from '@/components/ui/Avatar';
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
          <Avatar src={row.imageUrl} name={row.name} size="sm" />
          <span className="font-medium text-stone-900">{row.name}</span>
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
        <div className="flex flex-wrap items-end gap-3 border-b border-stone-200 p-4">
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
                <Avatar src={row.imageUrl} name={row.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="truncate font-semibold text-stone-900">{row.name}</h3>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Sales Price:</span>
                      <span className="font-medium text-stone-900">{formatCurrency(row.salesPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Cost:</span>
                      <span className="font-medium text-stone-900">{formatCurrency(row.cost)}</span>
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
