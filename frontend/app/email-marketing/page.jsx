'use client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import EmailMarketingModule from '../../components/modules/EmailMarketing';

export default function EmailMarketingPage() {
  const router = useRouter();
  return <EmailMarketingModule goHome={() => router.push('/')} showToast={(msg) => toast.success(msg)} />;
}
