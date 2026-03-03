import React, { useMemo, useState } from 'react';
import { PartListPanelGroups } from './PartListPanel.groups';
import { Part, PartGroup, PartListPanelProps } from './PartListPanel.types';

const PartListPanel: React.FC<PartListPanelProps> = ({
  parts,
  totalParts,
  selectedPartIds,
  onPartSelect,
  onPartMultiSelect,
  onSelectAll,
  onDelete,
  onImport,
  onEditProperties,
  onDuplicate,
  displayMode,
  onDisplayModeChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  searchQuery,
  onSearchChange,
  filterMinArea,
  filterMaxArea,
  filterMinQuantity,
  filterMaxQuantity,
  filterStatus,
  onFilterMinAreaChange,
  onFilterMaxAreaChange,
  onFilterMinQuantityChange,
  onFilterMaxQuantityChange,
  onFilterStatusChange,
  onClearFilters,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showBatchMenu, setShowBatchMenu] = useState(false);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const groups = useMemo<PartGroup[]>(() => {
    const grouped = parts.reduce((acc, part) => {
      if (!acc[part.fileId]) {
        acc[part.fileId] = {
          fileId: part.fileId,
          fileName: part.fileName,
          fileThumbnailUrl: part.fileThumbnailUrl,
          parts: [],
        };
      }
      acc[part.fileId].parts.push(part);
      return acc;
    }, {} as Record<string, PartGroup>);

    return Object.values(grouped);
  }, [parts]);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onImport(event.target.files);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedPartIds.size > 0) {
      onDelete(Array.from(selectedPartIds));
    }
  };

  const handleDuplicateSelected = () => {
    if (selectedPartIds.size > 0) {
      onDuplicate(Array.from(selectedPartIds));
    }
  };

  const nestedCount = parts.filter(part => part.status === 'nested').length;
  const pendingCount = parts.filter(part => part.status === 'pending').length;

  const toggleFileExpanded = (fileId: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const handlePartClick = (event: React.MouseEvent, partId: string, partsList: Part[]) => {
    if (event.shiftKey && lastSelectedId) {
      const lastIndex = partsList.findIndex(part => part.id === lastSelectedId);
      if (lastIndex !== -1) {
        const currentIndex = partsList.findIndex(part => part.id === partId);
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        const rangeIds = partsList.slice(start, end + 1).map(part => part.id);
        onPartMultiSelect(rangeIds);
      }
    } else if (event.ctrlKey || event.metaKey) {
      const newSelection = new Set(selectedPartIds);
      if (newSelection.has(partId)) {
        newSelection.delete(partId);
      } else {
        newSelection.add(partId);
      }
      onPartMultiSelect(Array.from(newSelection));
    } else {
      onPartSelect(partId);
    }

    setLastSelectedId(partId);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-700">零件列表</h2>
          <select
            value={displayMode}
            onChange={(event) => onDisplayModeChange(event.target.value as any)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="list">列表</option>
            <option value="thumbnail">缩略图</option>
            <option value="detail">详细</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            id="part-import"
            multiple
            accept=".dxf,.dwg"
            onChange={handleFileImport}
            className="hidden"
          />
          <label
            htmlFor="part-import"
            className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 cursor-pointer"
          >
            导入
          </label>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300"
          >
            筛选
          </button>
          <button
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <div className="mt-2">
          <input
            type="text"
            placeholder="搜索零件..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full text-xs border rounded px-2 py-1"
          />
        </div>
      </div>

      {showFilters && (
        <div className="p-3 border-b border-slate-200 bg-slate-50">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs text-slate-600">最小面积</label>
              <input type="number" value={filterMinArea || ''} onChange={(event) => onFilterMinAreaChange?.(event.target.value ? Number(event.target.value) : undefined)} className="w-full text-xs border rounded px-2 py-1 mt-1" placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-slate-600">最大面积</label>
              <input type="number" value={filterMaxArea || ''} onChange={(event) => onFilterMaxAreaChange?.(event.target.value ? Number(event.target.value) : undefined)} className="w-full text-xs border rounded px-2 py-1 mt-1" placeholder="999999" />
            </div>
            <div>
              <label className="text-xs text-slate-600">最小数量</label>
              <input type="number" value={filterMinQuantity || ''} onChange={(event) => onFilterMinQuantityChange?.(event.target.value ? Number(event.target.value) : undefined)} className="w-full text-xs border rounded px-2 py-1 mt-1" placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-slate-600">最大数量</label>
              <input type="number" value={filterMaxQuantity || ''} onChange={(event) => onFilterMaxQuantityChange?.(event.target.value ? Number(event.target.value) : undefined)} className="w-full text-xs border rounded px-2 py-1 mt-1" placeholder="999" />
            </div>
          </div>
          <div className="flex gap-2 mb-2">
            <label className="text-xs text-slate-600">状态:</label>
            <select value={filterStatus} onChange={(event) => onFilterStatusChange(event.target.value as any)} className="text-xs border rounded px-2 py-1">
              <option value="all">全部</option>
              <option value="nested">已排版</option>
              <option value="pending">未排版</option>
            </select>
          </div>
          <button onClick={onClearFilters} className="w-full text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300">清空筛选</button>
        </div>
      )}

      {selectedPartIds.size > 0 && (
        <div className="p-2 bg-indigo-50 border-b border-indigo-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-indigo-700">已选 {selectedPartIds.size} 个零件</span>
            <div className="relative">
              <button onClick={() => setShowBatchMenu(!showBatchMenu)} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">批量操作 ▼</button>
              {showBatchMenu && (
                <div className="absolute right-0 top-8 bg-white border rounded shadow-lg z-10 min-w-32">
                  <button onClick={() => { onEditProperties(Array.from(selectedPartIds)[0]); setShowBatchMenu(false); }} className="block w-full text-left px-3 py-1 text-xs hover:bg-slate-100">编辑属性</button>
                  <button onClick={() => { handleDuplicateSelected(); setShowBatchMenu(false); }} className="block w-full text-left px-3 py-1 text-xs hover:bg-slate-100">复制</button>
                  <button onClick={() => { handleDeleteSelected(); setShowBatchMenu(false); }} className="block w-full text-left px-3 py-1 text-xs hover:bg-slate-100 text-red-600">删除</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <PartListPanelGroups
          parts={parts}
          groups={groups}
          displayMode={displayMode}
          expandedFiles={expandedFiles}
          selectedPartIds={selectedPartIds}
          onToggleFileExpanded={toggleFileExpanded}
          onPartMultiSelect={onPartMultiSelect}
          onPartClick={handlePartClick}
        />
      </div>

      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="font-semibold text-slate-700">{totalParts}</div>
            <div className="text-slate-500">总计</div>
          </div>
          <div>
            <div className="font-semibold text-green-600">{nestedCount}</div>
            <div className="text-slate-500">已排版</div>
          </div>
          <div>
            <div className="font-semibold text-orange-600">{pendingCount}</div>
            <div className="text-slate-500">未排版</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartListPanel;
