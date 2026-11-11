import type { HTMLAttributes, PropsWithChildren, ReactNode } from 'react';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({
  variant = 'neutral',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={`design-badge design-badge--${variant} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

export function Card({
  className = '',
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={`design-card ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export interface LoaderProps {
  label?: string;
}

export function Loader({ label = 'Loading' }: LoaderProps) {
  return (
    <span className="design-loader" role="status">
      <span className="design-loader__spinner" aria-hidden="true" />
      {label}
    </span>
  );
}

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  children: ReactNode;
}

export function Alert({
  variant = 'info',
  className = '',
  children,
  ...props
}: AlertProps) {
  return (
    <div
      className={`design-alert design-alert--${variant} ${className}`.trim()}
      role={variant === 'error' ? 'alert' : 'status'}
      {...props}
    >
      {children}
    </div>
  );
}
