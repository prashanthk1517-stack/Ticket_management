import { useCallback, useState } from 'react';

export function useToggle(initialValue = false) {
  const [isOpen, setIsOpen] = useState(initialValue);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((previous) => !previous), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
