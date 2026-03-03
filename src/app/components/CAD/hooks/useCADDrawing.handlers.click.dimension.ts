import { Entity } from "../../../lib/webgpu/EntityToVertices";
import type { MutableRefObject } from "react";
import {
  generateEntityId,
  resetDrawingState,
  saveDimensionToServer,
} from "./useCADDrawing.helpers";
import type {
  DrawingStateSetters,
  Point2D,
} from "./useCADDrawing.types";

interface DimensionClickArgs {
  drawingStep: number;
  polyPoints: Point2D[];
  x: number;
  y: number;
  lastStepTimeRef: MutableRefObject<number>;
  onEntityCreate: (entity: Entity) => void;
  selectedFileId?: string | null;
  isNestingMode: boolean;
  setters: DrawingStateSetters;
}

export function handleDimensionDrawingClick({
  drawingStep,
  polyPoints,
  x,
  y,
  lastStepTimeRef,
  onEntityCreate,
  selectedFileId,
  isNestingMode,
  setters,
}: DimensionClickArgs): void {
  if (drawingStep === 1) {
    setters.setPolyPoints([...polyPoints, { x, y }]);
    setters.setDrawingStep(2);
    lastStepTimeRef.current = Date.now();
    return;
  }

  if (drawingStep !== 2 || polyPoints.length <= 0) {
    return;
  }

  if (Date.now() - lastStepTimeRef.current < 300) {
    return;
  }

  const startP = polyPoints[0];
  const endP = polyPoints[1];
  const textPoint = { x, y };

  if (startP && endP) {
    const newEntity: Entity = {
      id: generateEntityId(),
      type: "DIMENSION",
      geometry: {
        start: startP,
        end: endP,
        textPoint,
      },
      layer: "0",
      color: 7,
      isSelected: false,
    };

    onEntityCreate(newEntity);

    saveDimensionToServer(
      {
        id: newEntity.id,
        type: "LINEAR",
        geometry: {
          start: startP,
          end: endP,
          textPoint,
          text: Math.sqrt(
            Math.pow(endP.x - startP.x, 2) + Math.pow(endP.y - startP.y, 2),
          ).toFixed(2),
        },
      },
      selectedFileId || undefined,
      isNestingMode ? "PART" : "FILE",
    );
  }

  resetDrawingState(setters);
}
