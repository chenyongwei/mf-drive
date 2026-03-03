import type { ReactNode } from 'react';

type ToolbarAction = {
  key: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger' | 'primary';
};

type DataTableToolbarProps = {
  selectedCount: number;
  title?: string;
  actions: ToolbarAction[];
  rightSlot?: ReactNode;
};

function buttonClass(tone: ToolbarAction['tone']): string {
  if (tone === 'danger') {
    return 'border-red-300 text-red-700 hover:bg-red-50';
  }
  if (tone === 'primary') {
    return 'border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100';
  }
  return 'border-slate-300 text-slate-700 hover:bg-slate-50';
}

export function DataTableToolbar({ selectedCount, title, actions, rightSlot }: DataTableToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-3 text-sm text-slate-700">
        <strong>{title ?? '批量工具栏'}</strong>
        <span className="rounded bg-white px-2 py-0.5 text-xs text-slate-600">已选 {selectedCount}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={`rounded border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonClass(action.tone)}`}
          >
            {action.label}
          </button>
        ))}
        {rightSlot}
      </div>
    </div>
  );
}

export type { ToolbarAction };
