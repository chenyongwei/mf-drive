import { useCallback, useRef, useState } from "react";
import { Entity } from "../../../lib/webgpu/EntityToVertices";
import type { SnapPoint } from "./useSnapping";
import {
  commitTextDraftEntity,
  generateEntityId,
  getInitialTextToolOptions,
  resetDrawingState,
} from "./useCADDrawing.helpers";
import {
  finishDrawingEvent,
  handleDrawingClickEvent,
} from "./useCADDrawing.handlers.click";
import { handleDrawingMoveEvent } from "./useCADDrawing.handlers.move";
import type {
  Point2D,
  TextDraftState,
  TextToolOptions,
  UseCADDrawingProps,
} from "./useCADDrawing.types";

export const useCADDrawing = ({
  activeTool,
  isDrawing,
  setIsDrawing,
  onEntityCreate,
  selectedFileId = null,
  isNestingMode = false,
}: UseCADDrawingProps) => {
  const [startPoint, setStartPoint] = useState<Point2D | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point2D | null>(null);
  const [previewEntity, setPreviewEntity] = useState<Entity | null>(null);
  const [polyPoints, setPolyPoints] = useState<Point2D[]>([]);
  const [textDraft, setTextDraft] = useState<TextDraftState | null>(null);
  const [textToolOptions, setTextToolOptions] = useState<TextToolOptions>(() =>
    getInitialTextToolOptions(),
  );

  const [drawingStep, setDrawingStep] = useState<number>(0);
  const lastStepTimeRef = useRef<number>(0);

  const stateSetters = {
    setIsDrawing,
    setStartPoint,
    setCurrentPoint,
    setPreviewEntity,
    setPolyPoints,
    setDrawingStep,
    setTextDraft,
  };

  const finishDrawing = useCallback(() => {
    finishDrawingEvent({
      activeTool,
      isDrawing,
      polyPoints,
      onEntityCreate,
      setters: stateSetters,
      generateEntityId,
    });
  }, [activeTool, isDrawing, polyPoints, onEntityCreate, setIsDrawing]);

  const cancelDrawing = useCallback(() => {
    resetDrawingState(stateSetters);
  }, [setIsDrawing]);

  const updateTextDraft = useCallback((content: string) => {
    setTextDraft((prev) => (prev ? { ...prev, content } : prev));
  }, []);

  const updateTextToolOptions = useCallback((updates: Partial<TextToolOptions>) => {
    setTextToolOptions((prev) => ({ ...prev, ...updates }));
  }, []);

  const commitTextDraft = useCallback(
    (contentOverride?: string): boolean => {
      return commitTextDraftEntity({
        draft: textDraft,
        textToolOptions,
        contentOverride,
        onEntityCreate,
        setters: stateSetters,
      });
    },
    [textDraft, textToolOptions, onEntityCreate, setIsDrawing],
  );

  const handleDrawingClick = useCallback(
    (worldX: number, worldY: number, snappedPoint: SnapPoint | null) => {
      handleDrawingClickEvent({
        activeTool,
        isDrawing,
        startPoint,
        polyPoints,
        drawingStep,
        worldX,
        worldY,
        snappedPoint,
        lastStepTimeRef,
        onEntityCreate,
        setters: stateSetters,
        selectedFileId,
        isNestingMode,
      });
    },
    [
      activeTool,
      isDrawing,
      startPoint,
      polyPoints,
      drawingStep,
      onEntityCreate,
      selectedFileId,
      isNestingMode,
      setIsDrawing,
    ],
  );

  const handleDrawingMove = useCallback(
    (worldX: number, worldY: number, snappedPoint: SnapPoint | null) => {
      handleDrawingMoveEvent({
        activeTool,
        isDrawing,
        startPoint,
        polyPoints,
        drawingStep,
        worldX,
        worldY,
        snappedPoint,
        setCurrentPoint,
        setPreviewEntity,
      });
    },
    [activeTool, isDrawing, startPoint, polyPoints, drawingStep],
  );

  return {
    isDrawing,
    startPoint,
    currentPoint,
    previewEntity,
    textDraft,
    textToolOptions,
    handleDrawingClick,
    handleDrawingMove,
    cancelDrawing,
    finishDrawing,
    updateTextDraft,
    updateTextToolOptions,
    commitTextDraft,
  };
};
