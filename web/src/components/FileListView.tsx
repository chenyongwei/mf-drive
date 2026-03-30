import { useState } from 'react';
import {
  Download,
  FileText,
  FileBox,
  LayoutGrid,
  MoreHorizontal,
  RefreshCw,
  Search,
  Upload,
} from 'lucide-react';
import type { ArtifactType, DriveArtifact } from '../features/files/api';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';

const ARTIFACT_TYPES: Array<'ALL' | ArtifactType> = ['ALL', 'DRAWING', 'PARTS', 'LAYOUT'];
const TYPE_LABELS: Record<string, string> = {
  ALL: '全部',
  DRAWING: '图纸',
  PARTS: '零件',
  LAYOUT: '排版',
};

function artifactIcon(type: ArtifactType) {
  switch (type) {
    case 'DRAWING': return <FileText className="h-4 w-4 text-blue-500" />;
    case 'PARTS': return <FileBox className="h-4 w-4 text-amber-500" />;
    case 'LAYOUT': return <LayoutGrid className="h-4 w-4 text-emerald-500" />;
    default: return <FileText className="h-4 w-4 text-slate-400" />;
  }
}

function typeBadgeVariant(type: ArtifactType): string {
  switch (type) {
    case 'DRAWING': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
    case 'PARTS': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800';
    case 'LAYOUT': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
    default: return '';
  }
}

function formatDate(value?: string): string {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type FileListViewProps = {
  artifacts: DriveArtifact[];
  selectedArtifactId: string;
  onSelectArtifact: (id: string) => void;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  artifactTypeFilter: 'ALL' | ArtifactType;
  onTypeFilterChange: (type: 'ALL' | ArtifactType) => void;
  onSearch: () => void;
  onRefresh: () => void;
  onDownload: (artifact: DriveArtifact) => void;
  onUploadOpen: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function FileListView({
  artifacts,
  selectedArtifactId,
  onSelectArtifact,
  keyword,
  onKeywordChange,
  artifactTypeFilter,
  onTypeFilterChange,
  onSearch,
  onRefresh,
  onDownload,
  onUploadOpen,
  loading,
  disabled,
}: FileListViewProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="搜索文件..."
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
            className="pl-8 h-7 text-xs"
            disabled={disabled}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2">
              {TYPE_LABELS[artifactTypeFilter] ?? artifactTypeFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ARTIFACT_TYPES.map((type) => (
              <DropdownMenuItem
                key={type}
                onClick={() => onTypeFilterChange(type)}
                className={cn('text-xs', artifactTypeFilter === type && 'font-semibold')}
              >
                {TYPE_LABELS[type]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh} disabled={disabled || loading}>
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>刷新</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button data-testid="upload-open" variant="ghost" size="icon" className="h-7 w-7" onClick={onUploadOpen} disabled={disabled}>
              <Upload className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>上传文件</TooltipContent>
        </Tooltip>
      </div>

      {/* File count bar */}
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1 dark:border-slate-800">
        <span className="text-[11px] text-slate-400">{artifacts.length} 个文件</span>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        {artifacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FileText className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">暂无文件</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="sticky top-0 z-10 bg-slate-50/95 px-3 py-1.5 text-left font-medium text-slate-500 backdrop-blur dark:bg-slate-900/95 dark:text-slate-400">名称</th>
                <th className="sticky top-0 z-10 bg-slate-50/95 px-3 py-1.5 text-left font-medium text-slate-500 backdrop-blur dark:bg-slate-900/95 dark:text-slate-400 w-20">类型</th>
                <th className="sticky top-0 z-10 bg-slate-50/95 px-3 py-1.5 text-left font-medium text-slate-500 backdrop-blur dark:bg-slate-900/95 dark:text-slate-400 w-36">更新时间</th>
                <th className="sticky top-0 z-10 bg-slate-50/95 px-3 py-1.5 text-right font-medium text-slate-500 backdrop-blur dark:bg-slate-900/95 dark:text-slate-400 w-10" />
              </tr>
            </thead>
            <tbody>
              {artifacts.map((artifact) => {
                const isSelected = artifact.artifactId === selectedArtifactId;
                return (
                  <tr
                    key={artifact.artifactId}
                    data-testid={`artifact-row-${artifact.artifactId}`}
                    className={cn(
                      'group cursor-pointer border-b border-slate-100 transition-colors dark:border-slate-800',
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    )}
                    onClick={() => onSelectArtifact(artifact.artifactId)}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {artifactIcon(artifact.artifactType)}
                        <div className="min-w-0">
                          <p className={cn('truncate font-medium', isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200')}>
                            {artifact.displayName}
                          </p>
                          <p className="truncate text-[10px] text-slate-400">{artifact.artifactId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className={cn('text-[10px] px-1 py-0', typeBadgeVariant(artifact.artifactType))}>
                        {TYPE_LABELS[artifact.artifactType] ?? artifact.artifactType}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                      {formatDate(artifact.updatedAt)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <Button
                        data-testid="artifact-download-submit"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); onDownload(artifact); }}
                        disabled={disabled}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </ScrollArea>
    </div>
  );
}
