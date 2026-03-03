import React from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackToApp?: boolean;
}

export function AuthLayout({ children, title, subtitle, showBackToApp = false }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CloudNest</h1>
          <p className="text-sm text-gray-600 mt-1">Order Management and Drawing, Nesting, Reporting</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-600 mt-2">{subtitle}</p>}
          </div>

          {children}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {showBackToApp && (
            <Link to="/" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回应用
            </Link>
          )}
        </div>

        {/* Terms */}
        <p className="mt-6 text-center text-xs text-gray-500">
          继续使用即表示您同意我们的{' '}
          <a href="#" className="text-indigo-600 hover:text-indigo-700">
            服务条款
          </a>{' '}
          和{' '}
          <a href="#" className="text-indigo-600 hover:text-indigo-700">
            隐私政策
          </a>
        </p>
      </div>
    </div>
  );
}
