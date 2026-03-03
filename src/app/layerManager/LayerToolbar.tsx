import React from 'react';

type GroupType = 'none' | 'color' | 'name';

interface LayerToolbarProps {
  groupType: GroupType;
  onGroupTypeChange: (type: GroupType) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function LayerToolbar({ groupType, onGroupTypeChange, onExport, onImport }: LayerToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <select
          value={groupType}
          onChange={(e) => onGroupTypeChange(e.target.value as GroupType)}
          className="text-xs px-2 py-1.5 rounded-md border border-slate-300 bg-white cursor-pointer hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-1"
        >
          <option value="none">不分组</option>
          <option value="color">按颜色</option>
          <option value="name">按名称</option>
        </select>
      </div>

      {/* Import/Export buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onExport}
          className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
          title="导出映射配置"
        >
          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m4 4v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m4 4v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4" />
          </svg>
        </button>
        <label className="p-1.5 hover:bg-slate-100 rounded-md transition-colors cursor-pointer" title="导入映射配置">
          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <input
            type="file"
            accept=".json"
            onChange={onImport}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
