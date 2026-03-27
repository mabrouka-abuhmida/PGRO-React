/**
 * useModal - Hook for managing modal state with keyboard support (Escape to close)
 */
import { useEffect, useCallback } from 'react';

interface UseModalOptions {
  isOpen: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
}

export const useModal = ({
  isOpen,
  onClose,
  closeOnEscape = true,
  closeOnOverlayClick = true,
}: UseModalOptions) => {
  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, closeOnEscape]);

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose, closeOnOverlayClick]
  );

  return {
    handleOverlayClick,
  };
};

