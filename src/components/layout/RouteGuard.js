'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, homeRouteForRole } from '@/context/AuthContext';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import { ApiError } from '@/lib/apiClient';

/**
 * Page-level access control. Menus hide what a role cannot use, but this guard
 * is what actually blocks the route - the backend remains the final authority.
 */
export default function RouteGuard({ allow, children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) return <Loading label="Checking your session..." />;
  if (!user) return <Loading label="Redirecting to sign in..." />;

  if (allow && !allow.includes(user.role)) {
    return (
      <div className="p-6">
        <ErrorState
          error={new ApiError('You do not have access to this page.', 403)}
          onRetry={() => router.replace(homeRouteForRole(user.role))}
        />
        <p className="text-center text-xs text-stone-400">
          Signed in as {user.loginId} ({user.role})
        </p>
      </div>
    );
  }

  return children;
}
