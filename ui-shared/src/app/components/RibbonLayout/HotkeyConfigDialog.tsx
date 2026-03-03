import React, { useState, useCallback } from 'react';

interface HotkeyConfig {
  action: string;
  hotkey: string;
  defaultHotkey: string;
  category: string;
}

const defaultHotkeys: HotkeyConfig[] = [
  // 零件修改
  { action: 'rotate_left', hotkey: '←', defaultHotkey: 'ArrowLeft', category: '零件修改' },
  { action: 'rotate_right', hotkey: '→', defaultHotkey: 'ArrowRight', category: '零件修改' },
  { action: 'mirror_horizontal', hotkey: 'H', defaultHotkey: 'h', category: '零件修改' },
  { action: 'mirror_vertical', hotkey: 'V', defaultHotkey: 'v', category: '零件修改' },
  { action: 'zoom_in', hotkey: '+', defaultHotkey: '+', category: '零件修改' },
  { action: 'zoom_out', hotkey: '-', defaultHotkey: '-', category: '零件修改' },
  { action: 'fit_to_view', hotkey: 'F', defaultHotkey: 'f', category: '零件修改' },
  { action: 'edit_properties', hotkey: 'Enter', defaultHotkey: 'Enter', category: '零件修改' },
  { action: 'undo', hotkey: 'Ctrl+Z', defaultHotkey: 'Ctrl+z', category: '零件修改' },
  { action: 'redo', hotkey: 'Ctrl+Y', defaultHotkey: 'Ctrl+y', category: '零件修改' },

  // 排样
  { action: 'auto_nesting', hotkey: 'Space', defaultHotkey: ' ', category: '排样' },
  { action: 'pause_nesting', hotkey: 'P', defaultHotkey: 'p', category: '排样' },
  { action: 'stop_nesting', hotkey: 'S', defaultHotkey: 's', category: '排样' },
  { action: 'nesting_settings', hotkey: 'Alt+N', defaultHotkey: 'Alt+n', category: '排样' },
  { action: 'manual_nesting', hotkey: 'M', defaultHotkey: 'm', category: '排样' },

  // 导出
  { action: 'export_dxf', hotkey: 'D', defaultHotkey: 'd', category: '导出' },
  { action: 'export_excel', hotkey: 'X', defaultHotkey: 'x', category: '导出' },
  { action: 'export_pdf', hotkey: 'F', defaultHotkey: 'f', category: '导出' },
  { action: 'export_all', hotkey: 'A', defaultHotkey: 'a', category: '导出' },
  { action: 'export_settings', hotkey: 'Alt+E', defaultHotkey: 'Alt+e', category: '导出' },
];

const categories = ['零件修改', '排样', '导出'];
const actionNames: Record<string, string> = {
  rotate_left: '左转 90°',
  rotate_right: '右转 90°',
  mirror_horizontal: '水平镜像',
  mirror_vertical: '垂直镜像',
  zoom_in: '放大',
  zoom_out: '缩小',
  fit_to_view: '适应窗口',
  edit_properties: '编辑属性',
  undo: '撤销',
  redo: '重做',
  auto_nesting: '自动排样',
  pause_nesting: '暂停排样',
  stop_nesting: '停止排样',
  nesting_settings: '排样设置',
  manual_nesting: '手动排样',
  export_dxf: '导出 DXF',
  export_excel: '导出 Excel',
  export_pdf: '导出 PDF',
  export_all: '全部导出',
  export_settings: '导出设置',
};

interface HotkeyConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (hotkeys: Record<string, string>) => void;
  currentHotkeys?: Record<string, string>;
}

const HotkeyConfigDialog: React.FC<HotkeyConfigDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  currentHotkeys = {}
}) => {
  const [hotkeys, setHotkeys] = useState<Record<string, string>>(currentHotkeys);
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  const getDisplayHotkey = (action: string) => {
    return hotkeys[action] || defaultHotkeys.find(h => h.action === action)?.hotkey || '';
  };

  const handleRecordHotkey = useCallback((action: string) => {
    setEditingAction(action);
    setConflict(null);

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let key = '';
      if (e.ctrlKey || e.metaKey) key += 'Ctrl+';
      if (e.altKey) key += 'Alt+';
      if (e.shiftKey) key += 'Shift+';

      const keyValue = e.key;
      if (keyValue === ' ') {
        key += 'Space';
      } else if (keyValue.length === 1) {
        key += keyValue.toUpperCase();
      } else {
        key += keyValue;
      }

      // Check for conflicts
      const existingAction = Object.entries(hotkeys).find(([_, h]) => h === key && _ !== action);
      if (existingAction) {
        setConflict(`快捷键 "${key}" 已被 ${actionNames[existingAction[0]]} 使用`);
        return;
      }

      setHotkeys(prev => ({ ...prev, [action]: key }));
      setEditingAction(null);
      document.removeEventListener('keydown', handleKeyDown);
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingAction(null);
        setConflict(null);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keydown', handleEsc);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleEsc);
  }, [hotkeys]);

  const handleResetToDefault = () => {
    const defaultHotkeyMap: Record<string, string> = {};
    defaultHotkeys.forEach(h => {
      defaultHotkeyMap[h.action] = h.defaultHotkey;
    });
    setHotkeys(defaultHotkeyMap);
  };

  const handleSave = () => {
    onSave(hotkeys);
    onClose();
  };

  const filteredHotkeys = (filterCategory: string) => {
    return defaultHotkeys.filter(h => {
      if (filterCategory === '全部') return true;
      return h.category === filterCategory;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-indigo-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6m-6 4h6m-6 4h6" />
              </svg>
              快捷键配置
            </h2>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Category Filter */}
          <div className="mb-4">
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>全部</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Hotkey Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600 border-b border-slate-200">功能</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600 border-b border-slate-200">当前快捷键</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600 border-b border-slate-200 w-32">操作</th>
                </tr>
              </thead>
              <tbody>
                {defaultHotkeys.map((hotkey) => (
                  <tr key={hotkey.action} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">
                      {actionNames[hotkey.action]}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100">
                      {editingAction === hotkey.action ? (
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded text-sm font-mono animate-pulse">
                            按下快捷键...
                          </div>
                          <span className="text-xs text-slate-500">(ESC 取消)</span>
                        </div>
                      ) : (
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-sm font-mono font-semibold">
                          {getDisplayHotkey(hotkey.action)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100">
                      <button
                        onClick={() => handleRecordHotkey(hotkey.action)}
                        disabled={editingAction !== null}
                        className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {editingAction === hotkey.action ? '录制中...' : '修改'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Conflict Warning */}
          {conflict && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm text-red-700">{conflict}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleResetToDefault}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            恢复默认
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              确定 (Space)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotkeyConfigDialog;
