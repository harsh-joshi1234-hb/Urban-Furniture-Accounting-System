'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, homeRouteForRole } from '@/context/AuthContext';
import Loading from '@/components/ui/Loading';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? homeRouteForRole(user.role) : '/login');
  }, [user, loading, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <Loading label="Loading Urban Furniture Accounting..." />
    </div>
  );
}
