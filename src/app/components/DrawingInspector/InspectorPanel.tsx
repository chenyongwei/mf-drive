import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  InspectionResult,
  InspectionIssue,
  InspectionLevel,
} from '@dxf-fix/shared/types/inspection';
import type { InspectorPanelProps } from './InspectorPanel.types';
import {
  getIssueTypeLabel,
  getLevelColor,
  getLevelIcon,
} from './InspectorPanel.utils';

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  inspectionResult,
  loading,
  onIssueClick,
  onIssueHover,
  onReinspect,
  selectedIssueIds = new Set(),
  hoveredIssueId,
}) => {
  const [tolerance, setTolerance] = useState(0.5);
  const [filterLevel, setFilterLevel] = useState<InspectionLevel | 'all'>('all');
  const [ctrlPressed, setCtrlPressed] = useState(false);

  const filteredIssues = useMemo(() => {
    if (!inspectionResult) return [];

    return inspectionResult.issues.filter((issue) => {
      if (filterLevel === 'all') return true;
      return issue.level === filterLevel;
    });
  }, [inspectionResult, filterLevel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setCtrlPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setCtrlPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleReinspect = () => {
    if (onReinspect) {
      onReinspect(tolerance);
    }
  };

  const handleIssueClick = (issue: InspectionIssue, e: React.MouseEvent) => {
    e.stopPropagation();
    onIssueClick?.(issue);
  };

  const handleIssueHover = (issue: InspectionIssue | null) => {
    onIssueHover?.(issue);
  };

  const isIssueSelected = (issueId: string) => selectedIssueIds.has(issueId);
  const isIssueHovered = (issueId: string) => hoveredIssueId === issueId;

  if (loading) {
    return (
      <div className="p-2 bg-white border-l border-gray-200 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-1"></div>
          <p className="text-xs text-gray-600">正在检查图纸...</p>
        </div>
      </div>
    );
  }

  if (!inspectionResult) {
    return (
      <div className="p-2 bg-white border-l border-gray-200 h-full">
        <div className="text-center text-gray-500 py-4">
          <svg
            className="mx-auto h-8 w-8 text-gray-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm">未执行检查</p>
          <p className="text-xs mt-1">图纸加载完成后将自动进行检查</p>
        </div>
      </div>
    );
  }

  const { summary, issues, recommendations } = inspectionResult;

  return (
    <div className="p-2 bg-white border-l border-gray-200 h-full flex flex-col text-sm">
      {/* 标题和配置 */}
      <div className="mb-2">
        <h3 className="text-base font-semibold text-gray-900 mb-2">图纸检查</h3>

        {/* 容差配置 */}
        <div className="mb-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            容差: {tolerance.toFixed(2)}mm
          </label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={tolerance}
            onChange={(e) => setTolerance(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-0.5">
            <span>0.1mm</span>
            <span>2.0mm</span>
          </div>
        </div>

        {/* 重新检查按钮 */}
        <button
          onClick={handleReinspect}
          className="w-full px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors mb-2"
        >
          重新检查
        </button>
      </div>

      {/* 统计摘要 - 紧凑版 */}
      <div className="mb-2 p-2 bg-gray-50 rounded">
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="p-1.5 bg-blue-50 rounded">
            <div className="text-lg font-bold text-blue-600">{summary.info}</div>
            <div className="text-xs text-gray-600">提醒</div>
          </div>
          <div className="p-1.5 bg-yellow-50 rounded">
            <div className="text-lg font-bold text-yellow-600">{summary.warning}</div>
            <div className="text-xs text-gray-600">警告</div>
          </div>
          <div className="p-1.5 bg-red-50 rounded">
            <div className="text-lg font-bold text-red-600">{summary.error}</div>
            <div className="text-xs text-gray-600">报错</div>
          </div>
        </div>
        {selectedIssueIds.size > 0 && (
          <div className="mt-1.5 text-center text-xs text-gray-600 bg-blue-50 py-1 rounded">
            已选 {selectedIssueIds.size} 项 {ctrlPressed && '(按住Ctrl多选)'}
          </div>
        )}
        {summary.total === 0 && (
          <div className="mt-1.5 text-center text-green-600 font-medium text-xs">
            ✓ 未发现质量问题
          </div>
        )}
      </div>

      {/* 过滤器 - 紧凑版 */}
      {issues.length > 0 && (
        <div className="mb-2">
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterLevel('all')}
              className={`px-2 py-0.5 text-xs rounded-full transition-colors ${filterLevel === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              全部 ({issues.length})
            </button>
            <button
              onClick={() => setFilterLevel(InspectionLevel.ERROR)}
              className={`px-2 py-0.5 text-xs rounded-full transition-colors ${filterLevel === InspectionLevel.ERROR
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
            >
              报错 ({summary.error})
            </button>
            <button
              onClick={() => setFilterLevel(InspectionLevel.WARNING)}
              className={`px-2 py-0.5 text-xs rounded-full transition-colors ${filterLevel === InspectionLevel.WARNING
                ? 'bg-yellow-500 text-white'
                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                }`}
            >
              警告 ({summary.warning})
            </button>
            <button
              onClick={() => setFilterLevel(InspectionLevel.INFO)}
              className={`px-2 py-0.5 text-xs rounded-full transition-colors ${filterLevel === InspectionLevel.INFO
                ? 'bg-blue-500 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
            >
              提醒 ({summary.info})
            </button>
          </div>
        </div>
      )}

      {/* 问题列表 - 紧凑版、可滚动、支持hover和选中 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredIssues.length === 0 ? (
          <div className="text-center text-gray-500 py-4 text-xs">
            {issues.length === 0
              ? '未发现质量问题'
              : '没有符合当前过滤条件的问题'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredIssues.map((issue) => {
              const selected = isIssueSelected(issue.id);
              const hovered = isIssueHovered(issue.id);

              return (
                <div
                  key={issue.id}
                  onClick={(e) => handleIssueClick(issue, e)}
                  onMouseEnter={() => handleIssueHover(issue)}
                  onMouseLeave={() => handleIssueHover(null)}
                  className={`p-2 border rounded cursor-pointer transition-all relative ${selected
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : hovered
                      ? 'shadow-md bg-gray-50'
                      : 'hover:shadow-sm'
                    } ${getLevelColor(issue.level)}`}
                >
                  {/* Checkbox indicator */}
                  <div className="absolute top-2 left-2">
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${selected ? 'bg-blue-500 border-blue-500' : 'border-gray-400 bg-white'
                      }`}>
                      {selected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Issue content */}
                  <div className="flex items-start gap-2 ml-6">
                    <span className="text-sm leading-none mt-0.5">
                      {getLevelIcon(issue.level)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium mb-0.5">
                        {getIssueTypeLabel(issue.type)}
                      </div>
                      <div className="text-xs opacity-90 line-clamp-2">{issue.message}</div>
                      {issue.data?.gapDistance && (
                        <div className="text-xs mt-0.5 opacity-75">
                          间隙: {issue.data.gapDistance.toFixed(2)}mm
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 建议 - 紧凑版 */}
      {recommendations && recommendations.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-700 mb-1">修复建议</h4>
          <ul className="text-xs space-y-0.5">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="text-gray-600 flex items-start gap-1">
                <span className="text-blue-500 mt-0.5 text-xs">•</span>
                <span className="flex-1">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
