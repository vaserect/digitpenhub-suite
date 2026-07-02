import React from 'react';
import Badge from './Badge';

const DEFAULT_STATUS_MAP = {
  active: 'success',
  approved: 'success',
  processed: 'success',
  pending: 'warning',
  draft: 'warning',
  rejected: 'danger',
  terminated: 'danger',
  'on-leave': 'active',
  'full-time': 'active',
  'part-time': 'info',
  contract: 'warning',
  intern: 'neutral',
};

export default function StatusBadge({ status, map }) {
  const lookup = map ? { ...DEFAULT_STATUS_MAP, ...map } : DEFAULT_STATUS_MAP;
  const variant = lookup[String(status || '').toLowerCase()] || 'neutral';
  return <Badge variant={variant}>{status}</Badge>;
}
