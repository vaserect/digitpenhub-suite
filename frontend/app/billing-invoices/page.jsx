'use client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import InvoicesModule from '../../components/modules/Invoices';

export default function InvoicesListPage() {
  const router = useRouter();
  return <InvoicesModule goHome={() => router.push('/')} showToast={(msg) => toast.success(msg)} />;
}
