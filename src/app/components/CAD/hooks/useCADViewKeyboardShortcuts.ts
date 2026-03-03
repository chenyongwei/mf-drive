import { useEffect, useRef } from 'react';
import { CADToolType } from '../CADToolPanel';

interface UseCADViewKeyboardShortcutsOptions {
  isNestingMode: boolean;
  isEditMode: boolean;
  selectedPartIds: string[];
  selectedPartId: string | null;
  fineRotationStep: number;
  rotatePart: (id: string, angle: number) => void;
  clearPartSelection: () => void;
  cancelDrawing: () => void;
  handleToolSelect: (tool: CADToolType) => void;
}

export function useCADViewKeyboardShortcuts({
  isNestingMode,
  isEditMode,
  selectedPartIds,
  selectedPartId,
  fineRotationStep,
  rotatePart,
  clearPartSelection,
  cancelDrawing,
  handleToolSelect,
}: UseCADViewKeyboardShortcutsOptions) {
  const activeKeysRef = useRef<Set<string>>(new Set());
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isNestingMode) {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
      rotationTimerRef.current = null;
      activeKeysRef.current.clear();
      return;
    }

    const startRotation = (key: string) => {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
      const rotate = () => {
        const targetIds = selectedPartIds.length > 0 ? selectedPartIds : selectedPartId ? [selectedPartId] : [];
        targetIds.forEach((id) => {
          if (key === 'a') rotatePart(id, -90);
          if (key === 'd') rotatePart(id, 90);
          if (key === 'q') rotatePart(id, -fineRotationStep);
          if (key === 'e') rotatePart(id, fineRotationStep);
        });
      };
      rotate();
      rotationTimerRef.current = setInterval(rotate, 100);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (['a', 'd', 'q', 'e'].includes(key)) {
        activeKeysRef.current.add(key);
        startRotation(key);
      } else if (key === 'escape') {
        clearPartSelection();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      activeKeysRef.current.delete(e.key.toLowerCase());
      const keys = Array.from(activeKeysRef.current).filter((k) => ['a', 'd', 'q', 'e'].includes(k));
      if (keys.length === 0) {
        if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
        rotationTimerRef.current = null;
        return;
      }
      startRotation(keys[keys.length - 1]);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
    };
  }, [isNestingMode, selectedPartIds, selectedPartId, fineRotationStep, rotatePart, clearPartSelection]);

  useEffect(() => {
    if (isNestingMode || !isEditMode) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      const keyToTool: Partial<Record<string, CADToolType>> = {
        d: 'draw-dimension',
        v: 'select',
        l: 'draw-line',
        p: 'draw-polyline',
        c: 'draw-circle',
        r: 'draw-rectangle',
        b: 'draw-bezier',
      };

      if (key === 'escape') {
        e.preventDefault();
        cancelDrawing();
        handleToolSelect('select');
      } else if (keyToTool[key]) {
        e.preventDefault();
        handleToolSelect(keyToTool[key] as CADToolType);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isNestingMode, isEditMode, cancelDrawing, handleToolSelect]);
}
