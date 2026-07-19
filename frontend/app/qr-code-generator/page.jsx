'use client';

import QrCodeGeneratorModule from '../../components/modules/QrCodeGenerator';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function QrCodeGeneratorPage() {
  const router = useRouter();

  const goHome = () => {
    router.push('/');
  };

  const showToast = (msg) => {
    toast(msg);
  };

  return (
    <QrCodeGeneratorModule goHome={goHome} showToast={showToast} />
  );
}
