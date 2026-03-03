import React from 'react';

interface NestingProgressOverlayProps {
  isRunning: boolean;
  progress: number;
  utilization: number;
  placedParts: number;
  totalParts: number;
  groupName: string;
  previewUrl?: string;
}

const NestingProgressOverlay: React.FC<NestingProgressOverlayProps> = ({
  isRunning,
  progress,
  utilization,
  placedParts,
  totalParts,
  groupName,
  previewUrl
}) => {
  if (!isRunning) return null;

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40">
      <div className="bg-white rounded-2xl shadow-2xl w-[420px] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-spin">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">正在排样...</h2>
                <p className="text-sm text-indigo-200">{groupName}</p>
              </div>
            </div>
            <span className="text-3xl font-bold text-white">{progress}%</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">排样进度</span>
              <span className="text-sm text-slate-500">已放置 {placedParts}/{totalParts} 个零件</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Utilization */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">材料利用率</span>
              <span className={`text-lg font-bold ${utilization >= 80 ? 'text-green-600' : utilization >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {(utilization * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  utilization >= 0.8 ? 'bg-green-500' : utilization >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${utilization * 100}%` }}
              />
            </div>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                <span className="text-sm font-medium text-slate-700">实时预览</span>
              </div>
              <div className="aspect-video bg-slate-100 flex items-center justify-center">
                <img src={previewUrl} alt="排样预览" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>零件和排版操作已禁用</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors">
              暂停
            </button>
            <button className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
              停止
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NestingProgressOverlay;
