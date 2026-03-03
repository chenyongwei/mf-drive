import { useCallback, SetStateAction } from 'react';
import { Part } from '../types';

/**
 * Custom hook for handling part manipulation operations
 * (rotate, mirror, zoom, etc.)
 */
export const usePartManipulation = (
  selectedPartIds: Set<string>,
  setParts: React.Dispatch<SetStateAction<Part[]>>,
  addToHistory: (action: any) => void
) => {
  const handleRotateLeft = useCallback(() => {
    if (selectedPartIds.size === 0) return;
    setParts((prev: Part[]) =>
      prev.map((p) => {
        if (selectedPartIds.has(p.id)) {
          const newRotation = ((p.rotation || 0) - 90) % 360;
          const newWidth = p.dimensions.height;
          const newHeight = p.dimensions.width;
          return {
            ...p,
            rotation: newRotation < 0 ? newRotation + 360 : newRotation,
            dimensions: { width: newWidth, height: newHeight },
          };
        }
        return p;
      })
    );
    addToHistory({
      type: 'rotate',
      direction: 'left',
      partIds: Array.from(selectedPartIds),
    });
  }, [selectedPartIds, setParts, addToHistory]);

  const handleRotateRight = useCallback(() => {
    if (selectedPartIds.size === 0) return;
    setParts((prev: Part[]) =>
      prev.map((p) => {
        if (selectedPartIds.has(p.id)) {
          const newRotation = ((p.rotation || 0) + 90) % 360;
          const newWidth = p.dimensions.height;
          const newHeight = p.dimensions.width;
          return {
            ...p,
            rotation: newRotation,
            dimensions: { width: newWidth, height: newHeight },
          };
        }
        return p;
      })
    );
    addToHistory({
      type: 'rotate',
      direction: 'right',
      partIds: Array.from(selectedPartIds),
    });
  }, [selectedPartIds, setParts, addToHistory]);

  const handleMirrorHorizontal = useCallback(() => {
    if (selectedPartIds.size === 0) return;
    setParts((prev: Part[]) =>
      prev.map((p) => {
        if (selectedPartIds.has(p.id)) {
          return { ...p, mirroredH: !(p as any).mirroredH };
        }
        return p;
      })
    );
    addToHistory({
      type: 'mirror',
      direction: 'horizontal',
      partIds: Array.from(selectedPartIds),
    });
  }, [selectedPartIds, setParts, addToHistory]);

  const handleMirrorVertical = useCallback(() => {
    if (selectedPartIds.size === 0) return;
    setParts((prev: Part[]) =>
      prev.map((p) => {
        if (selectedPartIds.has(p.id)) {
          return { ...p, mirroredV: !(p as any).mirroredV };
        }
        return p;
      })
    );
    addToHistory({
      type: 'mirror',
      direction: 'vertical',
      partIds: Array.from(selectedPartIds),
    });
  }, [selectedPartIds, setParts, addToHistory]);

  const handleZoomIn = useCallback(() => {
  }, []);

  const handleZoomOut = useCallback(() => {
  }, []);

  const handleFitToView = useCallback(() => {
  }, []);

  const handleEditProperties = useCallback(() => {
  }, []);

  return {
    handleRotateLeft,
    handleRotateRight,
    handleMirrorHorizontal,
    handleMirrorVertical,
    handleZoomIn,
    handleZoomOut,
    handleFitToView,
    handleEditProperties,
  };
};
