import React from 'react';

export default function Textarea({ label, error, helper, className = '', id, ...props }) {
  const inputId = id || React.useId();
  return (
    <div className={["field", error ? 'field-error' : '', className].filter(Boolean).join(' ')}>
      {label ? <label className="field-label" htmlFor={inputId}>{label}</label> : null}
      <textarea id={inputId} className="field-textarea" {...props} />
      {helper && !error ? <p className="field-helper">{helper}</p> : null}
      {error ? <p className="field-error-text">{error}</p> : null}
    </div>
  );
}
