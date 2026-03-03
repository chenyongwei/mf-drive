import type { EntityType, GraphicEntity, Point } from "../../../types";

export function applyDeltaToGeometry(
  type: EntityType,
  geometry: GraphicEntity["geometry"],
  delta: { x: number; y: number; z?: number }
): GraphicEntity["geometry"] {
  const translatePoint = (point: Point): Point => ({
    x: point.x + delta.x,
    y: point.y + delta.y,
    z:
      typeof point.z === "number" && typeof delta.z === "number"
        ? point.z + delta.z
        : point.z,
  });

  switch (type) {
    case "LINE":
      return {
        ...geometry,
        start: translatePoint((geometry as any).start),
        end: translatePoint((geometry as any).end),
      };
    case "ARC":
    case "CIRCLE":
    case "ELLIPSE":
      return {
        ...geometry,
        center: translatePoint((geometry as any).center),
      };
    case "POLYLINE":
    case "SPLINE":
      return {
        ...geometry,
        points: ((geometry as any).points || (geometry as any).controlPoints).map(
          translatePoint
        ),
        controlPoints: (geometry as any).controlPoints
          ? (geometry as any).controlPoints.map(translatePoint)
          : undefined,
      };
    case "TEXT":
    case "MTEXT":
      return {
        ...geometry,
        position: translatePoint((geometry as any).position),
        textPosition: (geometry as any).textPosition
          ? translatePoint((geometry as any).textPosition)
          : undefined,
      };
    case "DIMENSION":
      return {
        ...geometry,
        position: translatePoint((geometry as any).position),
        textPosition: translatePoint((geometry as any).textPosition),
        points: (geometry as any).points.map(translatePoint),
      };
    case "SOLID":
      return {
        ...geometry,
        points: (geometry as any).points.map(translatePoint),
      };
    default:
      return geometry;
  }
}

export function applyScaleToGeometry(
  type: EntityType,
  geometry: GraphicEntity["geometry"],
  scale: number
): GraphicEntity["geometry"] {
  const scalePoint = (point: Point): Point => ({
    x: point.x * scale,
    y: point.y * scale,
    z: typeof point.z === "number" ? point.z * scale : point.z,
  });

  switch (type) {
    case "LINE":
      return {
        ...geometry,
        start: scalePoint((geometry as any).start),
        end: scalePoint((geometry as any).end),
      };
    case "ARC":
    case "CIRCLE":
      return {
        ...geometry,
        center: scalePoint((geometry as any).center),
        radius: (geometry as any).radius * scale,
      };
    case "POLYLINE":
    case "SPLINE":
      return {
        ...geometry,
        points: (geometry as any).points.map(scalePoint),
        controlPoints: (geometry as any).controlPoints
          ? (geometry as any).controlPoints.map(scalePoint)
          : undefined,
      };
    case "ELLIPSE":
      return {
        ...geometry,
        center: scalePoint((geometry as any).center),
        majorAxis: scalePoint((geometry as any).majorAxis),
      };
    case "TEXT":
    case "MTEXT":
      return {
        ...geometry,
        position: scalePoint((geometry as any).position),
        height: (geometry as any).height * scale,
      };
    case "DIMENSION":
      return {
        ...geometry,
        position: scalePoint((geometry as any).position),
        textPosition: scalePoint((geometry as any).textPosition),
        points: (geometry as any).points.map(scalePoint),
      };
    case "SOLID":
      return {
        ...geometry,
        points: (geometry as any).points.map(scalePoint),
      };
    default:
      return geometry;
  }
}
