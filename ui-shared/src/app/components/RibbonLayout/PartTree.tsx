import React, { useState } from 'react';
import { useEdit } from '../../contexts/EditContext';
import { Part } from '../../types/editing';

interface FileWithParts {
  fileId: string;
  fileName: string;
  parts: Part[];
}

const PartTree: React.FC = () => {
  const { parts, selectPart, selectedPartIds, clearPartSelection } = useEdit();
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  // Group parts by file
  const filesWithParts = React.useMemo(() => {
    const fileMap = new Map<string, FileWithParts>();

    parts.forEach((part) => {
      if (!fileMap.has(part.fileId)) {
        fileMap.set(part.fileId, {
          fileId: part.fileId,
          fileName: part.fileId, // Could be enhanced with actual file name
          parts: [],
        });
      }
      fileMap.get(part.fileId)!.parts.push(part);
    });

    return Array.from(fileMap.values());
  }, [parts]);

  const toggleFile = (fileId: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const handlePartClick = (part: Part) => {
    if (selectedPartIds.has(part.id)) {
      clearPartSelection();
    } else {
      selectPart(part.id);
    }
  };

  if (filesWithParts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm p-4">
        <div className="text-center">
          <p className="text-2xl mb-2">🔍</p>
          <p>尚未识别零件</p>
          <p className="text-xs mt-1">点击"自动识别零件"按钮开始</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-1">
        {filesWithParts.map((file) => (
          <div key={file.fileId} className="border border-slate-200 rounded overflow-hidden">
            {/* File header */}
            <div
              className={`px-3 py-2 bg-slate-50 cursor-pointer flex items-center justify-between hover:bg-slate-100 transition-colors ${
                expandedFiles.has(file.fileId) ? 'border-b border-slate-200' : ''
              }`}
              onClick={() => toggleFile(file.fileId)}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {expandedFiles.has(file.fileId) ? '📂' : '📁'}
                </span>
                <span className="text-sm font-medium text-slate-700 truncate">
                  {file.fileName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                  {file.parts.length}
                </span>
                <span className="text-xs text-slate-400">
                  {expandedFiles.has(file.fileId) ? '▼' : '▶'}
                </span>
              </div>
            </div>

            {/* Parts list */}
            {expandedFiles.has(file.fileId) && (
              <div className="bg-white p-2 space-y-1">
                {file.parts.map((part) => (
                  <div
                    key={part.id}
                    onClick={() => handlePartClick(part)}
                    className={`px-2 py-1.5 rounded cursor-pointer flex items-center gap-2 transition-colors ${
                      selectedPartIds.has(part.id)
                        ? 'bg-indigo-100 border border-indigo-300'
                        : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    {/* Part color indicator */}
                    <div
                      className="w-4 h-4 rounded border border-slate-300 flex-shrink-0"
                      style={{ backgroundColor: part.color }}
                    />

                    {/* Part thumbnail placeholder */}
                    <div className="w-8 h-8 bg-slate-200 rounded border border-slate-300 flex items-center justify-center text-xs text-slate-500 flex-shrink-0">
                      {part.id.split('-').pop()}
                    </div>

                    {/* Part info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {part.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {part.area.toFixed(2)} mm²
                      </p>
                    </div>

                    {/* Selection indicator */}
                    {selectedPartIds.has(part.id) && (
                      <span className="text-indigo-600 text-xs">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-indigo-50 rounded border border-indigo-200">
        <p className="text-sm text-indigo-900 font-medium">
          📊 统计
        </p>
        <p className="text-xs text-indigo-700 mt-1">
          共 {filesWithParts.length} 个图纸，{parts.size} 个零件
        </p>
      </div>
    </div>
  );
};

export default PartTree;
