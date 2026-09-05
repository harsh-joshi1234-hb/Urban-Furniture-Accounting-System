'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import authService from '@/services/auth.service';
import { TextField } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import { FormError } from '@/components/ui/ErrorState';
import { useToast } from '@/context/ToastContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mirrors the backend signup validator so users get feedback before the round trip. */
function validate(form) {
  const errors = {};
  if (!form.loginId || form.loginId.length < 6 || form.loginId.length > 12) {
    errors.loginId = 'Login Id must be between 6 and 12 characters';
  }
  if (!EMAIL_RE.test(form.email || '')) {
    errors.email = 'Enter a valid email address';
  }
  if (!form.password || form.password.length <= 8) {
    errors.password = 'Password must be more than 8 characters';
  } else if (
    !/[a-z]/.test(form.password) ||
    !/[A-Z]/.test(form.password) ||
    !/[^a-zA-Z0-9]/.test(form.password)
  ) {
    errors.password =
      'Password needs a lowercase letter, an uppercase letter and a special character';
  }
  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  return errors;
}

export default function SignupPage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    loginId: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      // Signup always creates a portal USER - the backend assigns the role.
      await authService.signup({
        name: form.name || form.loginId,
        loginId: form.loginId,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      toast.success('Account created. Please sign in.');
      router.replace('/login');
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-base font-semibold text-slate-900">Sign up</h2>
      <p className="mt-1 text-sm text-slate-500">
        Creates a customer portal user. Internal staff accounts are created by an Admin.
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
        <FormError error={error} />

        <TextField
          label="Name"
          name="name"
          value={form.name}
          onChange={update('name')}
          placeholder="Enter Name"
        />
        <TextField
          label="Login Id"
          name="loginId"
          required
          value={form.loginId}
          error={fieldErrors.loginId}
          onChange={update('loginId')}
          placeholder="Enter Login Id"
          hint="6-12 characters, must be unique"
        />
        <TextField
          label="Email Id"
          name="email"
          type="email"
          required
          value={form.email}
          error={fieldErrors.email}
          onChange={update('email')}
          placeholder="Enter Email Id"
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          required
          value={form.password}
          error={fieldErrors.password}
          onChange={update('password')}
          placeholder="Enter Password"
          hint="More than 8 characters with upper, lower and a special character"
        />
        <TextField
          label="Re-Enter Password"
          name="confirmPassword"
          type="password"
          required
          value={form.confirmPassword}
          error={fieldErrors.confirmPassword}
          onChange={update('confirmPassword')}
          placeholder="Re-Enter Password"
        />

        <Button type="submit" className="w-full" loading={submitting}>
          SIGN UP
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        Already registered?{' '}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
