'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { useUndoRedo } from '@/lib/hooks/useUndoRedo';
import UnifiedSidebar from './UnifiedSidebar';
import UnifiedCanvas from './UnifiedCanvas';
import UnifiedToolbar from './UnifiedToolbar';
import UnifiedPropertiesPanel from './UnifiedPropertiesPanel';

/**
 * UnifiedBuilder - Main container for the unified website builder
 * Handles pages, sites, and funnels in one interface
 */
export default function UnifiedBuilder({ 
  project, 
  projects, 
  onProjectChange, 
  onProjectsReload,
  onBack 
}) {
  // Core state
  const [currentPage, setCurrentPage] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('desktop'); // desktop | tablet | mobile
  const [showGrid, setShowGrid] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('blocks'); // blocks | pages | templates | assets

  // Undo/redo for blocks
  const {
    state: blocks,
    setState: setBlocks,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetBlocks
  } = useUndoRedo([]);

  // Load project data
  useEffect(() => {
    if (project) {
      loadProjectData();
    }
  }, [project]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      // Ctrl+Y or Cmd+Shift+Z for redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) redo();
      }
      // Ctrl+S or Cmd+S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  const loadProjectData = async () => {
    try {
      if (project.projectType === 'page') {
        // Single page - load directly
        const res = await apiFetch(`/api/v1/pages/${project.id}`);
        setCurrentPage(res.page);
        setBlocks(res.page.blocks || []);
        setPages([res.page]);
      } else if (project.projectType === 'site') {
        // Multi-page site - load all pages
        const res = await apiFetch(`/api/v1/builder/sites/${project.id}/pages`);
        setPages(res.pages || []);
        if (res.pages && res.pages.length > 0) {
          const firstPage = res.pages[0];
          setCurrentPage(firstPage);
          setBlocks(firstPage.blocks || []);
        }
      } else if (project.projectType === 'funnel') {
        // Funnel - load steps
        const res = await apiFetch(`/api/v1/funnels/${project.id}`);
        const steps = res.steps || [];
        
        // Convert funnel steps to page-like objects
        const stepPages = await Promise.all(
          steps.map(async (step) => {
            if (step.page_id) {
              const pageRes = await apiFetch(`/api/v1/pages/${step.page_id}`);
              return {
                ...pageRes.page,
                stepOrder: step.step_order,
                stepType: step.step_type
              };
            }
            return null;
          })
        );
        
        const validPages = stepPages.filter(p => p !== null);
        setPages(validPages);
        if (validPages.length > 0) {
          setCurrentPage(validPages[0]);
          setBlocks(validPages[0].blocks || []);
        }
      }
    } catch (err) {
      console.error('Error loading project data:', err);
      toast.error('Failed to load project data');
    }
  };

  const handlePageChange = async (pageId) => {
    const page = pages.find(p => p.id === pageId);
    if (page) {
      setCurrentPage(page);
      setBlocks(page.blocks || []);
      setSelectedBlock(null);
    }
  };

  const handleSave = async () => {
    if (!currentPage) return;
    
    setIsSaving(true);
    try {
      const res = await apiFetch(`/api/v1/pages/${currentPage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks })
      });
      
      setCurrentPage(res.page);
      toast.success('Saved successfully!');
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!project) return;
    
    try {
      let endpoint;
      switch (project.projectType) {
        case 'page':
          endpoint = `/api/v1/pages/${project.id}`;
          await apiFetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'live' })
          });
          break;
        case 'site':
          endpoint = `/api/v1/builder/sites/${project.id}/publish`;
          await apiFetch(endpoint, { method: 'POST' });
          break;
        case 'funnel':
          endpoint = `/api/v1/funnels/${project.id}`;
          await apiFetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'published' })
          });
          break;
      }
      
      toast.success('Published successfully!');
      if (onProjectsReload) onProjectsReload();
    } catch (err) {
      console.error('Error publishing:', err);
      toast.error('Failed to publish');
    }
  };

  const handleAddBlock = (blockType) => {
    const newBlock = {
      id: `block_${Date.now()}`,
      type: blockType,
      props: {},
      children: []
    };
    
    setBlocks([...blocks, newBlock]);
    setSelectedBlock(newBlock);
  };

  const handleUpdateBlock = (blockId, updates) => {
    const updatedBlocks = blocks.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    );
    setBlocks(updatedBlocks);
    
    // Update selectedBlock if it's the same block being updated
    if (selectedBlock?.id === blockId) {
      const updatedBlock = updatedBlocks.find(b => b.id === blockId);
      setSelectedBlock(updatedBlock);
    }
  };

  const handleDeleteBlock = (blockId) => {
    setBlocks(blocks.filter(block => block.id !== blockId));
    if (selectedBlock?.id === blockId) {
      setSelectedBlock(null);
    }
  };

  const handleDuplicateBlock = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const duplicatedBlock = {
      ...block,
      id: `block_${Date.now()}`
    };
    
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    const newBlocks = [...blocks];
    newBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
    setBlocks(newBlocks);
  };

  const handleMoveBlock = (blockId, direction) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    
    [newBlocks[blockIndex], newBlocks[targetIndex]] = 
      [newBlocks[targetIndex], newBlocks[blockIndex]];
    
    setBlocks(newBlocks);
  };

  const handleAddPage = async () => {
    const pageName = prompt(`Enter a name for the new ${project?.projectType === 'funnel' ? 'step' : 'page'}:`);
    if (!pageName) return;

    try {
      if (project.projectType === 'page') {
        toast.error('Single pages cannot have multiple pages. Create a site instead.');
        return;
      }

      if (project.projectType === 'site') {
        const res = await apiFetch(`/api/v1/builder/sites/${project.id}/pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: pageName,
            slug: pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          })
        });
        toast.success('Page added successfully!');
        await loadProjectData();
      } else if (project.projectType === 'funnel') {
        const res = await apiFetch(`/api/v1/funnels/${project.id}/steps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: pageName,
            step_type: 'page'
          })
        });
        toast.success('Step added successfully!');
        await loadProjectData();
      }
    } catch (err) {
      console.error('Error adding page:', err);
      toast.error('Failed to add page');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb', overflow: 'hidden' }}>
      {/* Left Sidebar */}
      <UnifiedSidebar
        project={project}
        projects={projects}
        pages={pages}
        currentPage={currentPage}
        activeTab={sidebarTab}
        onTabChange={setSidebarTab}
        onProjectChange={onProjectChange}
        onPageChange={handlePageChange}
        onAddBlock={handleAddBlock}
        onAddPage={handleAddPage}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Toolbar */}
        <UnifiedToolbar
          project={project}
          currentPage={currentPage}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onSave={handleSave}
          onPublish={handlePublish}
          isSaving={isSaving}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onBack={onBack}
        />

        {/* Canvas */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <UnifiedCanvas
            blocks={blocks}
            selectedBlock={selectedBlock}
            onSelectBlock={setSelectedBlock}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onMoveBlock={handleMoveBlock}
            onAddBlock={(block, position) => {
              if (typeof block === 'string') {
                handleAddBlock(block);
              } else {
                const newBlocks = [...blocks];
                newBlocks.splice(position, 0, block);
                setBlocks(newBlocks);
              }
            }}
            viewMode={viewMode}
            showGrid={showGrid}
          />
        </div>
      </div>

      {/* Right Properties Panel */}
      {selectedBlock && (
        <UnifiedPropertiesPanel
          block={selectedBlock}
          project={project}
          currentPage={currentPage}
          onUpdate={(updates) => handleUpdateBlock(selectedBlock.id, updates)}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  );
}