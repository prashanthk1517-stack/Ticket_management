import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: ReactNode;
  helperText?: ReactNode;
}

export function InputField({
  id,
  label,
  error,
  helperText,
  className = '',
  required,
  'aria-describedby': ariaDescribedBy,
  ...props
}: InputFieldProps) {
  const generatedId = useId();
  const inputId = id ?? (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
  const helperId = `${inputId}-help`;
  const errorId = `${inputId}-error`;

  return (
    <div className="field-group">
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`field-input ${error ? 'field-input--error' : ''} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-required={required}
        aria-describedby={[
          ariaDescribedBy,
          helperText ? helperId : undefined,
          error ? errorId : undefined,
        ].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      {helperText && <small className="field-help" id={helperId}>{helperText}</small>}
      {error && <small className="field-error" id={errorId} role="alert">{error}</small>}
    </div>
  );
}
