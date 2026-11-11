import {
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

export interface ModalProps {
  open?: boolean;
  onClose?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children?: ReactNode;
  closeOnOverlayClick?: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  role?: 'dialog' | 'alertdialog';
  className?: string;
}

const sizeClassNames = {
  sm: 'modal--sm',
  md: 'modal--md',
  lg: 'modal--lg',
  xl: 'modal--xl',
};

function ModalHeader({
  children,
  className = '',
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div className={`modal-header ${className}`.trim()} {...props}>{children}</div>;
}

function ModalBody({
  children,
  className = '',
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div className={`modal-body ${className}`.trim()} {...props}>{children}</div>;
}

function ModalFooter({
  children,
  className = '',
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div className={`modal-footer ${className}`.trim()} {...props}>{children}</div>;
}

function ModalContent({
  open = false,
  onClose,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  ariaLabel,
  ariaLabelledBy,
  role = 'dialog',
  className = '',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const dialog = dialogRef.current;
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const focusFirstElement = () => {
      const firstFocusable = dialog?.querySelector<HTMLElement>(focusableSelector);
      (firstFocusable ?? dialog)?.focus();
    };

    focusFirstElement();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab' || !dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (!focusableElements.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        className={`modal ${sizeClassNames[size]} ${className}`.trim()}
        role={role}
        aria-modal="true"
        aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : 'Dialog')}
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}

export const Modal = Object.assign(ModalContent, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});

export type ModalComponent = typeof Modal;
