import { useCallback } from 'react';
import { useToggle } from './useToggle';

export function useModal(initialValue = false) {
  const { isOpen, open, close, toggle } = useToggle(initialValue);

  const openModal = useCallback(() => open(), [open]);
  const closeModal = useCallback(() => close(), [close]);
  const toggleModal = useCallback(() => toggle(), [toggle]);

  return {
    isOpen,
    open: openModal,
    close: closeModal,
    toggle: toggleModal,
  };
}
