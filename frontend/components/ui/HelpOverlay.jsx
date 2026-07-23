'use client';

export default function HelpOverlay({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480, width: 'min(100%, 480px)' }}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Keyboard shortcuts</h3>
            <p className="modal-description">Press ? to toggle this overlay at any time.</p>
          </div>
          <button className="modal-close" onClick={onClose} type="button" aria-label="Close">×</button>
        </div>
        <div className="modal-body" style={{ padding: '4px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                { keys: '⌘K / Ctrl+K', desc: 'Open command palette / global search' },
                { keys: '⌘B / Ctrl+B', desc: 'Go to billing & plans' },
                { keys: '⌘, / Ctrl+,', desc: 'Open account settings' },
                { keys: '?', desc: 'Toggle this help overlay' },
                { keys: 'Esc', desc: 'Close modals, menus, and dialogs' },
                { keys: 'Tab', desc: 'Move between form fields' },
                { keys: 'Enter', desc: 'Submit forms, confirm actions' },
              ].map((shortcut) => (
                <tr key={shortcut.keys} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <kbd style={{
                      display: 'inline-block', padding: '3px 8px', fontSize: 11, fontWeight: 600,
                      borderRadius: 6, background: 'var(--surface-muted)', border: '1px solid var(--border)',
                      color: 'var(--text)', fontFamily: 'inherit',
                    }}>{shortcut.keys}</kbd>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-muted)' }}>{shortcut.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text)' }}>Quick tips</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              <li>Search any module from the sidebar search bar</li>
              <li>Star modules to pin them to the top of your sidebar</li>
              <li>Recently used modules appear in your home view</li>
              <li>Dark mode is available from the top bar</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
