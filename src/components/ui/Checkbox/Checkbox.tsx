import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

export interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  error?: ReactNode;
  helperText?: ReactNode;
}

export function CheckboxField({
  id,
  label,
  error,
  helperText,
  className = '',
  required,
  'aria-describedby': ariaDescribedBy,
  ...props
}: CheckboxFieldProps) {
  const generatedId = useId();
  const checkboxId = id ?? (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
  const helperId = `${checkboxId}-help`;
  const errorId = `${checkboxId}-error`;

  return (
    <div className="field-group field-group--checkbox">
      <label htmlFor={checkboxId} className="field-checkbox-label">
        <input
          id={checkboxId}
          type="checkbox"
          className={`field-checkbox ${className}`.trim()}
          aria-invalid={Boolean(error)}
          aria-required={required}
          aria-describedby={[
            ariaDescribedBy,
            helperText ? helperId : undefined,
            error ? errorId : undefined,
          ].filter(Boolean).join(' ') || undefined}
          {...props}
        />
        <span>{label}</span>
      </label>
      {helperText && <small className="field-help" id={helperId}>{helperText}</small>}
      {error && <small className="field-error" id={errorId} role="alert">{error}</small>}
    </div>
  );
}
