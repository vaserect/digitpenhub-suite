'use client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import ContractsModule from '../../components/modules/ContractsModule';

export default function ContractsPage() {
  const router = useRouter();
  return <ContractsModule goHome={() => router.push('/')} showToast={(msg) => toast.success(msg)} />;
}
