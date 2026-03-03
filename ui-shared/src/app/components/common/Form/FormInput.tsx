import React, { InputHTMLAttributes, forwardRef } from 'react';
import { FormField } from './FormField';

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url';
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, required, type = 'text', className = '', ...props }, ref) => {
    const hasField = !!label;

    const inputElement = (
      <input
        ref={ref}
        type={type}
        className={`
          w-full px-3 py-2 text-sm border rounded-md
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          disabled:bg-gray-100 disabled:text-gray-500
          transition-colors
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
    );

    if (!hasField) {
      return inputElement;
    }

    return (
      <FormField label={label!} error={error} hint={hint} required={required}>
        {inputElement}
      </FormField>
    );
  }
);

FormInput.displayName = 'FormInput';
