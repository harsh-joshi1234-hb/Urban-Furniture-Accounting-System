'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, homeRouteForRole } from '@/context/AuthContext';
import { TextField } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import { FormError } from '@/components/ui/ErrorState';
import Loading from '@/components/ui/Loading';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(homeRouteForRole(user.role));
  }, [user, loading, router]);

  const validate = () => {
    const errors = {};
    if (!form.loginId.trim()) errors.loginId = 'Login Id is required';
    if (!form.password) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const loggedIn = await login(form.loginId.trim(), form.password);
      router.replace(homeRouteForRole(loggedIn.role));
    } catch (err) {
      // Backend answers 401 with "Invalid Login Id or Password"
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading label="Checking your session..." />;

  return (
    <div>
      <h2 className="text-base font-semibold text-stone-900">Sign in</h2>
      <p className="mt-1 text-sm text-stone-500">Use your Login Id to continue.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
        <FormError error={error} />

        <TextField
          label="Login Id"
          name="loginId"
          autoComplete="username"
          required
          value={form.loginId}
          error={fieldErrors.loginId}
          onChange={(e) => setForm({ ...form, loginId: e.target.value })}
          placeholder="Enter Login Id"
        />

        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          error={fieldErrors.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Enter Password"
        />

        <Button type="submit" className="w-full" loading={submitting}>
          SIGN IN
        </Button>
      </form>

      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-stone-500">
        <Link href="/forgot-password" className="hover:text-brand-600">
          Forgot Password
        </Link>
        <span aria-hidden="true">|</span>
        <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-700">
          Sign Up
        </Link>
      </div>
    </div>
  );
}
