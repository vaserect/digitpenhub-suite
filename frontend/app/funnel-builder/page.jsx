'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy route redirect - /funnel-builder now redirects to unified builder
 * This maintains backward compatibility for existing users
 */
export default function FunnelBuilderRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified builder with funnel type
    router.replace('/builder?type=funnel');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to unified builder...</p>
      </div>
    </div>
  );
}
