'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authExpiredEventName } from '@/services/api-client';
import { useWorkbenchStore } from '@/store/workbench.store';

export function AuthGate({ children }: { children: ReactNode }) {
  const authHydrated = useWorkbenchStore((state) => state.authHydrated);
  const authToken = useWorkbenchStore((state) => state.authToken);
  const clearAuth = useWorkbenchStore((state) => state.clearAuth);
  const initialize = useWorkbenchStore((state) => state.initialize);
  const router = useRouter();

  useEffect(() => {
    if (!authHydrated) {
      void initialize();
    }
  }, [authHydrated, initialize]);

  useEffect(() => {
    const handleAuthExpired = () => clearAuth();
    window.addEventListener(authExpiredEventName, handleAuthExpired);
    return () => window.removeEventListener(authExpiredEventName, handleAuthExpired);
  }, [clearAuth]);

  useEffect(() => {
    if (authHydrated && !authToken) {
      router.replace('/login');
    }
  }, [authHydrated, authToken, router]);

  if (!authHydrated || !authToken) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        正在进入企业知识库...
      </main>
    );
  }

  return <>{children}</>;
}
