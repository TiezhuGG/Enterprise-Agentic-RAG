import type { ReactNode } from 'react';
import { AuthGate } from '@/components/admin/AuthGate';

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
