import React, { useState, useCallback } from 'react';
import { useAppStore } from '../store';
import { uploadFile, getFileStatus, getParts } from '../services/api';
import type { Part } from '@dxf-fix/shared';

interface FileUploadProps {
  buttonMode?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ buttonMode = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const { addFile, updateFile } = useAppStore();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(Array.from(e.target.files));
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    // Validate file types
    const dxfFiles = files.filter(file => file.name.toLowerCase().endsWith('.dxf'));
    if (dxfFiles.length === 0) {
      alert('请上传DXF格式的文件');
      return;
    }

    if (dxfFiles.length !== files.length) {
      alert(`只支持DXF文件，已跳过 ${files.length - dxfFiles.length} 个非DXF文件`);
    }

    setUploading(true);
    const progress: Record<string, number> = {};

    try {
      // Upload files sequentially (can be parallelized if needed)
      for (const file of dxfFiles) {
        progress[file.name] = 0;
        setUploadProgress({ ...progress });

        const fileInfo = await uploadFile(file, (percent) => {
          progress[file.name] = percent;
          setUploadProgress({ ...progress });
        });

        addFile(fileInfo);
        progress[file.name] = 100;
        setUploadProgress({ ...progress });

        // Poll for completion
        pollFileStatus(fileInfo.id);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('文件上传失败');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const pollFileStatus = async (fileId: string) => {
    const { updateFile } = useAppStore.getState();


    const interval = setInterval(async () => {
      try {
        const status = await getFileStatus(fileId);
        updateFile(fileId, status);

        if (status.status === 'ready' || status.status === 'error') {

          // Load parts when file is ready
          if (status.status === 'ready') {
            try {
              const partsData = await getParts(fileId);
              updateFile(fileId, {
                parts: partsData.parts,
                partCount: partsData.parts.length,
                expanded: true, // Auto-expand the file
              });
            } catch (error) {
              console.error('Failed to load parts:', error);
            }
          }

          clearInterval(interval);
        }
      } catch (error: any) {
        console.error('Polling error:', error);
        console.error('Error response:', error.response?.data);
        if (error.response?.status === 404) {
          console.error('File not found:', fileId);
          updateFile(fileId, {
            status: 'error',
            errorMessage: '文件未找到',
          });
        }
        clearInterval(interval);
      }
    }, 1000);
  };

  if (buttonMode) {
    return (
      <div className="relative">
        <input
          type="file"
          id="file-upload-header"
          className="hidden"
          accept=".dxf"
          multiple
          onChange={handleChange}
          disabled={uploading}
        />
        <label
          htmlFor="file-upload-header"
          className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${
            uploading
              ? 'bg-indigo-100 text-indigo-700 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin" />
              上传中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              上传DXF
            </>
          )}
        </label>
        {Object.keys(uploadProgress).length > 0 && (
          <div className="absolute top-full mt-2 right-0 bg-slate-800 text-white text-xs p-2 rounded-lg shadow-lg min-w-[200px]">
            {Object.entries(uploadProgress).map(([fileName, percent]) => (
              <div key={fileName} className="flex items-center gap-2 mb-1 last:mb-0">
                <span className="truncate max-w-[100px]">{fileName}</span>
                <span>{percent}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
        dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept=".dxf"
        multiple
        onChange={handleChange}
        disabled={uploading}
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <svg className="mx-auto h-10 w-10 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm text-slate-600">
          {uploading ? '上传中...' : '点击或拖拽DXF文件（支持多选）'}
        </p>
      </label>
    </div>
  );
};

export default FileUpload;
