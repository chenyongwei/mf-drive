import React from 'react';

export interface DialogFooterProps {
  children: React.ReactNode;
  alignment?: 'left' | 'center' | 'right' | 'space-between';
  showBorder?: boolean;
}

export function DialogFooter({
  children,
  alignment = 'right',
  showBorder = true,
}: DialogFooterProps) {
  const getAlignmentClasses = (): string => {
    switch (alignment) {
      case 'left':
        return 'justify-start';
      case 'center':
        return 'justify-center';
      case 'space-between':
        return 'justify-between';
      case 'right':
      default:
        return 'justify-end';
    }
  };

  return (
    <div className={`px-6 py-4 ${showBorder ? 'border-t border-gray-200 bg-gray-50' : ''} rounded-b-lg`}>
      <div className={`flex items-center gap-3 ${getAlignmentClasses()}`}>
        {children}
      </div>
    </div>
  );
}
