import { AuthGate } from '@/components/admin/AuthGate';
import { EnterpriseAdminApp } from '@/components/admin/EnterpriseAdminApp';

export default function ConsolePage() {
  return (
    <AuthGate>
      <EnterpriseAdminApp />
    </AuthGate>
  );
}
