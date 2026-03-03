import React from 'react';

export function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center text-gray-500">
      <div className="text-center">
        <svg className="mx-auto h-24 w-24 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>请上传DXF文件开始使用</p>
      </div>
    </div>
  );
}
