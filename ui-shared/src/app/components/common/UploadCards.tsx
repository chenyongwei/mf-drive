import type { ChangeEventHandler, DragEventHandler } from "react";

interface UploadDropCardProps {
  inputId: string;
  accept: string;
  uploading: boolean;
  uploadProgress: number;
  dragActive: boolean;
  idleLabel: string;
  uploadingLabel?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onDragEnter: DragEventHandler<HTMLDivElement>;
  onDragLeave: DragEventHandler<HTMLDivElement>;
  onDragOver: DragEventHandler<HTMLDivElement>;
  onDrop: DragEventHandler<HTMLDivElement>;
}

export function UploadDropCard({
  inputId,
  accept,
  uploading,
  uploadProgress,
  dragActive,
  idleLabel,
  uploadingLabel = "上传中...",
  onChange,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: UploadDropCardProps) {
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        dragActive
          ? "border-indigo-500 bg-indigo-500/10"
          : uploading
            ? "border-slate-600 bg-slate-700/50"
            : "border-slate-600 hover:border-slate-500"
      }`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <input
        type="file"
        id={inputId}
        className="hidden"
        accept={accept}
        multiple
        onChange={onChange}
        disabled={uploading}
      />
      <label htmlFor={inputId} className="cursor-pointer block">
        <svg
          className={`mx-auto h-12 w-12 mb-3 ${uploading ? "text-slate-500" : "text-slate-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className={`text-sm ${uploading ? "text-slate-400" : "text-slate-300"}`}>
          {uploading ? uploadingLabel : idleLabel}
        </p>
      </label>

      {uploading && (
        <div className="mt-4">
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">{uploadProgress}%</p>
        </div>
      )}
    </div>
  );
}

interface UploadFeaturesCardProps {
  title?: string;
  items: string[];
}

export function UploadFeaturesCard({ title = "支持的功能", items }: UploadFeaturesCardProps) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-4">
      <h3 className="text-white text-sm font-medium mb-2">{title}</h3>
      <ul className="text-xs text-slate-400 space-y-1">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
