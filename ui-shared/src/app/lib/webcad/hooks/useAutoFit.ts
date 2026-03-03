import { useEffect } from 'react';
import { useAppStore } from '../../../store';
import { calculateViewport } from '../../../utils/viewport';
import type { Layout } from '@dxf-fix/shared';

interface UseAutoFitProps {
  currentFile: any;
  stageSize: { width: number; height: number };
  selectedLayout?: Layout | null;
}

export function useAutoFit({ currentFile, stageSize, selectedLayout }: UseAutoFitProps) {
  const { setView } = useAppStore();

  useEffect(() => {
    //优先适配排样布局
    if (selectedLayout) {
      const materialWidth = 2000; // 默认材料宽度
      const materialHeight = 1000; // 默认材料高度
      
      const width = materialWidth;
      const height = materialHeight;


      const scaleX = stageSize.width / width;
      const scaleY = stageSize.height / height;
      const newZoom = Math.min(scaleX, scaleY) * 0.9;
      const newPan = {
        x: 20,
        y: height * newZoom + 20,
      };


      setView({
        zoom: newZoom,
        pan: newPan,
        viewport: calculateViewport(newPan, newZoom, stageSize),
      });
      return;
    }

    // 否则适配正常文件
    if (currentFile && currentFile.status === 'ready' && currentFile.bbox) {
      const bbox = currentFile.bbox;
      const width = bbox.maxX - bbox.minX;
      const height = bbox.maxY - bbox.minY;

      // Validate bbox
      if (width > 0 && height > 0 && width < 1e6 && height < 1e6) {

        const scaleX = stageSize.width / width;
        const scaleY = stageSize.height / height;
        const newZoom = Math.min(scaleX, scaleY) * 0.9;
        const newPan = {
          x: -bbox.minX * newZoom + 20,
          y: bbox.maxY * newZoom + 20,
        };


        setView({
          zoom: newZoom,
          pan: newPan,
          viewport: calculateViewport(newPan, newZoom, stageSize),
        });
      } else {
        // Invalid bbox, skipping auto-fit
      }
    }
  }, [currentFile, selectedLayout]);
}
