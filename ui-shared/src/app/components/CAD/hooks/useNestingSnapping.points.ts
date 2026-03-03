import { getPartEdges, type PartForEdgeDetection } from "../utils/ParallelEdgeDetection";
import type { BoundingBox, NestingPart, Point } from "../types/NestingTypes";
import type { SnapPoint } from "./useNestingSnapping.types";

export function calculateBoundingBoxCenter(bbox: BoundingBox): Point {
  return {
    x: (bbox.minX + bbox.maxX) / 2,
    y: (bbox.minY + bbox.maxY) / 2,
  };
}

export function transformPoint(
  point: Point,
  position: Point,
  rotation: number,
  mirroredX: boolean,
  mirroredY: boolean,
): Point {
  const angle = (rotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  let x = point.x;
  let y = point.y;
  if (mirroredX) x = -x;
  if (mirroredY) y = -y;

  const rotatedX = x * cos - y * sin;
  const rotatedY = x * sin + y * cos;

  return {
    x: rotatedX + position.x,
    y: rotatedY + position.y,
  };
}

function extractBoundingBoxSnapPoints(part: NestingPart): SnapPoint[] {
  const points: SnapPoint[] = [];
  const bbox = part.boundingBox;

  const corners: Point[] = [
    { x: bbox.minX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.maxY },
    { x: bbox.minX, y: bbox.maxY },
  ];

  const worldCorners = corners.map((corner) =>
    transformPoint(
      corner,
      part.position,
      part.rotation,
      part.mirroredX || false,
      part.mirroredY || false,
    ),
  );

  worldCorners.forEach((corner) => {
    points.push({
      type: "corner",
      position: corner,
      partId: part.id,
    });
  });

  for (let i = 0; i < 4; i += 1) {
    const start = worldCorners[i];
    const end = worldCorners[(i + 1) % 4];

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const direction = { x: dx / length, y: dy / length };

    points.push({
      type: "edge",
      position: start,
      partId: part.id,
      edgeDirection: direction,
      edgeStart: start,
      edgeEnd: end,
    });

    const midpoint = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    };
    points.push({
      type: "edge",
      position: midpoint,
      partId: part.id,
      edgeDirection: direction,
      edgeStart: start,
      edgeEnd: end,
    });

    points.push({
      type: "edge",
      position: end,
      partId: part.id,
      edgeDirection: direction,
      edgeStart: start,
      edgeEnd: end,
    });
  }

  const localCenter = calculateBoundingBoxCenter(bbox);
  const worldCenter = transformPoint(
    localCenter,
    part.position,
    part.rotation,
    part.mirroredX || false,
    part.mirroredY || false,
  );

  points.push({
    type: "center",
    position: worldCenter,
    partId: part.id,
  });

  return points;
}

export function extractSnapPoints(part: NestingPart): SnapPoint[] {
  const hasEntities = Array.isArray(part.entities) && part.entities.length > 0;
  if (!hasEntities) {
    return extractBoundingBoxSnapPoints(part);
  }

  const points: SnapPoint[] = [];
  const edgePoints = getPartEdges(part as unknown as PartForEdgeDetection);
  const cornerKeySet = new Set<string>();
  const edgePointKey = (point: Point, inner: boolean) =>
    `${point.x.toFixed(4)}:${point.y.toFixed(4)}:${inner ? "in" : "out"}`;

  for (const edge of edgePoints) {
    const dx = edge.end.x - edge.start.x;
    const dy = edge.end.y - edge.start.y;
    const length = Math.hypot(dx, dy);
    if (length < 1e-6) {
      continue;
    }

    const direction = { x: dx / length, y: dy / length };
    const isInnerContour = Boolean(edge.isInnerContour);
    const midpoint = {
      x: (edge.start.x + edge.end.x) / 2,
      y: (edge.start.y + edge.end.y) / 2,
    };

    points.push({
      type: "edge",
      position: edge.start,
      partId: part.id,
      isInnerContour,
      edgeDirection: direction,
      edgeStart: edge.start,
      edgeEnd: edge.end,
    });
    points.push({
      type: "edge",
      position: midpoint,
      partId: part.id,
      isInnerContour,
      edgeDirection: direction,
      edgeStart: edge.start,
      edgeEnd: edge.end,
    });
    points.push({
      type: "edge",
      position: edge.end,
      partId: part.id,
      isInnerContour,
      edgeDirection: direction,
      edgeStart: edge.start,
      edgeEnd: edge.end,
    });

    const startKey = edgePointKey(edge.start, isInnerContour);
    if (!cornerKeySet.has(startKey)) {
      cornerKeySet.add(startKey);
      points.push({
        type: "corner",
        position: edge.start,
        partId: part.id,
        isInnerContour,
      });
    }

    const endKey = edgePointKey(edge.end, isInnerContour);
    if (!cornerKeySet.has(endKey)) {
      cornerKeySet.add(endKey);
      points.push({
        type: "corner",
        position: edge.end,
        partId: part.id,
        isInnerContour,
      });
    }
  }

  const localCenter = calculateBoundingBoxCenter(part.boundingBox);
  const worldCenter = transformPoint(
    localCenter,
    part.position,
    part.rotation,
    part.mirroredX || false,
    part.mirroredY || false,
  );
  points.push({
    type: "center",
    position: worldCenter,
    partId: part.id,
  });

  return points;
}
