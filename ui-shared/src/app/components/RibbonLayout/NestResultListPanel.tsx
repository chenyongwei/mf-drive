import React, { useState } from 'react';

interface NestResult {
  id: string;
  name: string;
  utilization: number;
  sheetDimensions: { width: number; height: number };
  partsCount: number;
  totalPartsCount?: number;
  timestamp: string;
  status: 'draft' | 'confirmed' | 'exported';
  thumbnail?: string;
  isLocked?: boolean;
}

interface NestResultListPanelProps {
  results: NestResult[];
  selectedResultIds: Set<string>;
  onResultSelect: (resultId: string) => void;
  onResultMultiSelect: (resultIds: string[]) => void;
  onViewDetails: (resultId: string) => void;
  onDelete: (resultIds: string[]) => void;
  onExport: (resultIds: string[]) => void;
  onDuplicate: (resultId: string) => void;
  onLock: (resultId: string) => void;
  onStatusChange: (resultId: string, status: NestResult['status']) => void;
}

const NestResultListPanel: React.FC<NestResultListPanelProps> = ({
  results,
  selectedResultIds,
  onResultSelect,
  onResultMultiSelect,
  onViewDetails,
  onDelete,
  onExport,
  onDuplicate,
  onLock,
  onStatusChange
}) => {
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [showBatchMenu, setShowBatchMenu] = useState(false);

  const handleResultClick = (e: React.MouseEvent, resultId: string) => {
    if (e.ctrlKey || e.metaKey) {
      const newSelection = new Set(selectedResultIds);
      if (newSelection.has(resultId)) {
        newSelection.delete(resultId);
      } else {
        newSelection.add(resultId);
      }
      onResultMultiSelect(Array.from(newSelection));
    } else {
      onResultSelect(resultId);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedResultIds.size > 0) {
      onDelete(Array.from(selectedResultIds));
    }
    setShowBatchMenu(false);
  };

  const handleExportSelected = () => {
    if (selectedResultIds.size > 0) {
      onExport(Array.from(selectedResultIds));
    }
    setShowBatchMenu(false);
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 0.85) return 'bg-green-500';
    if (utilization >= 0.70) return 'bg-yellow-500';
    if (utilization >= 0.50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (status: NestResult['status']) => {
    switch (status) {
      case 'draft':
        return <span className="text-xs text-slate-500">📝</span>;
      case 'confirmed':
        return <span className="text-xs text-green-600">✓</span>;
      case 'exported':
        return <span className="text-xs text-blue-600">📤</span>;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  const averageUtilization = results.length > 0
    ? results.reduce((sum, r) => sum + r.utilization, 0) / results.length
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">排版结果</h2>
        
        {/* Stats */}
        <div className="bg-slate-100 rounded p-2 mb-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">结果数:</span>
              <span className="font-semibold ml-1">{results.length}</span>
            </div>
            <div>
              <span className="text-slate-500">平均利用率:</span>
              <span className={`font-semibold ml-1 ${averageUtilization >= 0.7 ? 'text-green-600' : averageUtilization >= 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                {(averageUtilization * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Actions */}
      {selectedResultIds.size > 0 && (
        <div className="p-2 bg-indigo-50 border-b border-indigo-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-700">
              已选 {selectedResultIds.size} 个排版
            </span>
            <div className="relative">
              <button
                onClick={() => setShowBatchMenu(!showBatchMenu)}
                className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
              >
                批量操作 ▼
              </button>
              {showBatchMenu && (
                <div className="absolute right-0 top-8 bg-white border rounded shadow-lg z-10 min-w-32">
                  <button
                    onClick={() => { handleExportSelected(); setShowBatchMenu(false); }}
                    className="block w-full text-left px-3 py-1 text-xs hover:bg-slate-100"
                  >
                    导出
                  </button>
                  <button
                    onClick={() => { handleDeleteSelected(); setShowBatchMenu(false); }}
                    className="block w-full text-left px-3 py-1 text-xs hover:bg-slate-100 text-red-600"
                  >
                    删除
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result List */}
      <div className="flex-1 overflow-y-auto">
        {results.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="text-sm">暂无排版结果</p>
            <p className="text-xs mt-1">开始排样后结果将显示在这里</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {results.map((result) => (
              <div
                key={result.id}
                onClick={(e) => handleResultClick(e, result.id)}
                className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors relative ${
                  selectedResultIds.has(result.id) ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                }`}
              >
                {/* Menu Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(showMenu === result.id ? null : result.id);
                  }}
                  className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                >
                  ⋮
                </button>

                {/* Dropdown Menu */}
                {showMenu === result.id && (
                  <div className="absolute right-2 top-8 bg-white border rounded shadow-lg z-10 min-w-32">
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewDetails(result.id); setShowMenu(null); }}
                      className="block w-full text-left px-3 py-1 text-xs hover:bg-slate-100"
                    >
                      查看详情
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDuplicate(result.id); setShowMenu(null); }}
                      className="block w-full text-left px-3 py-1 text-xs hover:bg-slate-100"
                    >
                      复制
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onLock(result.id); setShowMenu(null); }}
                      className="block w-full text-left px-3 py-1 text-xs hover:bg-slate-100"
                    >
                      {result.isLocked ? '🔓 解锁' : '🔒 锁定'}
                    </button>
                    <hr />
                    <button
                      onClick={(e) => { e.stopPropagation(); onStatusChange(result.id, 'confirmed'); setShowMenu(null); }}
                      className="block w-full text-left px-3 py-1 text-xs hover:bg-slate-100"
                    >
                      标记为已确认
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onStatusChange(result.id, 'exported'); setShowMenu(null); }}
                      className="block w-full text-left px-3 py-1 text-xs hover:bg-slate-100"
                    >
                      标记为已导出
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete([result.id]); setShowMenu(null); }}
                      className="block w-full text-left px-3 py-1 text-xs hover:bg-slate-100 text-red-600"
                    >
                      删除
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedResultIds.has(result.id)}
                    onChange={(e) => e.stopPropagation()}
                    className="w-4 h-4 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 truncate">
                        #{result.name}
                      </span>
                      {getStatusIcon(result.status)}
                      {result.isLocked && <span className="text-xs">🔒</span>}
                    </div>

                    {/* Utilization Bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span>利用率</span>
                        <span className="font-semibold">{(result.utilization * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getUtilizationColor(result.utilization)} transition-all`}
                          style={{ width: `${result.utilization * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mt-2 text-xs text-slate-500 grid grid-cols-2 gap-1">
                      <div>板材: {result.sheetDimensions.width}×{result.sheetDimensions.height}</div>
                      <div>零件: {result.partsCount}/{result.totalPartsCount || result.partsCount}</div>
                      <div className="col-span-2">{formatTime(result.timestamp)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NestResultListPanel;
