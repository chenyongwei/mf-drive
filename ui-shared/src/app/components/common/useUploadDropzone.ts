import { useCallback, useState, type ChangeEvent, type DragEvent } from "react";

interface UseUploadDropzoneOptions {
  acceptFile: (file: File) => boolean;
  onAcceptedFiles: (files: File[]) => Promise<void>;
}

function toAcceptedFiles(fileList: FileList | null, acceptFile: (file: File) => boolean): File[] {
  if (!fileList || fileList.length === 0) {
    return [];
  }
  return Array.from(fileList).filter(acceptFile);
}

export function useUploadDropzone({ acceptFile, onAcceptedFiles }: UseUploadDropzoneOptions) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);

      const accepted = toAcceptedFiles(event.dataTransfer.files, acceptFile);
      await onAcceptedFiles(accepted);
    },
    [acceptFile, onAcceptedFiles],
  );

  const handleChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();
      const accepted = toAcceptedFiles(event.target.files, acceptFile);
      await onAcceptedFiles(accepted);
    },
    [acceptFile, onAcceptedFiles],
  );

  return {
    dragActive,
    handleDrag,
    handleDrop,
    handleChange,
  };
}
