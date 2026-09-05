'use client';

import { useRouter } from 'next/navigation';
import { useApiResource } from '@/hooks/useApiResource';
import productService, { productCategoryService } from '@/services/product.api';
import ProductForm from '@/components/forms/ProductForm';
import PageHeader from '@/components/ui/PageHeader';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import useSubmit from '@/hooks/useSubmit';
import { useToast } from '@/context/ToastContext';

export default function NewProductPage() {
  const router = useRouter();
  const toast = useToast();
  const categories = useApiResource(() => productCategoryService.list(), []);

  const { submit, submitting, error } = useSubmit(
    (payload) => productService.create(payload),
    {
      onSuccess: (response) => {
        toast.success('Product created');
        router.replace(`/account/products/${response.data.id}`);
      },
    },
  );

  if (categories.loading) return <Loading label="Loading categories..." />;
  if (categories.error) {
    return <ErrorState error={categories.error} onRetry={categories.reload} />;
  }

  return (
    <div className="max-w-4xl">
      <PageHeader title="New product" backHref="/account/products" backLabel="Products" />
      <ProductForm
        categories={categories.data ?? []}
        onSubmit={submit}
        submitting={submitting}
        error={error}
        onCancel={() => router.push('/account/products')}
      />
    </div>
  );
}
