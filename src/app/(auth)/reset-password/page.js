'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import authService from '@/services/auth.service';
import { TextField } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import { FormError } from '@/components/ui/ErrorState';
import Loading from '@/components/ui/Loading';
import { useToast } from '@/context/ToastContext';

function ResetPasswordForm() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  // A reset link may carry the token in the query string.
  const [form, setForm] = useState(() => ({
    token: searchParams.get('token') || '',
    password: '',
    confirmPassword: '',
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    const errors = {};
    if (!form.token.trim()) errors.token = 'Reset token is required';
    if (!form.password || form.password.length <= 8) {
      errors.password = 'Password must be more than 8 characters';
    }
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await authService.resetPassword({
        token: form.token.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      toast.success('Password reset. Please sign in.');
      router.replace('/login');
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-base font-semibold text-slate-900">Reset password</h2>
      <p className="mt-1 text-sm text-slate-500">
        Paste the reset token you received and choose a new password.
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
        <FormError error={error} />
        <TextField
          label="Reset token"
          name="token"
          required
          value={form.token}
          error={fieldErrors.token}
          onChange={update('token')}
          placeholder="Paste reset token"
        />
        <TextField
          label="New password"
          name="password"
          type="password"
          required
          value={form.password}
          error={fieldErrors.password}
          onChange={update('password')}
        />
        <TextField
          label="Re-enter password"
          name="confirmPassword"
          type="password"
          required
          value={form.confirmPassword}
          error={fieldErrors.confirmPassword}
          onChange={update('confirmPassword')}
        />
        <Button type="submit" className="w-full" loading={submitting}>
          Reset password
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        <Link href="/login" className="hover:text-indigo-600">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
