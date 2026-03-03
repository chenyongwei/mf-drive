import { Entity } from "../../../lib/webgpu/EntityToVertices";
import type { CADToolType } from "../CADToolPanel";
import type { SnapPoint } from "./useSnapping";
import {
  generateArc,
  generateEllipse,
  generateThreePointArc,
} from "./useCADDrawing.helpers";
import type { Point2D } from "./useCADDrawing.types";

interface HandleDrawingMoveArgs {
  activeTool: CADToolType;
  isDrawing: boolean;
  startPoint: Point2D | null;
  polyPoints: Point2D[];
  drawingStep: number;
  worldX: number;
  worldY: number;
  snappedPoint: SnapPoint | null;
  setCurrentPoint: (point: Point2D | null) => void;
  setPreviewEntity: (entity: Entity | null) => void;
}

export function handleDrawingMoveEvent({
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
}: HandleDrawingMoveArgs): void {
  if (!isDrawing || !startPoint) {
    return;
  }

  if (activeTool === "draw-text") {
    setCurrentPoint({
      x: snappedPoint ? snappedPoint.x : worldX,
      y: snappedPoint ? snappedPoint.y : worldY,
    });
    return;
  }

  const x = snappedPoint ? snappedPoint.x : worldX;
  const y = snappedPoint ? snappedPoint.y : worldY;
  setCurrentPoint({ x, y });

  if (activeTool === "draw-line") {
    setPreviewEntity({
      id: "preview",
      type: "LINE",
      geometry: {
        start: { x: startPoint.x, y: startPoint.y },
        end: { x, y },
      },
      strokeColor: "#00FF00",
      isSelected: false,
    });
    return;
  }

  if (activeTool === "draw-circle") {
    const radius = Math.sqrt(
      Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2),
    );
    setPreviewEntity({
      id: "preview",
      type: "CIRCLE",
      geometry: { center: { x: startPoint.x, y: startPoint.y }, radius },
      strokeColor: "#00FF00",
      isSelected: false,
    });
    return;
  }

  if (activeTool === "draw-rectangle") {
    setPreviewEntity({
      id: "preview",
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
      strokeColor: "#00FF00",
      isSelected: false,
    });
    return;
  }

  if (activeTool === "draw-ellipse") {
    const rx = Math.abs(x - startPoint.x);
    const ry = Math.abs(y - startPoint.y);
    const points = generateEllipse(startPoint, rx, ry);
    setPreviewEntity({
      id: "preview",
      type: "LWPOLYLINE",
      geometry: { points, closed: true },
      strokeColor: "#00FF00",
      isSelected: false,
    });
    return;
  }

  if (activeTool === "draw-arc") {
    if (drawingStep === 1) {
      setPreviewEntity({
        id: "preview",
        type: "LINE",
        geometry: {
          start: { x: startPoint.x, y: startPoint.y },
          end: { x, y },
        },
        strokeColor: "#00FF00",
        isSelected: false,
      });
      return;
    }

    if (drawingStep === 2 && polyPoints.length > 0) {
      const startP = polyPoints[0];
      const radius = Math.sqrt(
        Math.pow(startP.x - startPoint.x, 2) + Math.pow(startP.y - startPoint.y, 2),
      );
      const startAngle = Math.atan2(startP.y - startPoint.y, startP.x - startPoint.x);
      const endAngle = Math.atan2(y - startPoint.y, x - startPoint.x);
      const points = generateArc(startPoint, radius, startAngle, endAngle);

      setPreviewEntity({
        id: "preview",
        type: "LWPOLYLINE",
        geometry: { points, closed: false },
        strokeColor: "#00FF00",
        isSelected: false,
      });
    }
    return;
  }

  if (activeTool === "draw-arc-3pt") {
    if (drawingStep === 1) {
      setPreviewEntity({
        id: "preview",
        type: "LINE",
        geometry: {
          start: { x: startPoint.x, y: startPoint.y },
          end: { x, y },
        },
        strokeColor: "#00FF00",
        isSelected: false,
      });
      return;
    }

    if (drawingStep === 2 && polyPoints.length > 1) {
      const p1 = polyPoints[0];
      const p2 = polyPoints[1];
      const p3 = { x, y };
      const points = generateThreePointArc(p1, p2, p3);
      if (points.length > 0) {
        setPreviewEntity({
          id: "preview",
          type: "LWPOLYLINE",
          geometry: { points, closed: false },
          strokeColor: "#00FF00",
          isSelected: false,
        });
      }
    }
    return;
  }

  if (activeTool === "draw-polyline") {
    const points = [...polyPoints.map((p) => ({ ...p })), { x, y }];
    setPreviewEntity({
      id: "preview",
      type: "LWPOLYLINE",
      geometry: { points, closed: false },
      strokeColor: "#00FF00",
      isSelected: false,
    });
    return;
  }

  if (activeTool === "draw-bezier") {
    const points = [...polyPoints.map((p) => ({ ...p })), { x, y }];
    setPreviewEntity({
      id: "preview",
      type: "SPLINE",
      geometry: { points, controlPoints: points, closed: false },
      strokeColor: "#00FF00",
      isSelected: false,
    });
    return;
  }

  if (activeTool === "draw-dimension") {
    if (drawingStep === 1 && polyPoints.length === 1) {
      const start = polyPoints[0];
      const midX = (start.x + x) / 2;
      const midY = (start.y + y) / 2;
      const dx = x - start.x;
      const dy = y - start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      let textPoint = { x: midX, y: midY };
      if (len > 0) {
        const perpX = -dy / len;
        const perpY = dx / len;
        textPoint = { x: midX + perpX * 20, y: midY + perpY * 20 };
      }

      setPreviewEntity({
        id: "preview",
        type: "DIMENSION",
        geometry: {
          start,
          end: { x, y },
          textPoint,
        },
        strokeColor: "#00FF00",
        isSelected: false,
      });
      return;
    }

    if (drawingStep === 2 && polyPoints.length >= 2) {
      setPreviewEntity({
        id: "preview",
        type: "DIMENSION",
        geometry: {
          start: polyPoints[0],
          end: polyPoints[1],
          textPoint: { x, y },
        },
        strokeColor: "#00FF00",
        isSelected: false,
      });
    }
  }
}
