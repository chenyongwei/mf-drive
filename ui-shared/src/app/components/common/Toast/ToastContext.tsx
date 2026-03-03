import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastOptions } from './types';

interface ToastContextType {
  toasts: Toast[];
  show: (message: string, options?: ToastOptions) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  remove: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
  defaultDuration?: number;
}

export function ToastProvider({ children, defaultDuration = 3000 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = {
      id,
      type: options.type || 'info',
      message,
      duration: options.duration ?? defaultDuration,
    };

    setToasts((prev) => [...prev, toast]);

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        remove(id);
      }, toast.duration);
    }

    return id;
  }, [defaultDuration, remove]);

  const success = useCallback((message: string, duration?: number) => {
    return show(message, { type: 'success', duration });
  }, [show]);

  const error = useCallback((message: string, duration?: number) => {
    return show(message, { type: 'error', duration });
  }, [show]);

  const warning = useCallback((message: string, duration?: number) => {
    return show(message, { type: 'warning', duration });
  }, [show]);

  const info = useCallback((message: string, duration?: number) => {
    return show(message, { type: 'info', duration });
  }, [show]);

  return (
    <ToastContext.Provider value={{ toasts, show, success, error, warning, info, remove }}>
      {children}
    </ToastContext.Provider>
  );
}
