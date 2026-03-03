import React, { useCallback, useState } from 'react';
import { UploadDropCard, UploadFeaturesCard } from '../common/UploadCards';
import { useUploadDropzone } from '../common/useUploadDropzone';

interface PrtsUploadProps {
  onPartsUploaded: (partsData: any[]) => void;
}

const PrtsUpload: React.FC<PrtsUploadProps> = ({ onPartsUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isPrtsFile = useCallback((file: File) => {
    return file.name.toLowerCase().endsWith('.prts');
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      alert('请选择 .prts 格式的文件');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const results: any[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/drawing/files/prts-upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '上传失败');
        }

        const partData = await response.json();
        results.push(partData);
      } catch (error: any) {
        console.error(`Upload error for ${file.name}:`, error);
        alert(`上传 ${file.name} 失败: ${error.message}`);
      }

      setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
    }

    if (results.length > 0) {
      onPartsUploaded(results);
    }

    setUploading(false);
  }, [onPartsUploaded]);

  const dropzone = useUploadDropzone({
    acceptFile: isPrtsFile,
    onAcceptedFiles: handleFiles,
  });

  return (
    <div className="space-y-4">
      <UploadDropCard
        inputId="prts-upload"
        accept=".prts"
        uploading={uploading}
        uploadProgress={uploadProgress}
        dragActive={dropzone.dragActive}
        idleLabel="点击或拖拽 .prts 文件"
        onChange={dropzone.handleChange}
        onDragEnter={dropzone.handleDrag}
        onDragLeave={dropzone.handleDrag}
        onDragOver={dropzone.handleDrag}
        onDrop={dropzone.handleDrop}
      />

      <UploadFeaturesCard
        items={[
          '解析 .prts XML 文件',
          '转换为 JSON 格式',
          '保存到 MinIO 存储',
          '在 CADView 中预览',
        ]}
      />
    </div>
  );
};

export default PrtsUpload;
