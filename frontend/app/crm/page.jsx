'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import CRMModule from '../../components/modules/CRM';

export default function CrmPage() {
  const router = useRouter();
  return <CRMModule goHome={() => router.push('/')} showToast={(msg) => toast.success(msg)} />;
}
