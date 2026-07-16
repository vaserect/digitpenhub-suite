'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy route redirect - /website-builder now redirects to unified builder
 * This maintains backward compatibility for existing users
 */
export default function WebsiteBuilderRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified builder with page type
    router.replace('/builder?type=page');
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
