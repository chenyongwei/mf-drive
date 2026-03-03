import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../../store';
import { getTiles, getLayers } from '../../../services/api';
import { getEntityBBox } from '../../../utils/entityBBox';

interface UseEntityLoaderProps {
  currentFile: any;
  view: any;
  stageSize: { width: number; height: number };
}

export function useEntityLoader({ currentFile, view, stageSize }: UseEntityLoaderProps) {
  const [entities, setEntities] = useState<any[]>([]);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastZoomLevelRef = useRef<number>(-1);
  const allEntitiesCacheRef = useRef<any[]>([]);

  // Load layers when file is ready
  useEffect(() => {
    const { setLayers } = useAppStore.getState();

    if (currentFile && currentFile.status === 'ready') {
      loadLayers();
    }
  }, [currentFile?.id, currentFile?.status]);

  // Load entities based on viewport (with debounce)
  useEffect(() => {
    // Clear previous timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    if (currentFile && currentFile.status === 'ready' && currentFile.bbox) {
      // Calculate current zoomLevel
      const currentZoomLevel = Math.floor(Math.log2(1 / view.zoom));

      // Only request if zoomLevel changed OR first load
      if (currentZoomLevel !== lastZoomLevelRef.current) {

        // Debounce load to prevent race conditions during fast zooming
        loadTimeoutRef.current = setTimeout(() => {
          loadEntities(currentZoomLevel);
          lastZoomLevelRef.current = currentZoomLevel;
        }, 150);
      } else if (view.viewport) {
        // Only viewport changed (panning), filter entities frontend
        filterEntitiesByViewport();
      }
    }

    // Cleanup
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [currentFile?.id, view.viewport, view.zoom]);

  const loadLayers = async () => {
    if (!currentFile) return;

    try {
      const data = await getLayers(currentFile.id);
      const { setLayers } = useAppStore.getState();
      setLayers(currentFile.id, data.layers);
    } catch (error) {
      console.error('Load layers error:', error);
    }
  };

  const loadEntities = async (zoomLevel: number) => {
    if (!currentFile) {
      return;
    }


    try {
      // Use large viewport to get all entities at this LOD level
      const viewport = { xMin: -1e9, yMin: -1e9, xMax: 1e9, yMax: 1e9 };
      const data = await getTiles(currentFile.id, viewport, zoomLevel);


      const newEntities = data.tiles[0]?.entities || [];
      allEntitiesCacheRef.current = newEntities;
      setEntities(newEntities);
    } catch (error) {
      console.error('Load entities error:', error);
    }
  };

  const filterEntitiesByViewport = () => {
    const viewport = view.viewport || { minX: -10000, minY: -10000, maxX: 10000, maxY: 10000 };
    const padding = Math.max(1000 / view.zoom, 100);
    const paddedViewport = {
      minX: viewport.minX - padding,
      minY: viewport.minY - padding,
      maxX: viewport.maxX + padding,
      maxY: viewport.maxY + padding,
    };

    // Filter from cached entities
    const filtered = allEntitiesCacheRef.current.filter((entity: any) => {
      const bbox = getEntityBBox(entity);
      return (
        bbox.maxX >= paddedViewport.minX &&
        bbox.minX <= paddedViewport.maxX &&
        bbox.maxY >= paddedViewport.minY &&
        bbox.minY <= paddedViewport.maxY
      );
    });

    setEntities(filtered);
  };

  return { entities };
}
