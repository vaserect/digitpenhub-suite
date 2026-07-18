'use client';

import DigitalBusinessCardsModule from '../../components/modules/DigitalBusinessCards';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function DigitalBusinessCardsPage() {
  const router = useRouter();

  const goHome = () => {
    router.push('/');
  };

  const showToast = (msg) => {
    toast(msg);
  };

  return (
    <DigitalBusinessCardsModule goHome={goHome} showToast={showToast} />
  );
}
