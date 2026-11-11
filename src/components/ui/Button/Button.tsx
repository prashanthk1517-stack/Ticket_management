import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClassName: Record<ButtonVariant, string> = {
  primary: 'button button--primary',
  secondary: 'button button--secondary',
  ghost: 'button button--ghost',
};

const sizeClassName: Record<ButtonSize, string> = {
  sm: 'button--sm',
  md: '',
  lg: 'button--lg',
};

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${variantClassName[variant]} ${sizeClassName[size]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
