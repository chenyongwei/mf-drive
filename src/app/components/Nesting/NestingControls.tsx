import React, { useRef, ChangeEvent } from 'react';
import { uploadFile } from '../../services/api';
import { useNestingStore } from '../../store/nestingStore';

interface NestingControlsProps {
  onStartNesting: () => void;
  isRunning: boolean;
  selectedCount: number;
  totalCount: number;
}

export const NestingControls: React.FC<NestingControlsProps> = ({
  onStartNesting,
  isRunning,
  selectedCount,
  totalCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setError } = useNestingStore();

  const handleUploadPrts = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      // 上传所有文件
      const uploadPromises = files.map((file) => uploadFile(file, (percent) => {
        console.log(`Upload progress for ${file.name}: ${percent}%`);
      }));

      await Promise.all(uploadPromises);

      // 上传成功后刷新页面以重新加载零件列表
      window.location.reload();
    } catch (error: any) {
      console.error('[NestingControls] Upload error:', error);
      setError(error.message || 'Upload failed');
    } finally {
      // 重置input以允许重复选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-white text-lg font-semibold">排样算法</h1>
        <span className="text-slate-400 text-sm">
          已选择 {selectedCount} / 总计 {totalCount} 个零件
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* 上传prts按钮 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".prts"
          multiple
          className="hidden"
          onChange={handleUploadPrts}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isRunning}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          上传prts
        </button>

        {/* 开始排样按钮 */}
        <button
          onClick={onStartNesting}
          disabled={isRunning || selectedCount === 0}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              排样中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              开始排样
            </>
          )}
        </button>
      </div>
    </div>
  );
};
