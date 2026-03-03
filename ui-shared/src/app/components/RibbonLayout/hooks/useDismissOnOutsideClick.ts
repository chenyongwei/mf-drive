import { useEffect, type RefObject } from 'react';

export function useDismissOnOutsideClick<T extends HTMLElement>(
  isOpen: boolean,
  ref: RefObject<T>,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onDismiss();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onDismiss, ref]);
}
