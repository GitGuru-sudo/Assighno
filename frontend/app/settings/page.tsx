import { AuthGuard } from '@/components/common/AuthGuard';
import { SettingsShell } from '@/components/settings/SettingsShell';

export default function SettingsPage() {
  return (
    <main>
      <AuthGuard>
        <SettingsShell />
      </AuthGuard>
    </main>
  );
}
