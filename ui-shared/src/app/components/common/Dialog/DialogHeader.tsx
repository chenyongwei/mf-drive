import React from 'react';

export interface DialogHeaderProps {
  title: string;
  variant?: 'default' | 'gradient';
  actions?: React.ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export function DialogHeader({
  title,
  variant = 'default',
  actions,
  showCloseButton = true,
  onClose,
}: DialogHeaderProps) {
  const getHeaderClasses = (): string => {
    return variant === 'gradient'
      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
      : 'bg-gray-50 border-b border-gray-200';
  };

  const getTitleClasses = (): string => {
    return variant === 'gradient' ? '' : 'text-gray-900';
  };

  return (
    <div className={`flex items-center justify-between px-6 py-4 ${getHeaderClasses()} rounded-t-lg`}>
      <h2 className={`text-lg font-semibold ${getTitleClasses()}`}>
        {title}
      </h2>
      <div className="flex items-center gap-2">
        {actions}
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-black/10 transition-colors ${variant === 'gradient' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
            title="关闭"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
