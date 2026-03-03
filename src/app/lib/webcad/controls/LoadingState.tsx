import React from 'react';

interface LoadingStateProps {
  currentFile: any;
}

export function LoadingState({ currentFile }: LoadingStateProps) {
  if (currentFile.status !== 'ready') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">
            {currentFile.status === 'parsing'
              ? `解析中... ${currentFile.progress ?? 0}%`
              : currentFile.status === 'error'
              ? '解析失败'
              : '处理中...'}
          </p>
          {currentFile.status === 'error' && currentFile.errorMessage && (
            <p className="text-red-500 text-sm mt-2">{currentFile.errorMessage}</p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
