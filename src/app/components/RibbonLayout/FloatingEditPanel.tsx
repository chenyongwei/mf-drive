import React, { useState } from 'react';
import { useEdit } from '../../contexts/EditContext';
import { EditTool } from '../../types/editing';

interface ToolButton {
  tool: EditTool;
  icon: string;
  label: string;
  shortcut: string;
}

const tools: ToolButton[] = [
  { tool: 'select', icon: '🖱️', label: '选择', shortcut: 'V' },
  { tool: 'trim', icon: '✂️', label: '修剪', shortcut: 'T' },
  { tool: 'extend', icon: '📏', label: '延长', shortcut: 'E' },
  { tool: 'delete', icon: '🗑️', label: '删除', shortcut: 'Del' },
];

const FloatingEditPanel: React.FC = () => {
  const { editState, setTool, undo, redo, canUndo, canRedo } = useEdit();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleToolClick = (tool: EditTool) => {
    setTool(tool);
  };

  return (
    <div
      className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Main panel */}
      <div className="bg-white rounded shadow-lg border border-slate-200 overflow-hidden" style={{ width: '48px' }}>
        {isExpanded ? (
          <div className="py-1 space-y-0.5">
            {/* Tool buttons */}
            {tools.map((tool) => (
              <button
                key={tool.tool}
                onClick={() => handleToolClick(tool.tool)}
                className={`w-full px-1 py-2 transition-all flex flex-col items-center justify-center ${
                  editState.tool === tool.tool
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
                title={`${tool.label} (${tool.shortcut})`}
                style={{ height: '44px' }}
              >
                <span className="text-lg leading-none mb-0.5">{tool.icon}</span>
                <span className="text-[10px] leading-none scale-90">{tool.label}</span>
              </button>
            ))}

            {/* Divider */}
            <div className="h-px bg-slate-200 my-1 mx-1"></div>

            {/* Undo/Redo */}
            <div className="flex flex-col gap-0.5 px-1">
              <button
                onClick={undo}
                disabled={!canUndo}
                className={`w-full px-1 py-1.5 rounded transition-all flex flex-col items-center justify-center ${
                  canUndo
                    ? 'bg-white text-slate-700 hover:bg-slate-50'
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                }`}
                title="撤销 (Ctrl+Z)"
                style={{ height: '36px' }}
              >
                <span className="text-sm leading-none">↩️</span>
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className={`w-full px-1 py-1.5 rounded transition-all flex flex-col items-center justify-center ${
                  canRedo
                    ? 'bg-white text-slate-700 hover:bg-slate-50'
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                }`}
                title="重做 (Ctrl+Shift+Z)"
                style={{ height: '36px' }}
              >
                <span className="text-sm leading-none">↪️</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full px-1 py-2 text-slate-600 hover:bg-slate-50 flex flex-col items-center justify-center"
              title="展开编辑工具"
              style={{ height: '44px' }}
            >
              <span className="text-lg">🛠️</span>
            </button>
          </div>
        )}
      </div>

      {/* Toggle button when expanded */}
      {isExpanded && (
        <button
          onClick={() => setIsExpanded(false)}
          className="absolute -right-3 top-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 shadow-sm text-xs"
          title="收起"
        >
          ◀
        </button>
      )}
    </div>
  );
};

export default FloatingEditPanel;
