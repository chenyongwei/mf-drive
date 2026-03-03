import { Entity } from "../../../lib/webgpu/EntityToVertices";
import type { CADToolType } from "../CADToolPanel";
import {
  generateArc,
  generateEllipse,
  generateEntityId,
  generateThreePointArc,
  resetDrawingState,
} from "./useCADDrawing.helpers";
import type {
  DrawingStateSetters,
  Point2D,
} from "./useCADDrawing.types";

interface BasicClickArgs {
  activeTool: CADToolType;
  startPoint: Point2D | null;
  polyPoints: Point2D[];
  drawingStep: number;
  x: number;
  y: number;
  onEntityCreate: (entity: Entity) => void;
  setters: DrawingStateSetters;
}

export function handleBasicDrawingClick({
  activeTool,
  startPoint,
  polyPoints,
  drawingStep,
  x,
  y,
  onEntityCreate,
  setters,
}: BasicClickArgs): void {
  if (activeTool === "draw-line" && startPoint) {
    onEntityCreate({
      id: generateEntityId(),
      type: "LINE",
      geometry: {
        start: { x: startPoint.x, y: startPoint.y },
        end: { x, y },
      },
      layer: "0",
      color: 7,
      isSelected: false,
    });
    resetDrawingState(setters);
    return;
  }

  if (activeTool === "draw-circle" && startPoint) {
    const radius = Math.sqrt(
      Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2),
    );
    onEntityCreate({
      id: generateEntityId(),
      type: "CIRCLE",
      geometry: {
        center: { x: startPoint.x, y: startPoint.y },
        radius,
      },
      layer: "0",
      color: 7,
      isSelected: false,
    });
    resetDrawingState(setters);
    return;
  }

  if (activeTool === "draw-rectangle" && startPoint) {
    onEntityCreate({
      id: generateEntityId(),
      type: "LWPOLYLINE",
      geometry: {
        points: [
          { x: startPoint.x, y: startPoint.y },
          { x, y: startPoint.y },
          { x, y },
          { x: startPoint.x, y },
        ],
        closed: true,
      },
      layer: "0",
      color: 7,
      isSelected: false,
    });
    resetDrawingState(setters);
    return;
  }

  if (activeTool === "draw-ellipse" && startPoint) {
    const rx = Math.abs(x - startPoint.x);
    const ry = Math.abs(y - startPoint.y);
    const points = generateEllipse(startPoint, rx, ry);

    onEntityCreate({
      id: generateEntityId(),
      type: "LWPOLYLINE",
      geometry: { points, closed: true },
      layer: "0",
      color: 7,
      isSelected: false,
    });
    resetDrawingState(setters);
    return;
  }

  if (activeTool === "draw-arc") {
    if (drawingStep === 1) {
      setters.setPolyPoints([{ x, y }]);
      setters.setDrawingStep(2);
      return;
    }

    if (drawingStep === 2 && startPoint && polyPoints.length > 0) {
      const startP = polyPoints[0];
      const radius = Math.sqrt(
        Math.pow(startP.x - startPoint.x, 2) + Math.pow(startP.y - startPoint.y, 2),
      );
      const startAngle = Math.atan2(startP.y - startPoint.y, startP.x - startPoint.x);
      const endAngle = Math.atan2(y - startPoint.y, x - startPoint.x);
      const points = generateArc(startPoint, radius, startAngle, endAngle);

      onEntityCreate({
        id: generateEntityId(),
        type: "LWPOLYLINE",
        geometry: { points, closed: false },
        layer: "0",
        color: 7,
        isSelected: false,
      });
      resetDrawingState(setters);
    }
    return;
  }

  if (activeTool === "draw-arc-3pt") {
    if (drawingStep === 1) {
      setters.setPolyPoints([...polyPoints, { x, y }]);
      setters.setDrawingStep(2);
      return;
    }

    if (drawingStep === 2) {
      const p1 = polyPoints[0];
      const p2 = polyPoints[1];
      const p3 = { x, y };
      const points = p1 && p2 ? generateThreePointArc(p1, p2, p3) : [];
      if (points.length > 0) {
        onEntityCreate({
          id: generateEntityId(),
          type: "LWPOLYLINE",
          geometry: { points, closed: false },
          layer: "0",
          color: 7,
          isSelected: false,
        });
      }
      resetDrawingState(setters);
    }
    return;
  }

  if (activeTool === "draw-polyline" || activeTool === "draw-bezier") {
    setters.setPolyPoints([...polyPoints, { x, y }]);
    return;
  }

  if (activeTool === "draw-dimension") {
    return;
  }

  if (activeTool === "draw-text") {
    return;
  }

  resetDrawingState(setters);
}
