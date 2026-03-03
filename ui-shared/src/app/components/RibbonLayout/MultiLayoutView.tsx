import React, { useState, useCallback } from 'react';

interface Part {
  id: string;
  name: string;
  dimensions: { width: number; height: number };
  quantity: number;
  x: number;
  y: number;
}

interface Layout {
  id: string;
  name: string;
  utilization: number;
  parts: Part[];
  sheetDimensions: { width: number; height: number };
}

interface MultiLayoutViewProps {
  layouts: Layout[];
  selectedLayoutIds: string[];
  onPartMove: (partId: string, fromLayoutId: string, toLayoutId: string, x: number, y: number) => void;
}

const MultiLayoutView: React.FC<MultiLayoutViewProps> = ({
  layouts,
  selectedLayoutIds,
  onPartMove
}) => {
  const [draggedPart, setDraggedPart] = useState<{ part: Part; fromLayoutId: string } | null>(null);
  const [hoveredLayoutId, setHoveredLayoutId] = useState<string | null>(null);

  const handleDragStart = (part: Part, layoutId: string, e: React.DragEvent) => {
    setDraggedPart({ part, fromLayoutId: layoutId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', part.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (layoutId: string) => {
    if (draggedPart && layoutId !== draggedPart.fromLayoutId) {
      setHoveredLayoutId(layoutId);
    }
  };

  const handleDragLeave = () => {
    setHoveredLayoutId(null);
  };

  const handleDrop = (layoutId: string, e: React.DragEvent) => {
    e.preventDefault();
    setHoveredLayoutId(null);

    if (!draggedPart || layoutId === draggedPart.fromLayoutId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onPartMove(draggedPart.part.id, draggedPart.fromLayoutId, layoutId, x, y);
    setDraggedPart(null);
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 0.8) return 'bg-green-500';
    if (utilization >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const visibleLayouts = layouts.filter(l => selectedLayoutIds.includes(l.id));

  if (visibleLayouts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center text-slate-400">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg font-medium">选择排版以查看</p>
          <p className="text-sm mt-2">在右侧排版列表中选择多个排版，方便零件在不同排版间移动</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-100 p-4 overflow-auto">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${visibleLayouts.length}, 1fr)` }}>
        {visibleLayouts.map((layout) => {
          const isHovered = hoveredLayoutId === layout.id;

          return (
            <div
              key={layout.id}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(layout.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(layout.id, e)}
              className={`
                bg-white rounded-xl shadow-sm border-2 transition-all duration-200
                ${isHovered ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-200'}
              `}
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">{layout.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      板材: {layout.sheetDimensions.width}×{layout.sheetDimensions.height}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold text-white px-2 py-1 rounded ${getUtilizationColor(layout.utilization)}`}>
                      {(layout.utilization * 100).toFixed(0)}%
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{layout.parts.length} 零件</p>
                  </div>
                </div>
              </div>

              {/* Canvas Area */}
              <div className="relative p-4 min-h-[300px] bg-slate-100 rounded-b-xl">
                {/* Grid Background */}
                <div
                  className="absolute inset-4 border border-slate-300 bg-white"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                      linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }}
                >
                  {/* Parts */}
                  {layout.parts.map((part) => (
                    <div
                      key={part.id}
                      draggable
                      onDragStart={(e) => handleDragStart(part, layout.id, e)}
                      className={`
                        absolute cursor-move border-2 transition-all duration-200
                        ${draggedPart?.part.id === part.id
                          ? 'border-indigo-500 shadow-lg opacity-50'
                          : 'border-indigo-300 hover:border-indigo-400 hover:shadow-md'
                        }
                      `}
                      style={{
                        left: part.x,
                        top: part.y,
                        width: Math.min(part.dimensions.width, 100),
                        height: Math.min(part.dimensions.height, 100)
                      }}
                    >
                      <div className="w-full h-full bg-indigo-100 rounded p-2">
                        <div className="text-xs font-medium text-indigo-800 truncate">{part.name}</div>
                        <div className="text-[10px] text-indigo-600">{part.dimensions.width}×{part.dimensions.height}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Drop Zone Hint */}
                {isHovered && (
                  <div className="absolute inset-4 bg-indigo-100/50 border-2 border-dashed border-indigo-400 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className="text-sm font-medium text-indigo-600">拖入零件</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg border border-slate-200 flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>拖拽零件可在不同排版间移动</span>
        </div>
      </div>
    </div>
  );
};

export default MultiLayoutView;
