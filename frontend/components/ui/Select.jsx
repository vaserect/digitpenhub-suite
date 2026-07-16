import React from 'react';

export default function Select({ label, error, helper, className = '', id, children, ...props }) {
  const autoId = React.useId();
  const inputId = id || autoId;
  return (
    <div className={["field", error ? 'field-error' : '', className].filter(Boolean).join(' ')}>
      {label ? <label className="field-label" htmlFor={inputId}>{label}</label> : null}
      <select id={inputId} className="field-select" {...props}>{children}</select>
      {helper && !error ? <p className="field-helper">{helper}</p> : null}
      {error ? <p className="field-error-text">{error}</p> : null}
    </div>
  );
}
