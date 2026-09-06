'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, homeRouteForRole } from '@/context/AuthContext';
import { FieldWrapper } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import { FormError } from '@/components/ui/ErrorState';
import Loading from '@/components/ui/Loading';

const inputBase =
  'block w-full rounded-lg border-0 bg-white py-2.5 pl-10 text-sm text-stone-900 shadow-xs ring-1 ring-inset ring-stone-300 transition placeholder:text-stone-400 hover:ring-stone-400 focus:ring-2 focus:ring-inset focus:ring-brand-600';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
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
      // `remember` decides whether the session survives closing the browser.
      const loggedIn = await login(form.loginId.trim(), form.password, remember);
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
      <div className="mb-7 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-lg font-bold text-white shadow-md">
          UF
        </span>
        <p className="text-lg font-semibold tracking-tight text-stone-900">Urban Furniture</p>
        <p className="text-xs text-stone-500">Accounting &amp; Invoicing</p>

        <h2 className="mt-6 text-2xl font-bold tracking-tight text-stone-900">Welcome back</h2>
        <p className="mt-1 text-sm text-stone-500">Sign in to continue to your account.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormError error={error} />

        <FieldWrapper label="Login Id" htmlFor="loginId" required error={fieldErrors.loginId}>
          <div className="relative">
            <span
              className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-stone-400"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.6}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.5-1.632z"
                />
              </svg>
            </span>
            <input
              id="loginId"
              name="loginId"
              autoComplete="username"
              required
              value={form.loginId}
              aria-invalid={Boolean(fieldErrors.loginId)}
              onChange={(e) => setForm({ ...form, loginId: e.target.value })}
              placeholder="Enter your Login Id"
              className={`${inputBase} ${fieldErrors.loginId ? 'ring-red-400' : ''}`}
            />
          </div>
        </FieldWrapper>

        <FieldWrapper label="Password" htmlFor="password" required error={fieldErrors.password}>
          <div className="relative">
            <span
              className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-stone-400"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.6}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 12.75v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={form.password}
              aria-invalid={Boolean(fieldErrors.password)}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your Password"
              className={`${inputBase} pr-10 ${fieldErrors.password ? 'ring-red-400' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-stone-400 transition hover:text-stone-600 focus-ring"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.066 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              )}
            </button>
          </div>
        </FieldWrapper>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-600"
            />
            Keep me signed in
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full tracking-wide" loading={submitting}>
          SIGN IN
          {!submitting && <span aria-hidden="true">→</span>}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-stone-200" aria-hidden="true" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-stone-400">or</span>
        <span className="h-px flex-1 bg-stone-200" aria-hidden="true" />
      </div>

      <Link href="/signup" className="block">
        <span className="flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-stone-100 text-sm text-stone-600 transition hover:bg-stone-200">
          Don&apos;t have an account?
          <span className="font-semibold text-brand-700">Sign Up</span>
        </span>
      </Link>
    </div>
  );
}
