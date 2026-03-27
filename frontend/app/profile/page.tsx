import { AuthGuard } from '@/components/common/AuthGuard';
import { ProfileShell } from '@/components/profile/ProfileShell';

export default function ProfilePage() {
  return (
    <main>
      <AuthGuard>
        <ProfileShell />
      </AuthGuard>
    </main>
  );
}
