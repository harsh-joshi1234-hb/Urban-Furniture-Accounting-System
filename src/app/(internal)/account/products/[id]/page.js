'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import productService, { productCategoryService } from '@/services/product.api';
import ProductForm from '@/components/forms/ProductForm';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const product = useApiResource(() => productService.get(id), [id]);
  const categories = useApiResource(() => productCategoryService.list(), []);

  const update = useSubmit((payload) => productService.update(id, payload), {
    onSuccess: () => {
      toast.success('Product updated');
      product.reload();
    },
  });

  const remove = useSubmit(() => productService.remove(id), {
    onSuccess: () => {
      toast.success('Product deleted');
      router.replace('/account/products');
    },
    onError: (err) => {
      setConfirmDelete(false);
      toast.error(err.message);
    },
  });

  if (product.loading || categories.loading) return <Loading label="Loading product..." />;
  if (product.error) return <ErrorState error={product.error} onRetry={product.reload} />;
  if (!product.data) return <ErrorState error={{ status: 404, message: 'Product not found' }} />;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={product.data.name}
        subtitle={product.data.category?.name}
        backHref="/account/products"
        backLabel="Products"
        actions={
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        }
      />

      <ProductForm
        isEdit
        initial={product.data}
        categories={categories.data ?? []}
        onSubmit={update.submit}
        submitting={update.submitting}
        error={update.error}
        onCancel={() => router.push('/account/products')}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this product?"
        message={`"${product.data.name}" will be removed. The backend refuses the delete when the product is used on a document - deactivate it instead.`}
        confirmLabel="Delete"
        loading={remove.submitting}
        onConfirm={() => remove.submit()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
