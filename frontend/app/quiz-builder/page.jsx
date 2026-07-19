'use client';

import QuizBuilderModule from '../../components/modules/QuizBuilder';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function QuizBuilderPage() {
  const router = useRouter();

  const goHome = () => {
    router.push('/');
  };

  const showToast = (msg) => {
    toast(msg);
  };

  return (
    <QuizBuilderModule goHome={goHome} showToast={showToast} />
  );
}
