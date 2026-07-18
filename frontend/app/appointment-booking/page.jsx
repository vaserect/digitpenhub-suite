'use client';

import AppointmentBookingModule from '../../components/modules/AppointmentBooking';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AppointmentBookingPage() {
  const router = useRouter();
  
  const goHome = () => {
    router.push('/');
  };

  const showToast = (msg) => {
    toast(msg);
  };

  return (
    <AppointmentBookingModule goHome={goHome} showToast={showToast} />
  );
}
