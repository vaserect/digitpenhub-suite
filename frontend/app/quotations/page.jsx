'use client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import QuotationsModule from '../../components/modules/QuotationsModule';

export default function QuotationsPage() {
  const router = useRouter();
  return <QuotationsModule goHome={() => router.push('/')} showToast={(msg) => toast.success(msg)} />;
}
