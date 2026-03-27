import { AuthGuard } from '@/components/common/AuthGuard';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export default function DashboardPage() {
  return (
    <main>
      <AuthGuard>
        <DashboardShell />
      </AuthGuard>
    </main>
  );
}

