import { useState } from 'react';
import { Upload } from 'lucide-react';
import type { ArtifactType } from '../features/files/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { cn } from '../lib/utils';

const ARTIFACT_TYPES: ArtifactType[] = ['DRAWING', 'PARTS', 'LAYOUT'];
const TYPE_LABELS: Record<string, string> = {
  DRAWING: '图纸',
  PARTS: '零件',
  LAYOUT: '排版',
};

type UploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, type: ArtifactType, projectId?: string) => Promise<void>;
  disabled?: boolean;
  uploading?: boolean;
};

export function UploadDialog({ open, onOpenChange, onUpload, disabled, uploading }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<ArtifactType>('DRAWING');
  const [projectId, setProjectId] = useState('');

  async function handleSubmit() {
    if (!file) return;
    await onUpload(file, type, projectId.trim() || undefined);
    setFile(null);
    setProjectId('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Upload className="h-4 w-4" />
            上传文件
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">选择文件</label>
            <Input
              data-testid="upload-file-input"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-xs file:text-xs file:mr-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">文件类型</label>
            <div className="flex gap-1.5">
              {ARTIFACT_TYPES.map((t) => (
                <Button
                  key={t}
                  variant={type === t ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 text-xs h-7"
                  onClick={() => setType(t)}
                >
                  {TYPE_LABELS[t]}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">项目 ID（可选）</label>
            <Input
              placeholder="输入 projectId"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="text-xs"
            />
          </div>

          {file && (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{file.name}</p>
              <p className="text-[10px] text-slate-400">
                {file.type || 'unknown'} &middot; {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button data-testid="upload-submit" size="sm" onClick={() => void handleSubmit()} disabled={disabled || uploading || !file}>
            {uploading ? '上传中...' : '上传'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
