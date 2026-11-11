import { useId, type ReactNode, type TextareaHTMLAttributes } from 'react';

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  error?: ReactNode;
  helperText?: ReactNode;
}

export function TextAreaField({
  id,
  label,
  error,
  helperText,
  className = '',
  required,
  'aria-describedby': ariaDescribedBy,
  ...props
}: TextAreaFieldProps) {
  const generatedId = useId();
  const textareaId = id ?? (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
  const helperId = `${textareaId}-help`;
  const errorId = `${textareaId}-error`;

  return (
    <div className="field-group">
      {label && (
        <label htmlFor={textareaId} className="field-label">
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`field-input field-textarea ${error ? 'field-input--error' : ''} ${className}`.trim()}
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
