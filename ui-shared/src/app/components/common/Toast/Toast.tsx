import React from 'react';
import { useToast } from './ToastContext';
import { ToastType } from './types';

const getToastStyles = (type: ToastType): string => {
  const baseStyles = 'border-l-4 shadow-lg';

  switch (type) {
    case 'success':
      return `${baseStyles} border-green-500 bg-white`;
    case 'error':
      return `${baseStyles} border-red-500 bg-white`;
    case 'warning':
      return `${baseStyles} border-yellow-500 bg-white`;
    case 'info':
    default:
      return `${baseStyles} border-blue-500 bg-white`;
  }
};

const getIcon = (type: ToastType): React.ReactNode => {
  const iconClass = 'w-5 h-5';

  switch (type) {
    case 'success':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'error':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'warning':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

const getIconColor = (type: ToastType): string => {
  switch (type) {
    case 'success':
      return 'text-green-500';
    case 'error':
      return 'text-red-500';
    case 'warning':
      return 'text-yellow-500';
    case 'info':
    default:
      return 'text-blue-500';
  }
};

export function ToastContainer() {
  const { toasts, remove } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getToastStyles(toast.type)} rounded-md p-4 flex items-start gap-3 animate-in slide-in-from-right fade-in duration-300`}
        >
          <div className={`${getIconColor(toast.type)} flex-shrink-0 mt-0.5`}>
            {getIcon(toast.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">{toast.message}</p>
          </div>
          <button
            onClick={() => remove(toast.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

export { ToastProvider, useToast } from './ToastContext';
