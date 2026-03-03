import { useEffect } from 'react';
import { useAppStore } from '../../store';
import { getLayers } from '../../services/api';

interface UseLayerLoaderProps {
  currentFile: any;
  layers: any[];
  setLayers: (fileId: string, layers: any[]) => void;
}

export function useLayerLoader({ currentFile, layers, setLayers }: UseLayerLoaderProps) {
  useEffect(() => {
    if (currentFile && currentFile.status === 'ready' && layers.length === 0) {
      getLayers(currentFile.id)
        .then((data) => {
          setLayers(currentFile.id, data.layers);
        })
        .catch((error) => {
          console.error('LayerManager: Failed to load layers:', error);
        });
    }
  }, [currentFile?.id, currentFile?.status, layers.length]);
}
