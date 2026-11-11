import type { ButtonHTMLAttributes, FormHTMLAttributes, ReactNode } from 'react';

export interface FormErrorProps {
  message?: ReactNode;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return <p className="form-error" role="alert">{message}</p>;
}

export interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: ReactNode;
}

export function SubmitButton({
  children,
  isLoading = false,
  disabled,
  className = '',
  ...props
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      className={`button button--primary ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading…' : children}
    </button>
  );
}

export function Form({
  children,
  className = '',
  ...props
}: FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form className={`form-shell ${className}`.trim()} {...props}>
      {children}
    </form>
  );
}
