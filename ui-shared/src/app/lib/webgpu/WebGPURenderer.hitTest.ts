import type { Entity } from "./EntityToVertices";

function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const pointToStartX = px - x1;
  const pointToStartY = py - y1;
  const segmentX = x2 - x1;
  const segmentY = y2 - y1;
  const dot = pointToStartX * segmentX + pointToStartY * segmentY;
  const lenSq = segmentX * segmentX + segmentY * segmentY;
  let t = -1;

  if (lenSq !== 0) {
    t = dot / lenSq;
  }

  let projectedX: number;
  let projectedY: number;

  if (t < 0) {
    projectedX = x1;
    projectedY = y1;
  } else if (t > 1) {
    projectedX = x2;
    projectedY = y2;
  } else {
    projectedX = x1 + t * segmentX;
    projectedY = y1 + t * segmentY;
  }

  return Math.hypot(px - projectedX, py - projectedY);
}

function distanceToCircle(
  px: number,
  py: number,
  centerX: number,
  centerY: number,
  radius: number,
): number {
  return Math.abs(Math.hypot(px - centerX, py - centerY) - radius);
}

function distanceToPolyline(
  px: number,
  py: number,
  points: Array<{ x: number; y: number }>,
): number {
  if (points.length < 2) {
    return Infinity;
  }

  let minDistance = Infinity;
  for (let i = 0; i < points.length - 1; i += 1) {
    const dist = distanceToSegment(
      px,
      py,
      points[i].x,
      points[i].y,
      points[i + 1].x,
      points[i + 1].y,
    );
    minDistance = Math.min(minDistance, dist);
  }
  return minDistance;
}

export function findEntityAtPosition(
  worldX: number,
  worldY: number,
  entities: Entity[],
  threshold = 5,
): string | null {
  let closestEntity: string | null = null;
  let minDistance = threshold;

  for (const entity of entities) {
    let distance = Infinity;

    switch (entity.type) {
      case "LINE": {
        if (entity.geometry?.start && entity.geometry?.end) {
          distance = distanceToSegment(
            worldX,
            worldY,
            entity.geometry.start.x,
            entity.geometry.start.y,
            entity.geometry.end.x,
            entity.geometry.end.y,
          );
        }
        break;
      }
      case "CIRCLE":
      case "ARC": {
        if (
          entity.geometry?.center &&
          typeof entity.geometry.radius === "number"
        ) {
          distance = distanceToCircle(
            worldX,
            worldY,
            entity.geometry.center.x,
            entity.geometry.center.y,
            entity.geometry.radius,
          );
        }
        break;
      }
      case "POLYLINE":
      case "LWPOLYLINE": {
        if (entity.geometry?.points && Array.isArray(entity.geometry.points)) {
          distance = distanceToPolyline(worldX, worldY, entity.geometry.points);
        }
        break;
      }
      case "SPLINE": {
        const splinePoints =
          entity.geometry?.controlPoints || entity.geometry?.points;
        if (splinePoints && Array.isArray(splinePoints)) {
          distance = distanceToPolyline(worldX, worldY, splinePoints);
        }
        break;
      }
      default:
        break;
    }

    if (distance < minDistance) {
      minDistance = distance;
      closestEntity = entity.id;
    }
  }

  return closestEntity;
}
