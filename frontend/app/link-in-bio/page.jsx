'use client';

import LinkInBioModule from '../../components/modules/LinkInBio';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LinkInBioPage() {
  const router = useRouter();

  const goHome = () => {
    router.push('/');
  };

  const showToast = (msg) => {
    toast(msg);
  };

  return (
    <LinkInBioModule goHome={goHome} showToast={showToast} />
  );
}
