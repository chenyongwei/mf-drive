import React, { useState, useMemo } from 'react';
import { useNestingStore } from '../../store/nestingStore';
import { PrtsPartSummary } from '@dxf-fix/shared';

export const PrtsPartsList: React.FC = () => {
  const { allParts, selectedParts, setSelectedParts } = useNestingStore();
  const [searchQuery, setSearchQuery] = useState('');

  // 过滤零件
  const filteredParts = useMemo(() => {
    if (!searchQuery) return allParts;
    const query = searchQuery.toLowerCase();
    return allParts.filter(
      (part) =>
        part.partId.toLowerCase().includes(query) ||
        part.originalFilename?.toLowerCase().includes(query)
    );
  }, [allParts, searchQuery]);

  // 切换零件选择状态
  const togglePart = (part: PrtsPartSummary) => {
    const isSelected = selectedParts.some((p) => p.partId === part.partId);
    if (isSelected) {
      setSelectedParts(selectedParts.filter((p) => p.partId !== part.partId));
    } else {
      setSelectedParts([...selectedParts, part]);
    }
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedParts.length === filteredParts.length) {
      setSelectedParts([]);
    } else {
      setSelectedParts(filteredParts);
    }
  };

  return (
    <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* 搜索栏 */}
      <div className="p-3 border-b border-slate-700">
        <input
          type="text"
          placeholder="搜索零件..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* 统计信息 */}
      <div className="px-3 py-2 border-b border-slate-700 flex items-center justify-between">
        <span className="text-slate-400 text-xs">
          显示 {filteredParts.length} / {allParts.length} 个零件
        </span>
        <button
          onClick={toggleSelectAll}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          {selectedParts.length === filteredParts.length ? '取消全选' : '全选'}
        </button>
      </div>

      {/* 零件列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredParts.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            {searchQuery ? '没有找到匹配的零件' : '暂无零件，请先上传prts文件'}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredParts.map((part) => {
              const isSelected = selectedParts.some((p) => p.partId === part.partId);
              return (
                <div
                  key={part.partId}
                  onClick={() => togglePart(part)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-600/20 border border-blue-500/50'
                      : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {part.originalFilename || part.partId}
                      </p>
                      <p className="text-slate-400 text-xs truncate">
                        {part.partId}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                      isSelected ? 'bg-blue-500' : 'bg-slate-600'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* 零件信息 */}
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                    <span>
                      {part.width.toFixed(0)}×{part.height.toFixed(0)}mm
                    </span>
                    <span>面积: {part.area.toFixed(0)}mm²</span>
                    <span>实体: {part.entityCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
