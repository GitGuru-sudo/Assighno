import { AuthGuard } from '@/components/common/AuthGuard';
import { AssignmentDetailShell } from '@/components/assignments/AssignmentDetailShell';

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main>
      <AuthGuard>
        <AssignmentDetailShell assignmentId={id} />
      </AuthGuard>
    </main>
  );
}
