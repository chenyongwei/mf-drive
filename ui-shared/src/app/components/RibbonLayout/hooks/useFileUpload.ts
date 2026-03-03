import { useState, useCallback } from 'react';
import { uploadFile } from '../../../services/api';

interface UseFileUploadResult {
  uploadFiles: (files: FileList) => Promise<void>;
  isUploading: boolean;
  uploadProgress: Map<string, number>;
}

export function useFileUpload(onUploadComplete?: (files: any[]) => void): UseFileUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());

  const uploadFiles = useCallback(async (files: FileList) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(new Map());

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await uploadFile(formData);
        return response.data;
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Clear progress after all uploads complete
      setUploadProgress(new Map());
      onUploadComplete?.(uploadedFiles);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress(new Map());
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete]);

  return {
    uploadFiles,
    isUploading,
    uploadProgress,
  };
}
