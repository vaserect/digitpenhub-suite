'use client';

import { useEffect, useRef, useState } from 'react';

export function Menu({ trigger, children, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className="menu-wrap" ref={ref}>
      {trigger(() => setOpen((v) => !v), open)}
      {open && (
        <div className={["menu-panel", align === 'left' ? 'align-left' : ''].filter(Boolean).join(' ')} role="menu">
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ children, danger = false, ...props }) {
  return (
    <button type="button" role="menuitem" className={["menu-item", danger ? 'danger' : ''].filter(Boolean).join(' ')} {...props}>
      {children}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="menu-sep" />;
}

export default Menu;
