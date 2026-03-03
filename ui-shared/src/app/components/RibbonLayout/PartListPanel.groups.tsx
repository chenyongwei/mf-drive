import React from 'react';
import { Part, PartGroup } from './PartListPanel.types';

const PLACEHOLDER_THUMBNAIL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZDFkNWRiIi8+PC9zdmc+';

interface PartListPanelGroupsProps {
  parts: Part[];
  groups: PartGroup[];
  displayMode: 'list' | 'thumbnail' | 'detail';
  expandedFiles: Set<string>;
  selectedPartIds: Set<string>;
  onToggleFileExpanded: (fileId: string) => void;
  onPartMultiSelect: (partIds: string[]) => void;
  onPartClick: (event: React.MouseEvent, partId: string, partsList: Part[]) => void;
}

const mergeGroupSelection = (
  selectedPartIds: Set<string>,
  groupParts: Part[],
  selectAll: boolean,
) => {
  if (selectAll) {
    return [...Array.from(selectedPartIds), ...groupParts.map(part => part.id)];
  }

  if (selectedPartIds.size <= groupParts.length) {
    return [];
  }

  return Array.from(selectedPartIds).filter(id => !groupParts.some(part => part.id === id));
};

const GroupHeader: React.FC<{
  group: PartGroup;
  isExpanded: boolean;
  allSelected: boolean;
  someSelected: boolean;
  imageSizeClass: string;
  onToggle: () => void;
  onToggleSelect: () => void;
}> = ({
  group,
  isExpanded,
  allSelected,
  someSelected,
  imageSizeClass,
  onToggle,
  onToggleSelect,
}) => (
  <div
    onClick={(event) => {
      event.stopPropagation();
      onToggle();
    }}
    className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 cursor-pointer"
  >
    <svg
      className={`w-3 h-3 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
    <input
      type="checkbox"
      checked={allSelected}
      ref={(element) => {
        if (element) {
          element.indeterminate = someSelected && !allSelected;
        }
      }}
      onChange={(event) => {
        event.stopPropagation();
        onToggleSelect();
      }}
      className="w-3 h-3"
    />
    <div className={`${imageSizeClass} bg-slate-200 rounded overflow-hidden flex-shrink-0`}>
      <img
        src={group.fileThumbnailUrl}
        alt={group.fileName}
        className="w-full h-full object-cover"
        onLoad={(event) => {
          event.currentTarget.style.opacity = '1';
        }}
        onError={(event) => {
          event.currentTarget.src = PLACEHOLDER_THUMBNAIL;
          event.currentTarget.style.opacity = '1';
        }}
        style={{ opacity: '0' }}
      />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs font-medium text-slate-800 truncate">{group.fileName}</div>
      <div className="text-[10px] text-slate-500">{group.parts.length} 个零件</div>
    </div>
  </div>
);

const ThumbnailGroupContent: React.FC<{
  group: PartGroup;
  selectedPartIds: Set<string>;
  onPartClick: (event: React.MouseEvent, partId: string, partsList: Part[]) => void;
}> = ({ group, selectedPartIds, onPartClick }) => (
  <div className="p-2 grid grid-cols-2 gap-2 bg-white">
    {group.parts.map((part) => (
      <div
        key={part.id}
        onClick={(event) => onPartClick(event, part.id, group.parts)}
        className={[
          'p-2 rounded cursor-pointer border transition-all',
          selectedPartIds.has(part.id)
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-transparent hover:bg-slate-100',
        ].join(' ')}
      >
        <div className="flex items-center gap-1 mb-1">
          <input
            type="checkbox"
            checked={selectedPartIds.has(part.id)}
            onChange={(event) => event.stopPropagation()}
            className="w-3 h-3"
          />
          <span className="text-[10px] font-medium truncate flex-1">
            {part.name.replace(`${group.fileName}_`, '')}
          </span>
          {part.status === 'nested' && (
            <span className="text-[10px] bg-green-100 text-green-700 px-0.5 rounded">✓</span>
          )}
        </div>
        <div className="text-[9px] text-slate-600">
          <div>{part.dimensions.width.toFixed(0)}×{part.dimensions.height.toFixed(0)} · {part.quantity}件</div>
        </div>
      </div>
    ))}
  </div>
);

const ListGroupContent: React.FC<{
  group: PartGroup;
  selectedPartIds: Set<string>;
  onPartClick: (event: React.MouseEvent, partId: string, partsList: Part[]) => void;
}> = ({ group, selectedPartIds, onPartClick }) => (
  <div className="divide-y divide-slate-100">
    {group.parts.map((part) => (
      <div
        key={part.id}
        onClick={(event) => onPartClick(event, part.id, group.parts)}
        className={`px-2 py-1.5 pl-6 cursor-pointer hover:bg-slate-50 transition-colors ${selectedPartIds.has(part.id) ? 'bg-indigo-50' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={selectedPartIds.has(part.id)}
              onChange={(event) => event.stopPropagation()}
              className="w-3 h-3"
            />
            <span className="text-xs font-medium text-slate-800 truncate">
              {part.name.replace(`${group.fileName}_`, '')}
            </span>
            {part.status === 'nested' && (
              <span className="text-[10px] bg-green-100 text-green-700 px-0.5 rounded">✓</span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 ml-2">
            <span>{part.dimensions.width.toFixed(0)}×{part.dimensions.height.toFixed(0)}</span>
            <span className="mx-1">·</span>
            <span>{part.quantity}件</span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const PartListPanelGroups: React.FC<PartListPanelGroupsProps> = ({
  parts,
  groups,
  displayMode,
  expandedFiles,
  selectedPartIds,
  onToggleFileExpanded,
  onPartMultiSelect,
  onPartClick,
}) => {
  if (parts.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p className="text-sm">暂无零件</p>
        <p className="text-xs mt-1">点击"导入"添加零件</p>
      </div>
    );
  }

  const isThumbnail = displayMode === 'thumbnail';

  return (
    <div className={isThumbnail ? 'p-2' : ''}>
      {groups.map((group) => {
        const isExpanded = expandedFiles.has(group.fileId);
        const allSelected = group.parts.every(part => selectedPartIds.has(part.id));
        const someSelected = group.parts.some(part => selectedPartIds.has(part.id));

        return (
          <div key={group.fileId} className={isThumbnail ? 'mb-3 border border-slate-200 rounded-lg overflow-hidden' : 'border-b border-slate-200'}>
            <GroupHeader
              group={group}
              isExpanded={isExpanded}
              allSelected={allSelected}
              someSelected={someSelected}
              imageSizeClass={isThumbnail ? 'w-10 h-10' : 'w-8 h-8'}
              onToggle={() => onToggleFileExpanded(group.fileId)}
              onToggleSelect={() => onPartMultiSelect(mergeGroupSelection(selectedPartIds, group.parts, !allSelected))}
            />

            {isExpanded && (
              isThumbnail
                ? <ThumbnailGroupContent group={group} selectedPartIds={selectedPartIds} onPartClick={onPartClick} />
                : <ListGroupContent group={group} selectedPartIds={selectedPartIds} onPartClick={onPartClick} />
            )}
          </div>
        );
      })}
    </div>
  );
};
