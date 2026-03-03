import type { Part as SharedPart } from '@dxf-fix/shared';
import { uploadFile, getParts } from '../../services/api';
import type { ImportedFile } from './PreprocessPage.types';

type ImportFilesOptions = {
  files: File[];
  setImportedFiles: React.Dispatch<React.SetStateAction<ImportedFile[]>>;
  triggerInspection: (fileId: string) => Promise<void>;
};

export async function importFilesWithPolling(options: ImportFilesOptions): Promise<void> {
  const { files, setImportedFiles, triggerInspection } = options;
  const newFiles: ImportedFile[] = [];

  for (const file of files) {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const tempFile: ImportedFile = {
      id: tempId,
      name: file.name,
      thumbnailUrl: undefined,
      parts: [],
      status: 'uploading',
      progress: 0,
    };
    newFiles.push(tempFile);
  }

  setImportedFiles((prev) => [...prev, ...newFiles]);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const tempFile = newFiles[i];

    try {
      const fileInfo = await uploadFile(file, (progress) => {
        setImportedFiles((prev) => prev.map((f) => (f.id === tempFile.id ? { ...f, progress, status: 'uploading' as const } : f)));
      });

      setImportedFiles((prev) => prev.map((f) =>
        f.id === tempFile.id
          ? { ...f, id: fileInfo.id, status: 'parsing' as const, thumbnailUrl: `/api/drawing/files/${fileInfo.id}/thumbnail` }
          : f,
      ));

      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/drawing/files/${fileInfo.id}/status`);
          if (!statusResponse.ok) {
            return;
          }

          const statusData = await statusResponse.json();
          if (statusData.status !== 'ready') {
            return;
          }

          const partsResponse = await getParts(fileInfo.id);
          if (!partsResponse.parts || partsResponse.parts.length === 0) {
            return;
          }

          const parts = partsResponse.parts.map((p: SharedPart) => ({
            id: p.id,
            name: p.name,
            fileId: p.fileId,
            fileName: file.name,
            thumbnailUrl: `/api/drawing/files/${p.fileId}/parts/${p.id}/thumbnail`,
            dimensions: {
              width: p.bbox.maxX - p.bbox.minX,
              height: p.bbox.maxY - p.bbox.minY,
            },
            bbox: p.bbox,
          }));

          const fileBbox = partsResponse.parts.reduce(
            (acc: any, p: any) => ({
              minX: Math.min(acc.minX, p.bbox.minX),
              minY: Math.min(acc.minY, p.bbox.minY),
              maxX: Math.max(acc.maxX, p.bbox.maxX),
              maxY: Math.max(acc.maxY, p.bbox.maxY),
            }),
            { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
          );

          setImportedFiles((prev) => prev.map((f) => (f.id === fileInfo.id ? { ...f, status: 'ready' as const, parts, bbox: fileBbox } : f)));

          void triggerInspection(fileInfo.id);
          clearInterval(pollInterval);
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollInterval);
        setImportedFiles((prev) => prev.map((f) =>
          f.id === fileInfo.id && f.status === 'parsing'
            ? { ...f, status: 'error' as const }
            : f,
        ));
      }, 60000);
    } catch (error) {
      console.error('Failed to import file:', file.name, error);
      setImportedFiles((prev) => prev.map((f) => (f.id === tempFile.id ? { ...f, status: 'error' as const } : f)));
    }
  }
}
