'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ModuleRenderer from '../../components/modules/ModuleRenderer';
import WorkspaceShell, { OLD_SLUG_TO_WORKSPACE, TAB_REGISTRY } from '../../components/workspace/WorkspaceShell';
import { useWorkspace } from '../../components/ui/WorkspaceLayout';

export default function CatchAllPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspace = useWorkspace();

  const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;

  // Check if this slug is an old module that was merged into a workspace
  const consolidatedSlug = OLD_SLUG_TO_WORKSPACE[slug];
  const effectiveSlug = consolidatedSlug || slug;

  // Only wrap in WorkspaceShell if this is a consolidated workspace with tabs
  const isConsolidated = !!TAB_REGISTRY[effectiveSlug];
  const tabSlug = searchParams?.get('tab') || (consolidatedSlug ? slug : null);

  if (!workspace) {
    return null;
  }

  const content = (
    <ModuleRenderer
      moduleSlug={tabSlug || slug}
      goHome={() => router.push('/')}
      categories={workspace.categories || []}
    />
  );

  if (isConsolidated) {
    return (
      <WorkspaceShell slug={effectiveSlug} goHome={() => router.push('/')}>
        {content}
      </WorkspaceShell>
    );
  }

  return content;
}
