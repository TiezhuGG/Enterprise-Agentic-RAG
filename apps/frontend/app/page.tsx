'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/services/api-client';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getAuthToken() ? '/console' : '/login');
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
      正在打开企业知识库...
    </main>
  );
}
