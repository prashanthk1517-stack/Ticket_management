import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';

export interface SelectOption {
  label: ReactNode;
  value: string;
  disabled?: boolean;
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  options?: SelectOption[];
  error?: ReactNode;
  helperText?: ReactNode;
}

export function SelectField({
  id,
  label,
  options = [],
  error,
  helperText,
  className = '',
  required,
  children,
  'aria-describedby': ariaDescribedBy,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
  const helperId = `${selectId}-help`;
  const errorId = `${selectId}-error`;

  return (
    <div className="field-group">
      {label && (
        <label htmlFor={selectId} className="field-label">
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`field-input ${error ? 'field-input--error' : ''} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-required={required}
        aria-describedby={[
          ariaDescribedBy,
          helperText ? helperId : undefined,
          error ? errorId : undefined,
        ].filter(Boolean).join(' ') || undefined}
        {...props}
      >
        {children}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && <small className="field-help" id={helperId}>{helperText}</small>}
      {error && <small className="field-error" id={errorId} role="alert">{error}</small>}
    </div>
  );
}
