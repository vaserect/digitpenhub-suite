'use client';

import { useEffect } from 'react';
import Modal from '../ui/Modal';
import GlobalSearch from './GlobalSearch';

export default function GlobalSearchModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Trigger open via parent component
          const event = new CustomEvent('openGlobalSearch');
          window.dispatchEvent(event);
        }
      }
      
      // ESC to close
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="900px"
      showCloseButton={true}
    >
      <div style={{ padding: 0 }}>
        <GlobalSearch goHome={onClose} isModal={true} />
      </div>
    </Modal>
  );
}
