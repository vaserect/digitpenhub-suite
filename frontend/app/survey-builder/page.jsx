'use client';

import FormBuilderModule from '../../components/modules/Forms';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function SurveyBuilderPage() {
  const router = useRouter();
  
  const goHome = () => {
    router.push('/');
  };

  const showToast = (msg) => {
    toast(msg);
  };

  return (
    <FormBuilderModule slug="survey-builder" goHome={goHome} showToast={showToast} />
  );
}
