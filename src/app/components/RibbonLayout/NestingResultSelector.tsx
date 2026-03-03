import React, { useState } from 'react';

interface NestingResult {
  id: string;
  name: string;
  utilization: number;
  sheetDimensions: { width: number; height: number };
  partsCount: number;
  totalParts: number;
  scrapArea: number;
  previewUrl?: string;
}

interface NestingResultSelectorProps {
  isOpen: boolean;
  results: NestingResult[];
  onSave: (resultId: string, name: string) => void;
  onRenest?: () => void;
  onClose: () => void;
  defaultName?: string;
}

const NestingResultSelector: React.FC<NestingResultSelectorProps> = ({
  isOpen,
  results,
  onSave,
  onRenest,
  onClose,
  defaultName
}) => {
  const [selectedResultId, setSelectedResultId] = useState<string>(results[0]?.id || '');
  const [customName, setCustomName] = useState(defaultName || '');

  const handleSave = () => {
    if (!selectedResultId) return;
    const name = customName.trim() || `方案_${Date.now()}`;
    onSave(selectedResultId, name);
  };

  const generateDefaultName = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.toTimeString().slice(0, 5).replace(':', '');
    return `方案_${dateStr}_${timeStr}`;
  };

  if (!isOpen) return null;

  const selectedResult = results.find(r => r.id === selectedResultId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[700px] max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-green-500 to-green-600">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              排样完成！
            </h2>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-6">
            <p className="text-sm text-slate-600">请选择要保存的排样结果：</p>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 gap-4">
            {results.map((result, index) => {
              const isSelected = result.id === selectedResultId;
              const utilizationColor = result.utilization >= 0.8 ? 'green' : result.utilization >= 0.6 ? 'yellow' : 'red';

              return (
                <div
                  key={result.id}
                  onClick={() => setSelectedResultId(result.id)}
                  className={`
                    relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                    ${isSelected
                      ? `border-${utilizationColor}-500 bg-${utilizationColor}-50 ring-2 ring-${utilizationColor}-200`
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }
                  `}
                >
                  {/* Radio Button */}
                  <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? `border-${utilizationColor}-500 bg-${utilizationColor}-500`
                      : 'border-slate-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Result Info */}
                  <div className="flex gap-4">
                    {/* Preview */}
                    {result.previewUrl ? (
                      <div className="w-32 h-24 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img src={result.previewUrl} alt={result.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-32 h-24 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`text-lg font-semibold ${isSelected ? `text-${utilizationColor}-700` : 'text-slate-800'}`}>
                          方案 {String.fromCharCode(65 + index)}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-bold text-white rounded ${
                          result.utilization >= 0.8 ? 'bg-green-500' : result.utilization >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}>
                          {(result.utilization * 100).toFixed(0)}%
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>板材: {result.sheetDimensions.width}×{result.sheetDimensions.height}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span>零件: {result.partsCount}/{result.totalParts}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>废料: {result.scrapArea.toLocaleString()} mm²</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Name Input */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              方案名称
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={generateDefaultName()}
                className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={() => setCustomName(generateDefaultName())}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
              >
                自动生成
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {onRenest && (
            <button
              onClick={onRenest}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
            >
              重新排样
            </button>
          )}
          {!onRenest && <div />}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedResultId}
              className="px-6 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              保存到列表 (Space)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NestingResultSelector;
