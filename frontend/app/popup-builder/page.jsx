'use client';

import PopupBuilderModule from '../../components/modules/PopupBuilder';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function PopupBuilderPage() {
  const router = useRouter();
  
  const goHome = () => {
    router.push('/');
  };

  const showToast = (msg) => {
    toast(msg);
  };

  return (
    <PopupBuilderModule goHome={goHome} showToast={showToast} />
  );
}
