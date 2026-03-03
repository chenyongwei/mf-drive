import { useEffect, useState, useCallback } from 'react';
import { getTiles } from '../../../../services/api';

interface FileEntities {
  fileId: string;
  entities: any[];
  loaded: boolean;
  loading: boolean;
}

interface ImportedFile {
  id: string;
  name: string;
  status: 'uploading' | 'parsing' | 'ready' | 'error';
  bbox?: { minX: number; minY: number; maxX: number; maxY: number };
}

/**
 * Custom hook for loading and managing file entities
 */
export const useFileEntities = (files: ImportedFile[], selectedFileIds: Set<string>) => {
  const [fileEntities, setFileEntities] = useState<Map<string, FileEntities>>(new Map());

  useEffect(() => {
    const loadFileEntities = async () => {
      const selectedFiles = files.filter(
        (f) => selectedFileIds.has(f.id) && f.status === 'ready' && f.bbox
      );

      for (const file of selectedFiles) {
        // Skip if already loaded
        if (fileEntities.get(file.id)?.loaded) continue;

        try {
          // Set loading state
          setFileEntities((prev) => {
            const next = new Map(prev);
            next.set(file.id, { fileId: file.id, entities: [], loaded: false, loading: true });
            return next;
          });

          // Load tiles with large viewport to get all entities (LOD level 0)
          const zoomLevel = 0;
          const viewport = {
            xMin: -1e9,
            yMin: -1e9,
            xMax: 1e9,
            yMax: 1e9,
          };

          const data = await getTiles(file.id, viewport, zoomLevel);

          const entities = data.tiles?.[0]?.entities || [];


          // Update state with loaded entities
          setFileEntities((prev) => {
            const next = new Map(prev);
            next.set(file.id, { fileId: file.id, entities, loaded: true, loading: false });
            return next;
          });

        } catch (error) {
          console.error(`Failed to load entities for file ${file.name}:`, error);
          setFileEntities((prev) => {
            const next = new Map(prev);
            next.set(file.id, { fileId: file.id, entities: [], loaded: false, loading: false });
            return next;
          });
        }
      }
    };

    loadFileEntities();
  }, [selectedFileIds, files]);

  const updateEntities = useCallback(
    (updatedEntities: any[], deletedEntityIds: string[]) => {

      setFileEntities((prev) => {
        const newMap = new Map(prev);

        // Process updated entities
        updatedEntities.forEach((updatedEntity) => {
          const fileId = (updatedEntity as any).fileId;
          if (fileId && newMap.has(fileId)) {
            const fileEnts = newMap.get(fileId)!;
            const index = fileEnts.entities.findIndex((e: any) => e.id === updatedEntity.id);
            if (index !== -1) {
              fileEnts.entities[index] = updatedEntity;
            }
          }
        });

        // Process deleted entities
        deletedEntityIds.forEach((deletedId) => {
          newMap.forEach((fileEnts) => {
            const index = fileEnts.entities.findIndex((e: any) => e.id === deletedId);
            if (index !== -1) {
              fileEnts.entities.splice(index, 1);
            }
          });
        });

        return newMap;
      });
    },
    []
  );

  return {
    fileEntities,
    setFileEntities,
    updateEntities,
  };
};
