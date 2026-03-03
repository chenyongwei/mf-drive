import React from 'react';

interface SuggestionBannerProps {
  onApplyAll: () => void;
}

export function SuggestionBanner({ onApplyAll }: SuggestionBannerProps) {
  return (
    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-indigo-800 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5-1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5-1.253" />
            </svg>
            智能映射建议
          </h4>
          <p className="text-xs text-indigo-600 mt-1">
            根据图层名称自动推荐加工类型
          </p>
        </div>
        <button
          onClick={onApplyAll}
          className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          应用全部
        </button>
      </div>
    </div>
  );
}
