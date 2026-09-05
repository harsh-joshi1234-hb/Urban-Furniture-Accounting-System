'use client';

import { useState } from 'react';
import Link from 'next/link';
import authService from '@/services/auth.service';
import { TextField } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import { FormError } from '@/components/ui/ErrorState';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    if (!email.trim()) {
      setFieldError('Email is required');
      return;
    }
    setFieldError(null);
    setSubmitting(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <span className="text-3xl" aria-hidden="true">
          ✉️
        </span>
        <h2 className="mt-2 text-base font-semibold text-stone-900">Check your inbox</h2>
        <p className="mt-1 text-sm text-stone-500">
          If that account exists, password reset instructions have been sent.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link href="/reset-password">
            <Button variant="secondary" className="w-full">
              I have a reset token
            </Button>
          </Link>
          <Link href="/login" className="text-sm text-brand-600 hover:text-brand-700">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-stone-900">Forgot password</h2>
      <p className="mt-1 text-sm text-stone-500">
        Enter your email and we will send reset instructions.
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
        <FormError error={error} />
        <TextField
          label="Email Id"
          name="email"
          type="email"
          required
          value={email}
          error={fieldError}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter Email Id"
        />
        <Button type="submit" className="w-full" loading={submitting}>
          Send reset link
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-stone-500">
        <Link href="/login" className="hover:text-brand-600">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
