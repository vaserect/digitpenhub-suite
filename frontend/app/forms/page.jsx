'use client';

import FormBuilderModule from '../../components/modules/Forms';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function FormsPage() {
  const router = useRouter();
  
  const goHome = () => {
    router.push('/');
  };

  const showToast = (msg) => {
    toast(msg);
  };

  return (
    <FormBuilderModule slug="forms" goHome={goHome} showToast={showToast} />
  );
}
