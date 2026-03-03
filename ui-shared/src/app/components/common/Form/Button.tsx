import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, children, className = '', disabled, ...props }, ref) => {
    const getVariantClasses = (): string => {
      switch (variant) {
        case 'secondary':
          return 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500';
        case 'danger':
          return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
        case 'ghost':
          return 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500';
        case 'primary':
        default:
          return 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500';
      }
    };

    const getSizeClasses = (): string => {
      switch (size) {
        case 'sm':
          return 'px-2.5 py-1.5 text-xs';
        case 'lg':
          return 'px-4 py-2.5 text-base';
        case 'md':
        default:
          return 'px-3 py-2 text-sm';
      }
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2 font-medium rounded-md
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all
          ${getVariantClasses()}
          ${getSizeClasses()}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
