'use client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import AccountingModule from '../../components/modules/AccountingModule';

export default function AccountingPage() {
  const router = useRouter();
  return <AccountingModule goHome={() => router.push('/')} showToast={(msg) => toast.success(msg)} />;
}
