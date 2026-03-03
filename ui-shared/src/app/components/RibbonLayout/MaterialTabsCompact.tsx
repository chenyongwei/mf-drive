import React, { useState, useRef } from 'react';
import { useDismissOnOutsideClick } from './hooks/useDismissOnOutsideClick';

interface MaterialGroup {
  id: string;
  material: string;
  thickness: number;
  partCount: number;
  totalQuantity: number;
  nestedCount: number;
  nestResultCount: number;
  hasUnsavedChanges: boolean;
  isNesting?: boolean;
  nestingProgress?: number;
  nestingUtilization?: number;
}

interface MaterialTabsCompactProps {
  groups: MaterialGroup[];
  activeGroupId?: string;
  onGroupSelect: (groupId: string) => void;
  onCreateGroup?: () => void;
  onGroupClose?: (groupId: string) => void;
}

const MaterialTabsCompact: React.FC<MaterialTabsCompactProps> = ({
  groups,
  activeGroupId,
  onGroupSelect,
  onCreateGroup,
  onGroupClose
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useDismissOnOutsideClick(isOpen, menuRef, () => setIsOpen(false));

  const activeGroup = groups.find(g => g.id === activeGroupId);

  const handleSelect = (groupId: string) => {
    onGroupSelect(groupId);
    setIsOpen(false);
  };

  const handleClose = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    if (onGroupClose) {
      onGroupClose(groupId);
    }
  };

  const getUtilizationColor = (utilization?: number) => {
    if (!utilization) return 'bg-slate-200';
    if (utilization >= 0.8) return 'bg-green-500';
    if (utilization >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="h-9 border-t border-slate-300 bg-slate-50 flex items-center px-3">
      <div className="relative" ref={menuRef}>
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-2 px-3 rounded-md border-2 transition-all duration-200
            ${activeGroup
              ? 'py-0 bg-indigo-50 border-indigo-400 text-indigo-700'
              : 'py-1.5 bg-white border-slate-300 text-slate-700 hover:border-slate-400'
            }
          `}
        >
          {activeGroup?.isNesting ? (
            <div className="w-3.5 h-3.5 animate-spin">
              <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
          ) : (
            <div className={`w-3.5 h-3.5 rounded ${activeGroup ? 'bg-indigo-200' : 'bg-slate-200'}`} />
          )}

          {/* Group Info */}
          <div className="flex-1 text-left">
            <div className="text-xs font-semibold leading-tight">
              {activeGroup ? `${activeGroup.material} ${activeGroup.thickness}mm` : '选择材质厚度'}
            </div>
            {activeGroup && !activeGroup.isNesting && (
              <div className="text-[10px] text-slate-500 leading-tight">
                {activeGroup.nestedCount}/{activeGroup.partCount} 排样
              </div>
            )}
          </div>

          {/* Nesting Progress */}
          {activeGroup?.isNesting && activeGroup.nestingProgress !== undefined && (
            <div className="flex-1 min-w-[180px]">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-medium text-indigo-700">排样中...</span>
                <span className="text-[10px] text-indigo-600">{activeGroup.nestingProgress}%</span>
              </div>
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-200"
                  style={{ width: `${activeGroup.nestingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Dropdown Arrow */}
          <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-2xl border border-slate-200 w-[340px] max-h-[200px] overflow-hidden z-50">
            {/* Header */}
            <div className="px-3 py-1.5 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <h3 className="text-[10px] font-semibold text-slate-700">材质厚度分组</h3>
            </div>

            {/* Groups List */}
            <div className="max-h-[140px] overflow-y-auto">
              {groups.map((group) => {
                const isActive = group.id === activeGroupId;
                const utilizationColor = group.nestingUtilization !== undefined ? getUtilizationColor(group.nestingUtilization) : '';

                return (
                  <div
                    key={group.id}
                    onClick={() => handleSelect(group.id)}
                    className={`
                      relative px-3 py-1.5 border-b border-slate-100 cursor-pointer
                      transition-all duration-150
                      ${isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        {/* Indicator */}
                        <div className={`w-3 h-3 rounded ${isActive ? 'bg-indigo-200' : 'bg-slate-200'}`} />

                        {/* Info */}
                        <div className="flex-1">
                          <div className={`text-[10px] font-medium leading-tight ${isActive ? 'text-indigo-700' : 'text-slate-800'}`}>
                            {group.material} {group.thickness}mm
                          </div>
                          <div className="text-[9px] text-slate-500 flex items-center gap-1.5 leading-tight">
                            <span>{group.partCount} 零件</span>
                            <span>•</span>
                            <span>{group.nestResultCount} 结果</span>
                            {group.isNesting && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-600">排样中...</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Close Button */}
                      {onGroupClose && !group.isNesting && (
                        <button
                          onClick={(e) => handleClose(e, group.id)}
                          className="p-0.5 hover:bg-red-100 rounded text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}

                      {/* Utilization Bar */}
                      {!group.isNesting && group.nestingUtilization !== undefined && (
                        <div className="w-12">
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${utilizationColor}`}
                              style={{ width: `${group.nestingUtilization * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {groups.length === 0 && (
                <div className="p-6 text-center text-slate-400">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-[10px]">暂无材质厚度分组</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {onCreateGroup && (
              <div className="p-2 bg-slate-50 border-t border-slate-200">
                <button
                  onClick={() => {
                    onCreateGroup();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-[10px] font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  新建材质厚度组
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialTabsCompact;
