'use client';

import ReferralProgramModule from '../../components/modules/ReferralProgram';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ReferralProgramPage() {
  const router = useRouter();
  
  const goHome = () => {
    router.push('/');
  };

  const showToast = (msg) => {
    toast(msg);
  };

  return (
    <ReferralProgramModule goHome={goHome} showToast={showToast} />
  );
}
