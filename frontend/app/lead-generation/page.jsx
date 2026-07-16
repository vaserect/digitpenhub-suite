'use client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import LeadGenerationModule from '../../components/modules/LeadGeneration';

export default function LeadGenerationPage() {
  const router = useRouter();
  return <LeadGenerationModule goHome={() => router.push('/')} showToast={(msg) => toast.success(msg)} />;
}
