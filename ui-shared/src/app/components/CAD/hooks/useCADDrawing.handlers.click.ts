import type { MutableRefObject } from "react";
import type { CADToolType } from "../CADToolPanel";
import type { SnapPoint } from "./useSnapping";
import { handleBasicDrawingClick } from "./useCADDrawing.handlers.click.basic";
import { handleDimensionDrawingClick } from "./useCADDrawing.handlers.click.dimension";
import type {
  DrawingStateSetters,
  Point2D,
} from "./useCADDrawing.types";
import { resetDrawingState } from "./useCADDrawing.helpers";
import type { Entity } from "../../../lib/webgpu/EntityToVertices";

interface HandleDrawingClickArgs {
  activeTool: CADToolType;
  isDrawing: boolean;
  startPoint: Point2D | null;
  polyPoints: Point2D[];
  drawingStep: number;
  worldX: number;
  worldY: number;
  snappedPoint: SnapPoint | null;
  lastStepTimeRef: MutableRefObject<number>;
  onEntityCreate: (entity: Entity) => void;
  setters: DrawingStateSetters;
  selectedFileId?: string | null;
  isNestingMode: boolean;
}

const MULTI_STEP_TOOLS = new Set([
  "draw-polyline",
  "draw-bezier",
  "draw-arc-3pt",
  "draw-dimension",
]);

export function handleDrawingClickEvent({
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
  setters,
  selectedFileId,
  isNestingMode,
}: HandleDrawingClickArgs): void {
  if (!activeTool.startsWith("draw-")) {
    return;
  }

  const x = snappedPoint ? snappedPoint.x : worldX;
  const y = snappedPoint ? snappedPoint.y : worldY;

  if (activeTool === "draw-text") {
    if (!isDrawing) {
      setters.setIsDrawing(true);
      setters.setStartPoint({ x, y });
      setters.setCurrentPoint({ x, y });
      setters.setDrawingStep(1);
      setters.setTextDraft({ position: { x, y }, content: "" });
      lastStepTimeRef.current = Date.now();
    }
    return;
  }

  if (!isDrawing) {
    setters.setIsDrawing(true);
    setters.setStartPoint({ x, y });
    setters.setCurrentPoint({ x, y });
    setters.setDrawingStep(1);
    lastStepTimeRef.current = Date.now();

    if (
      MULTI_STEP_TOOLS.has(activeTool) ||
      activeTool === "draw-arc"
    ) {
      setters.setPolyPoints([{ x, y }]);
    }
    return;
  }

  if (activeTool === "draw-dimension") {
    handleDimensionDrawingClick({
      drawingStep,
      polyPoints,
      x,
      y,
      lastStepTimeRef,
      onEntityCreate,
      selectedFileId,
      isNestingMode,
      setters,
    });
    return;
  }

  handleBasicDrawingClick({
    activeTool,
    startPoint,
    polyPoints,
    drawingStep,
    x,
    y,
    onEntityCreate,
    setters,
  });
}

interface FinishDrawingArgs {
  activeTool: CADToolType;
  isDrawing: boolean;
  polyPoints: Point2D[];
  onEntityCreate: (entity: Entity) => void;
  setters: DrawingStateSetters;
  generateEntityId: () => string;
}

export function finishDrawingEvent({
  activeTool,
  isDrawing,
  polyPoints,
  onEntityCreate,
  setters,
  generateEntityId,
}: FinishDrawingArgs): void {
  if (!isDrawing) {
    return;
  }

  if (activeTool === "draw-dimension" || activeTool === "draw-text") {
    return;
  }

  if (activeTool === "draw-polyline" && polyPoints.length > 1) {
    onEntityCreate({
      id: generateEntityId(),
      type: "LWPOLYLINE",
      geometry: { points: polyPoints.map((p) => ({ ...p })), closed: false },
      layer: "0",
      color: 7,
      isSelected: false,
    });
  } else if (activeTool === "draw-bezier" && polyPoints.length > 1) {
    const points = polyPoints.map((p) => ({ ...p }));
    onEntityCreate({
      id: generateEntityId(),
      type: "SPLINE",
      geometry: { points, controlPoints: points, closed: false },
      layer: "0",
      color: 7,
      isSelected: false,
    });
  }

  resetDrawingState(setters);
}
