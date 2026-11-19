import {
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
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

interface ModalContextValue {
  open: boolean;
  openModal: () => void;
  close: () => void;
  size: ModalProps['size'];
  closeOnOverlayClick: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  role?: 'dialog' | 'alertdialog';
  className?: string;
}

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext(): ModalContextValue {
  const context = useContext(ModalContext);
  if (!context) throw new Error('Modal compound components must be used inside Modal.');
  return context;
}

export interface ModalTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

function ModalTrigger({ children, onClick, type = 'button', ...props }: ModalTriggerProps) {
  const { open, openModal } = useModalContext();
  return (
    <button
      type={type}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          openModal();
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
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
  open,
  onClose,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  ariaLabel,
  ariaLabelledBy,
  role = 'dialog',
  className = '',
}: ModalProps) {
  const context = useContext(ModalContext);
  const resolvedOpen = context?.open ?? open ?? false;
  const resolvedClose = context?.close ?? onClose;
  const resolvedSize = context?.size ?? size;
  const resolvedCloseOnOverlay = context?.closeOnOverlayClick ?? closeOnOverlayClick;
  const resolvedAriaLabel = context?.ariaLabel ?? ariaLabel;
  const resolvedAriaLabelledBy = context?.ariaLabelledBy ?? ariaLabelledBy;
  const resolvedRole = context?.role ?? role;
  const resolvedClassName = context?.className ?? className;
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(resolvedClose);
  onCloseRef.current = resolvedClose;

  useLayoutEffect(() => {
    if (!resolvedOpen) return;

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
  }, [resolvedOpen]);

  useEffect(() => {
    if (!resolvedOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [resolvedOpen]);

  if (!resolvedOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(event) => {
        if (resolvedCloseOnOverlay && event.target === event.currentTarget) resolvedClose?.();
      }}
    >
      <div
        ref={dialogRef}
        className={`modal ${sizeClassNames[resolvedSize ?? 'md']} ${resolvedClassName}`.trim()}
        role={resolvedRole}
        aria-modal="true"
        aria-label={resolvedAriaLabel ?? (resolvedAriaLabelledBy ? undefined : 'Dialog')}
        aria-labelledby={resolvedAriaLabelledBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}

function ModalRoot({
  open: controlledOpen,
  onClose,
  size = 'md',
  closeOnOverlayClick = true,
  children,
  ariaLabel,
  ariaLabelledBy,
  role,
  className,
}: ModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const resolvedOpen = controlledOpen ?? internalOpen;

  const close = () => {
    setInternalOpen(false);
    onClose?.();
  };
  const openModal = () => {
    setInternalOpen(true);
  };

  const hasCompoundContent = Array.isArray(children)
    ? children.some((child) => isValidElement(child) && child.type === ModalContent)
    : isValidElement(children) && children.type === ModalContent;

  return (
    <ModalContext.Provider
      value={{
        open: resolvedOpen,
        openModal,
        close,
        size,
        closeOnOverlayClick,
        ariaLabel,
        ariaLabelledBy,
        role,
        className,
      }}
    >
      {hasCompoundContent ? children : (
        <ModalContent
          open={resolvedOpen}
          onClose={close}
          size={size}
          closeOnOverlayClick={closeOnOverlayClick}
          ariaLabel={ariaLabel}
          ariaLabelledBy={ariaLabelledBy}
          role={role}
          className={className}
        >
          {children}
        </ModalContent>
      )}
    </ModalContext.Provider>
  );
}

export const Modal = Object.assign(ModalRoot, {
  Trigger: ModalTrigger,
  Content: ModalContent,
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});

export type ModalComponent = typeof Modal;
