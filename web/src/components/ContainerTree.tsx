import { useState } from 'react';
import {
  ChevronRight,
  Database,
  FolderOpen,
  HardDrive,
  Plus,
} from 'lucide-react';
import type { ContainerMode, DriveContainer } from '../features/files/api';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[idx]}`;
}

type ContainerTreeProps = {
  containers: DriveContainer[];
  selectedContainerId: string;
  onSelectContainer: (containerId: string) => void;
  onCreateContainer: (name: string, mode: ContainerMode) => Promise<void>;
  disabled?: boolean;
  creating?: boolean;
};

export function ContainerTree({
  containers,
  selectedContainerId,
  onSelectContainer,
  onCreateContainer,
  disabled,
  creating,
}: ContainerTreeProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMode, setNewMode] = useState<ContainerMode>('APP_DATA');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const grouped = {
    APP_DATA: containers.filter((c) => c.mode === 'APP_DATA'),
    MY_DRIVE: containers.filter((c) => c.mode === 'MY_DRIVE'),
  };

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    await onCreateContainer(newName.trim(), newMode);
    setNewName('');
    setDialogOpen(false);
  }

  function renderGroup(mode: ContainerMode, items: DriveContainer[]) {
    const expanded = expandedIds.has(mode);
    const icon = mode === 'APP_DATA' ? <Database className="h-3.5 w-3.5 shrink-0" /> : <HardDrive className="h-3.5 w-3.5 shrink-0" />;

    return (
      <div key={mode}>
        <button
          type="button"
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          onClick={() => toggleExpand(mode)}
        >
          <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
          {icon}
          <span className="flex-1 text-left">{mode === 'APP_DATA' ? '应用数据' : '我的文件'}</span>
          <Badge variant="secondary" className="text-[10px] px-1 py-0">{items.length}</Badge>
        </button>

        {expanded && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2 dark:border-slate-700">
            {items.length === 0 ? (
              <p className="px-2 py-1 text-xs text-slate-400">暂无容器</p>
            ) : (
              items.map((container) => {
                const isSelected = container.containerId === selectedContainerId;
                const usagePct = container.quotaBytes > 0
                  ? Math.round((container.usedBytes / container.quotaBytes) * 100)
                  : 0;

                return (
                  <Tooltip key={container.containerId}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                          isSelected
                            ? 'bg-sky-50 text-sky-700 font-medium dark:bg-sky-950 dark:text-sky-300'
                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800',
                          disabled && 'pointer-events-none opacity-50',
                        )}
                        onClick={() => onSelectContainer(container.containerId)}
                        disabled={disabled}
                      >
                        <FolderOpen className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'text-sky-500' : 'text-slate-400')} />
                        <span className="flex-1 truncate">{container.name}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      <p className="font-medium">{container.name}</p>
                      <p className="text-slate-400">
                        {formatBytes(container.usedBytes)} / {formatBytes(container.quotaBytes)} ({usagePct}%)
                      </p>
                      <p className="text-slate-400">{container.containerId}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-700">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          容器
        </h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setDialogOpen(true)}
              disabled={disabled}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>新建容器</TooltipContent>
        </Tooltip>
      </div>

      <ScrollArea className="flex-1 px-1 py-1">
        <div className="space-y-1">
          {renderGroup('APP_DATA', grouped.APP_DATA)}
          {renderGroup('MY_DRIVE', grouped.MY_DRIVE)}
        </div>
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>新建容器</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Input
              placeholder="容器名称"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate(); }}
            />
            <div className="flex gap-2">
              {(['APP_DATA', 'MY_DRIVE'] as ContainerMode[]).map((mode) => (
                <Button
                  key={mode}
                  variant={newMode === mode ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setNewMode(mode)}
                >
                  {mode === 'APP_DATA' ? '应用数据' : '我的文件'}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => void handleCreate()} disabled={creating || !newName.trim()}>
              {creating ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
