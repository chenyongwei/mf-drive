import React, { useEffect } from 'react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  headerVariant?: 'default' | 'gradient';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  size = 'md',
  headerVariant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children,
}: DialogProps) {
  // Handle ESC key press
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getSizeClasses = (): string => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'lg':
        return 'max-w-4xl';
      case 'xl':
        return 'max-w-6xl';
      case 'full':
        return 'max-w-[95vw] max-h-[95vh]';
      case 'md':
      default:
        return 'max-w-2xl';
    }
  };

  const getHeaderClasses = (): string => {
    return headerVariant === 'gradient'
      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
      : 'bg-gray-50 border-b border-gray-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Dialog */}
      <div className={`relative bg-white rounded-lg shadow-2xl ${getSizeClasses()} w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 ${getHeaderClasses()} rounded-t-lg`}>
          <h2 className={`text-lg font-semibold ${headerVariant === 'gradient' ? '' : 'text-gray-900'}`}>
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className={`p-1 rounded hover:bg-black/10 transition-colors ${headerVariant === 'gradient' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
              title="关闭"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
