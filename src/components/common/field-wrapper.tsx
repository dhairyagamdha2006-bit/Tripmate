import type { ReactNode } from 'react';

export function FieldWrapper({
  label,
  htmlFor,
  helpText,
  error,
  children
}: {
  label: string;
  htmlFor: string;
  helpText?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {helpText ? <p className="text-xs text-slate-500">{helpText}</p> : null}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
