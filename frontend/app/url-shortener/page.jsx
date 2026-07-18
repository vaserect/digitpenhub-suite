'use client';

import UrlShortenerModule from '../../components/modules/UrlShortener';
import { useRouter } from 'next/navigation';

export default function UrlShortenerPage() {
  const router = useRouter();
  
  const goHome = () => {
    router.push('/');
  };

  return (
    <UrlShortenerModule goHome={goHome} />
  );
}
