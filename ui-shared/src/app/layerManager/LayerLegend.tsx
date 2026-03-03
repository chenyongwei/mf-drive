import React from 'react';

export function LayerLegend() {
  return (
    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
      <h4 className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-2">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        图例说明
      </h4>
      <div className="space-y-1.5 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-green-500"></div>
          <span>切割 - 绿色实线</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-cyan-500 border-dashed border-t-2 border-cyan-500"></div>
          <span>打标 - 青色虚线</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-slate-300"></div>
          <span>不加工 - 白色实线</span>
        </div>
      </div>
    </div>
  );
}
