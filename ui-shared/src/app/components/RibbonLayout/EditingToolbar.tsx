import React from 'react';
import { useEdit } from '../../contexts/EditContext';
import { EditTool } from '../../types/editing';

interface ToolbarButton {
  tool: EditTool;
  label: string;
  icon: string;
  shortcut?: string;
  description: string;
}

const buttons: ToolbarButton[] = [
  {
    tool: 'select',
    label: '选择',
    icon: '🖱️',
    shortcut: 'V',
    description: '选择实体或零件',
  },
  {
    tool: 'trim',
    label: '修剪',
    icon: '✂️',
    shortcut: 'T',
    description: '修剪线段 - 先选择边界，再选择要修剪的对象',
  },
  {
    tool: 'extend',
    label: '延长',
    icon: '📏',
    shortcut: 'E',
    description: '延长线段至与另一对象相交',
  },
  {
    tool: 'delete',
    label: '删除',
    icon: '🗑️',
    shortcut: 'Delete',
    description: '删除选中的实体',
  },
  {
    tool: 'recognize',
    label: '自动识别零件',
    icon: '🔍',
    description: '自动识别封闭轮廓并创建零件',
  },
];

const EditingToolbar: React.FC = () => {
  const { editState, setTool, undo, redo, canUndo, canRedo } = useEdit();

  const handleToolClick = (tool: EditTool) => {
    setTool(tool);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Prevent shortcuts when typing in inputs
    if ((e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA') {
      return;
    }

    switch (e.key.toLowerCase()) {
      case 'v':
        setTool('select');
        break;
      case 't':
        setTool('trim');
        break;
      case 'e':
        setTool('extend');
        break;
      case 'delete':
      case 'backspace':
        e.preventDefault();
        // Handle delete (will be implemented)
        break;
      case 'z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        }
        break;
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
      {/* Left: Tool buttons */}
      <div className="flex items-center gap-2">
        {buttons.map((button) => (
          <button
            key={button.tool}
            onClick={() => handleToolClick(button.tool)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              editState.tool === button.tool
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title={`${button.label} (${button.shortcut || ''})\n${button.description}`}
          >
            <span className="mr-1">{button.icon}</span>
            {button.label}
            {button.shortcut && (
              <span className="ml-1 text-xs opacity-60">[{button.shortcut}]</span>
            )}
          </button>
        ))}
      </div>

      {/* Center: Mode indicator */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-600">
          <span className="font-medium">模式:</span>{' '}
          <span className={`px-2 py-1 rounded ${
            editState.mode === 'edit' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {editState.mode === 'edit' ? '编辑' : '查看'}
          </span>
        </div>

        {editState.tool !== 'select' && editState.tool !== 'recognize' && (
          <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded border border-amber-200">
            💡 {buttons.find(b => b.tool === editState.tool)?.description || ''}
          </div>
        )}
      </div>

      {/* Right: Undo/Redo */}
      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            canUndo
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              : 'bg-slate-50 text-slate-400 cursor-not-allowed'
          }`}
          title="撤销 (Ctrl+Z)"
        >
          ↩️ 撤销
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            canRedo
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              : 'bg-slate-50 text-slate-400 cursor-not-allowed'
          }`}
          title="重做 (Ctrl+Shift+Z)"
        >
          ↪️ 重做
        </button>
      </div>
    </div>
  );
};

export default EditingToolbar;
