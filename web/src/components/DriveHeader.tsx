import {
  KeyRound,
  RefreshCw,
  Shield,
  Trash2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';

type DriveHeaderProps = {
  accountAuthorized: boolean;
  tokenActive: boolean;
  scopes: string[];
  expiresAt: string | null;
  onAuthorize: () => void;
  onRefresh: () => void;
  onClearToken: () => void;
  authorizing?: boolean;
  loading?: boolean;
  error: string | null;
  status: string | null;
  sessionError: string | null;
  securityCenterUrl: string;
  showSecurityEntry: boolean;
};

export function DriveHeader({
  accountAuthorized,
  tokenActive,
  scopes,
  expiresAt,
  onAuthorize,
  onRefresh,
  onClearToken,
  authorizing,
  loading,
  error,
  status,
  sessionError,
  securityCenterUrl,
  showSecurityEntry,
}: DriveHeaderProps) {
  return (
    <div className="space-y-2">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100">图纸云存储</h1>
          <div className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', tokenActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600')} />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {tokenActive ? '已连接' : accountAuthorized ? 'Token 不可用' : '未授权'}
            </span>
          </div>
          {expiresAt && (
            <span className="text-[10px] text-slate-400">
              过期: {expiresAt}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {scopes.length > 0 && (
            <div className="mr-2 hidden items-center gap-1 lg:flex">
              {scopes.slice(0, 3).map((scope) => (
                <Badge key={scope} variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                  {scope}
                </Badge>
              ))}
              {scopes.length > 3 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  +{scopes.length - 3}
                </Badge>
              )}
            </div>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAuthorize} disabled={authorizing}>
                <KeyRound className={cn('h-3.5 w-3.5', authorizing && 'animate-pulse')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{authorizing ? '授权中...' : 'OAuth 授权'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>刷新数据</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClearToken}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>清除 Token</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Banners */}
      {(sessionError || error || status || showSecurityEntry) && (
        <div className="space-y-1 px-4">
          {sessionError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {sessionError}
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}
          {status && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {status}
            </div>
          )}
          {showSecurityEntry && (
            <div className="flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span>
                需要新增授权时请前往{' '}
                <a href={securityCenterUrl} className="font-semibold underline">
                  安全中心
                </a>{' '}
                配置。
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
