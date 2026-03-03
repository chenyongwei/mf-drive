import { useEffect, useRef } from "react";
import type { CADToolType } from "../CADToolPanel";
import { shouldIgnoreCadShortcut } from "../CADView.shortcuts";

interface UseCADViewKeyboardOptions {
  isNestingMode: boolean;
  isEditMode: boolean;
  fineRotationStep: number;
  selectedPartIds: string[];
  selectedPartId: string | null;
  rotatePart: (partId: string, angle: number) => void;
  clearPartSelection: () => void;
  onNestingEscape?: () => void;
  cancelDrawing: () => void;
  handleToolSelect: (tool: CADToolType) => void;
}

export function useCADViewKeyboard({
  isNestingMode,
  isEditMode,
  fineRotationStep,
  selectedPartIds,
  selectedPartId,
  rotatePart,
  clearPartSelection,
  onNestingEscape,
  cancelDrawing,
  handleToolSelect,
}: UseCADViewKeyboardOptions) {
  const activeKeysRef = useRef<Set<string>>(new Set());
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isNestingMode) {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
        rotationTimerRef.current = null;
      }
      activeKeysRef.current.clear();
      return;
    }

    const startRotation = (key: string) => {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
      }

      const rotate = () => {
        const targetIds =
          selectedPartIds.length > 0
            ? selectedPartIds
            : selectedPartId
              ? [selectedPartId]
              : [];

        targetIds.forEach((id) => {
          if (key === "a") rotatePart(id, -90);
          else if (key === "d") rotatePart(id, 90);
          else if (key === "q") rotatePart(id, -fineRotationStep);
          else if (key === "e") rotatePart(id, fineRotationStep);
        });
      };

      rotate();
      rotationTimerRef.current = setInterval(rotate, 100);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isNestingMode || event.repeat) return;
      if (shouldIgnoreCadShortcut(event)) return;

      const key = event.key.toLowerCase();
      if (["a", "d", "q", "e"].includes(key)) {
        activeKeysRef.current.add(key);
        startRotation(key);
      } else if (key === "escape") {
        onNestingEscape?.();
        clearPartSelection();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      activeKeysRef.current.delete(key);

      const hasRotationKey = Array.from(activeKeysRef.current).some((item) =>
        ["a", "d", "q", "e"].includes(item),
      );

      if (!hasRotationKey && rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
        rotationTimerRef.current = null;
      } else if (hasRotationKey) {
        const remaining = Array.from(activeKeysRef.current);
        const nextKey = remaining[remaining.length - 1];
        if (["a", "d", "q", "e"].includes(nextKey)) {
          startRotation(nextKey);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
      }
    };
  }, [
    isNestingMode,
    fineRotationStep,
    selectedPartIds,
    selectedPartId,
    rotatePart,
    clearPartSelection,
    onNestingEscape,
  ]);

  useEffect(() => {
    if (isNestingMode || !isEditMode) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreCadShortcut(event)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key.toLowerCase();
      const keyToTool: Partial<Record<string, CADToolType>> = {
        d: "draw-dimension",
        v: "select",
        l: "draw-line",
        p: "draw-polyline",
        c: "draw-circle",
        r: "draw-rectangle",
        b: "draw-bezier",
        m: "draw-text",
      };

      if (key === "escape") {
        event.preventDefault();
        cancelDrawing();
        handleToolSelect("select");
        return;
      }

      const tool = keyToTool[key];
      if (tool) {
        event.preventDefault();
        handleToolSelect(tool);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isNestingMode, isEditMode, cancelDrawing, handleToolSelect]);
}
