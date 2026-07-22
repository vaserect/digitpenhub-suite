'use client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import ExpensesModule from '../../components/modules/ExpensesModule';

export default function ExpensesPage() {
  const router = useRouter();
  return <ExpensesModule goHome={() => router.push('/')} showToast={(msg) => toast.success(msg)} />;
}
