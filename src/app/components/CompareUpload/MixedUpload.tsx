import React, { useCallback, useState } from 'react';
import { UploadDropCard, UploadFeaturesCard } from '../common/UploadCards';
import { useUploadDropzone } from '../common/useUploadDropzone';

interface MixedUploadProps {
  onFilesUploaded: (filesData: any[]) => void;
}

const MixedUpload: React.FC<MixedUploadProps> = ({ onFilesUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isSupportedFile = useCallback((file: File) => {
    const ext = file.name.toLowerCase();
    return ext.endsWith('.prts') || ext.endsWith('.dxf');
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      alert('请选择 .prts 或 .dxf 格式的文件');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const results: any[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.toLowerCase();

      try {
        const formData = new FormData();
        formData.append('file', file);

        // 根据文件扩展名选择API
        const apiUrl = ext.endsWith('.dxf') ? '/api/drawing/files/upload' : '/api/drawing/files/prts-upload';

        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '上传失败');
        }

        const fileData = await response.json();

        // 统一返回格式，添加fileType和baseName字段
        const baseName = file.name.replace(/\.(prts|dxf)$/i, '');

        // Handle different API response formats
        let result: any;

        if (ext.endsWith('.dxf')) {
          // DXF API returns: { id, name, ... }
          const dxfId = fileData.id || fileData._id;
          if (!dxfId) {
            throw new Error(`DXF response missing ID field: ${JSON.stringify(fileData)}`);
          }

          result = {
            id: dxfId,
            partId: dxfId, // Use same ID for consistency
            originalFilename: fileData.name || file.name,
            name: fileData.name || file.name,
            fileType: 'DXF',
            baseName: baseName.toLowerCase(),
          };

          // Note: DXF files may be parsed asynchronously
          // We'll load them in CompareViewerWebCAD which will handle the data retrieval
        } else {
          // PRTS API returns: { partId, originalFilename, ... }
          const prtsId = fileData.partId || fileData.id || fileData._id;
          if (!prtsId) {
            throw new Error(`PRTS response missing ID field: ${JSON.stringify(fileData)}`);
          }
          result = {
            id: prtsId,
            partId: prtsId,
            originalFilename: fileData.originalFilename || file.name,
            name: fileData.originalFilename || file.name,
            fileType: 'PRTS',
            baseName: baseName.toLowerCase(),
          };
        }

        results.push(result);
      } catch (error: any) {
        console.error(`Upload error for ${file.name}:`, error);
        alert(`上传 ${file.name} 失败: ${error.message}`);
      }

      setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
    }

    if (results.length > 0) {
      onFilesUploaded(results);
    }

    setUploading(false);
  }, [onFilesUploaded]);

  const dropzone = useUploadDropzone({
    acceptFile: isSupportedFile,
    onAcceptedFiles: handleFiles,
  });

  return (
    <div className="space-y-4">
      <UploadDropCard
        inputId="mixed-upload"
        accept=".prts,.dxf"
        uploading={uploading}
        uploadProgress={uploadProgress}
        dragActive={dropzone.dragActive}
        idleLabel="点击或拖拽 .prts 或 .dxf 文件"
        onChange={dropzone.handleChange}
        onDragEnter={dropzone.handleDrag}
        onDragLeave={dropzone.handleDrag}
        onDragOver={dropzone.handleDrag}
        onDrop={dropzone.handleDrop}
      />

      <UploadFeaturesCard
        items={[
          '同时上传 .dxf 和 .prts 文件',
          '按文件名自动匹配对比',
          'DXF 线框显示，PRTS 填充显示',
          '自动平铺并排显示',
        ]}
      />
    </div>
  );
};

export default MixedUpload;
