'use client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import ProjectManagementModule from '../../components/modules/ProjectManagement';

export default function PmPage() {
  const router = useRouter();
  return <ProjectManagementModule goHome={() => router.push('/')} showToast={(msg) => toast.success(msg)} />;
}
