'use client';

import { useState } from 'react';
import Button from './Button';
import ConfirmDialog from './ConfirmDialog';

export default function BulkActionBar({ selectedCount, onClearSelection, actions = [] }) {
  const [pendingAction, setPendingAction] = useState(null);

  if (!selectedCount) return null;

  const runAction = (action) => {
    if (action.requiresConfirm) setPendingAction(action);
    else action.onClick();
  };

  return (
    <>
      <div className="bulk-bar">
        <span>{selectedCount} selected</span>
        <div className="bulk-bar-actions">
          {actions.map((action) => (
            <Button key={action.label} variant={action.variant || 'secondary'} size="sm" onClick={() => runAction(action)}>
              {action.icon ? <span aria-hidden="true">{action.icon}</span> : null}
              {action.label}
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={onClearSelection}>Clear</Button>
        </div>
      </div>
      <ConfirmDialog
        isOpen={!!pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={() => { pendingAction?.onClick(); setPendingAction(null); }}
        title={pendingAction?.confirmTitle || 'Are you sure?'}
        description={pendingAction?.confirmDescription}
        confirmLabel={pendingAction?.label}
        danger={pendingAction?.variant === 'danger'}
      />
    </>
  );
}
