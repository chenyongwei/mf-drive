import { useCallback } from 'react';
import {
  calculateCenteredPosition,
  calculateFitScale,
  calculateOptimalGrid as resolveOptimalGrid,
  getCellPosition,
} from '../utils/layoutHelpers';

interface ImportedFile {
  id: string;
  name: string;
  status: 'uploading' | 'parsing' | 'ready' | 'error';
  bbox?: { minX: number; minY: number; maxX: number; maxY: number };
}

interface TiledLayout {
  fileId: string;
  position: { x: number; y: number };
  scale: number;
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
}

interface UseTiledLayoutOptions {
  viewportWidth?: number;
  viewportHeight?: number;
  spacing?: number;
  padding?: number;
}

export function useTiledLayout(options: UseTiledLayoutOptions = {}) {
  const {
    viewportWidth = 3000,
    viewportHeight = 2000,
    spacing = 50,
    padding = 20,
  } = options;

  const calculateOptimalGrid = useCallback((count: number) => {
    return resolveOptimalGrid(count, viewportWidth, viewportHeight);
  }, [viewportWidth, viewportHeight]);

  const calculateTiledLayout = useCallback((
    files: ImportedFile[]
  ): TiledLayout[] => {
    if (files.length === 0) return [];

    const { rows, cols } = calculateOptimalGrid(files.length);
    const cellWidth = viewportWidth / cols;
    const cellHeight = viewportHeight / rows;

    const layouts: TiledLayout[] = [];

    files.forEach((file, index) => {
      const { x: cellX, y: cellY } = getCellPosition(
        index,
        cols,
        cellWidth,
        cellHeight,
        spacing
      );

      const fileBbox = file.bbox || { minX: 0, minY: 0, maxX: 100, maxY: 100 };
      const fileWidth = fileBbox.maxX - fileBbox.minX;
      const fileHeight = fileBbox.maxY - fileBbox.minY;

      const scale = calculateFitScale(
        fileWidth,
        fileHeight,
        cellWidth,
        cellHeight,
        padding
      );

      const scaledWidth = fileWidth * scale;
      const scaledHeight = fileHeight * scale;
      const position = calculateCenteredPosition(
        fileWidth,
        fileHeight,
        scale,
        cellX,
        cellY,
        cellWidth,
        cellHeight
      );

      layouts.push({
        fileId: file.id,
        position,
        scale,
        bbox: {
          minX: position.x,
          minY: position.y,
          maxX: position.x + scaledWidth,
          maxY: position.y + scaledHeight
        }
      });
    });

    return layouts;
  }, [calculateOptimalGrid, viewportWidth, viewportHeight, spacing, padding]);

  return {
    calculateTiledLayout,
    calculateOptimalGrid,
  };
}
