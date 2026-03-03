import React from 'react';
import { useAppStore } from '../store';
import type { FileInfo, Part } from '@dxf-fix/shared';

const FileList: React.FC = () => {
  const { files, activeFileId, activePartId, setActiveFile, setActivePart, removeFile } = useAppStore();
  const fileList = Array.from(files.values());

  const toggleExpanded = (fileId: string) => {
    const file = files.get(fileId);
    if (file) {
      file.expanded = !file.expanded;
      useAppStore.setState({ files: new Map(files) });
    }
  };

  const handlePartClick = (part: Part) => {
    setActiveFile(part.fileId);
    setActivePart(part.id);
  };

  if (fileList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">暂无文件</p>
        <p className="text-xs mt-1">上传DXF文件开始使用</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'parsing':
        return (
          <svg className="w-4 h-4 text-yellow-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'uploading':
        return (
          <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="divide-y divide-slate-100">
      {fileList.map((file: FileInfo) => (
        <div key={file.id}>
          {/* DXF 文件行 */}
          <div
            className={`group p-3 cursor-pointer transition-colors ${
              activeFileId === file.id ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-slate-50'
            }`}
            onClick={() => setActiveFile(file.id)}
          >
            <div className="flex items-start gap-3">
              {/* 展开/折叠图标 */}
              {file.status === 'ready' && file.partCount && file.partCount > 0 ? (
                <button
                  className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(file.id);
                  }}
                >
                  <svg
                    className={`w-3 h-3 text-slate-400 transition-transform ${file.expanded ? 'rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <div className="w-4 h-4 flex-shrink-0 mt-1"></div>
              )}

              {/* 缩略图 */}
              <div className="w-14 h-14 flex-shrink-0 bg-slate-100 rounded flex items-center justify-center overflow-hidden">
                {file.status === 'ready' ? (
                  <img
                    src={`/api/drawing/files/${file.id}/thumbnail`}
                    alt={file.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(file.status)}
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {file.name}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {file.entityCount !== undefined ? (
                    <span>{file.entityCount} 实体</span>
                  ) : file.progress > 0 ? (
                    <span>{file.progress}%</span>
                  ) : (
                    <span>解析中...</span>
                  )}
                  {file.status === 'ready' && file.partCount !== undefined && (
                    <span className="ml-2">· {file.partCount} 零件</span>
                  )}
                </div>
              </div>

              <button
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-md transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`确定要删除 "${file.name}" 吗?`)) {
                    removeFile(file.id);
                  }
                }}
                title="删除文件"
              >
                <svg className="w-4 h-4 text-slate-400 hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* 零件列表 */}
          {file.expanded && file.parts && file.parts.length > 0 && (
            <div className="bg-slate-50 border-l-2 border-indigo-200 ml-8 mr-2">
              {file.parts.map((part: Part) => (
                <div
                  key={part.id}
                  className={`p-2 pl-3 pr-2 cursor-pointer hover:bg-slate-100 border-t border-slate-100 flex items-center gap-2 transition-colors ${
                    activePartId === part.id ? 'bg-indigo-100' : ''
                  }`}
                  onClick={() => handlePartClick(part)}
                >
                  <svg className="w-3 h-3 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                  </svg>
                  <span className="text-sm text-slate-700 truncate flex-1">{part.name}</span>
                  {part.area && (
                    <span className="text-xs text-slate-400">
                      {(part.area / 100).toFixed(0)}cm²
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FileList;
