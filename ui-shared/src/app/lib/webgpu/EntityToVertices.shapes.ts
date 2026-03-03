import { Vertex } from './WebGPUEngine';
import { addDashedSegment, getEntityStrokeColor } from './EntityToVertices.color';
import { Entity } from './EntityToVertices.types';

export const MIN_CIRCLE_SEGMENTS = 8;
export const MAX_CIRCLE_SEGMENTS = 64;
const SEGMENT_SCALE_FACTOR = 4;

export function calculateAdaptiveSegments(
  radius: number,
  detailScale: number = 1,
): number {
  const clampedScale = Math.max(0.2, Math.min(1, detailScale));
  return Math.min(
    MAX_CIRCLE_SEGMENTS,
    Math.max(
      MIN_CIRCLE_SEGMENTS,
      Math.ceil(radius * SEGMENT_SCALE_FACTOR * clampedScale),
    ),
  );
}

export function convertLineEntity(
  entity: Entity,
  theme: 'dark' | 'light' = 'dark',
): Vertex[] {
  if (!entity.geometry?.start || !entity.geometry?.end) return [];

  const strokeColor = getEntityStrokeColor(entity, theme);
  const isDashed = entity.linetype === 'dashed';

  if (isDashed) {
    const vertices: Vertex[] = [];
    addDashedSegment(vertices, entity.geometry.start, entity.geometry.end, strokeColor);
    return vertices;
  }

  return [
    { x: entity.geometry.start.x, y: entity.geometry.start.y, ...strokeColor },
    { x: entity.geometry.end.x, y: entity.geometry.end.y, ...strokeColor },
  ];
}

export function convertCircleEntity(
  entity: Entity,
  theme: 'dark' | 'light' = 'dark',
  maxSegments: number = MAX_CIRCLE_SEGMENTS,
): Vertex[] {
  if (!entity.geometry?.center || typeof entity.geometry.radius !== 'number') return [];

  const center = entity.geometry.center;
  const radius = entity.geometry.radius;

  const baseSegments = calculateAdaptiveSegments(radius);
  const segments = Math.min(maxSegments, baseSegments);

  const strokeColor = getEntityStrokeColor(entity, theme);
  const isDashed = entity.linetype === 'dashed';

  const vertices: Vertex[] = [];

  const isArc = entity.type?.toUpperCase() === 'ARC';
  const startAngle = entity.geometry.startAngle ?? 0;
  const endAngle = entity.geometry.endAngle ?? 2 * Math.PI;

  let deltaAngle = endAngle - startAngle;
  if (isArc && deltaAngle <= 0) {
    deltaAngle += 2 * Math.PI;
  }
  if (!isArc) {
    deltaAngle = 2 * Math.PI;
  }

  const activeSegments = isArc
    ? Math.max(8, Math.ceil(segments * (deltaAngle / (2 * Math.PI))))
    : segments;

  for (let i = 0; i < activeSegments; i++) {
    const angle1 = startAngle + (deltaAngle * i) / activeSegments;
    const angle2 = startAngle + (deltaAngle * (i + 1)) / activeSegments;

    const p1 = {
      x: center.x + radius * Math.cos(angle1),
      y: center.y + radius * Math.sin(angle1),
    };
    const p2 = {
      x: center.x + radius * Math.cos(angle2),
      y: center.y + radius * Math.sin(angle2),
    };

    if (isDashed) {
      addDashedSegment(vertices, p1, p2, strokeColor);
    } else {
      vertices.push({ x: p1.x, y: p1.y, ...strokeColor });
      vertices.push({ x: p2.x, y: p2.y, ...strokeColor });
    }
  }

  return vertices;
}

export function convertPolylineEntity(
  entity: Entity,
  theme: 'dark' | 'light' = 'dark',
): Vertex[] {
  if (!entity.geometry?.points || !Array.isArray(entity.geometry.points)) return [];

  const strokeColor = getEntityStrokeColor(entity, theme);
  const points = entity.geometry.points;

  const vertices: Vertex[] = [];
  const isDashed = entity.linetype === 'dashed';

  const addLineSegment = (p1: any, p2: any) => {
    if (isDashed) {
      addDashedSegment(vertices, p1, p2, strokeColor);
    } else {
      vertices.push({ x: p1.x, y: p1.y, ...strokeColor });
      vertices.push({ x: p2.x, y: p2.y, ...strokeColor });
    }
  };

  for (let i = 0; i < points.length - 1; i++) {
    addLineSegment(points[i], points[i + 1]);
  }

  if (entity.geometry.closed && points.length > 1) {
    addLineSegment(points[points.length - 1], points[0]);
  }

  return vertices;
}

export function convertSplineEntity(
  entity: Entity,
  theme: 'dark' | 'light' = 'dark',
  segmentsPerSpline: number = 4,
): Vertex[] {
  const splinePoints = entity.geometry?.controlPoints || entity.geometry?.points;

  if (!splinePoints || !Array.isArray(splinePoints) || splinePoints.length < 2) {
    return [];
  }

  const strokeColor = getEntityStrokeColor(entity, theme);

  const vertices: Vertex[] = [];
  const isDashed = entity.linetype === 'dashed';

  const addSegment = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    if (isDashed) {
      addDashedSegment(vertices, p1, p2, strokeColor);
    } else {
      vertices.push({ x: p1.x, y: p1.y, ...strokeColor });
      vertices.push({ x: p2.x, y: p2.y, ...strokeColor });
    }
  };

  const MAX_CONTROL_POINTS = 100;
  const useSimpleRendering = splinePoints.length > MAX_CONTROL_POINTS;

  if (useSimpleRendering) {
    for (let i = 0; i < splinePoints.length - 1; i++) {
      addSegment(splinePoints[i], splinePoints[i + 1]);
    }
    if (entity.geometry.closed) {
      addSegment(splinePoints[splinePoints.length - 1], splinePoints[0]);
    }
    return vertices;
  }

  for (let i = 0; i < splinePoints.length - 1; i++) {
    const p0 = splinePoints[Math.max(0, i - 1)];
    const p1 = splinePoints[i];
    const p2 = splinePoints[i + 1];
    const p3 = splinePoints[Math.min(splinePoints.length - 1, i + 2)];

    for (let j = 0; j < segmentsPerSpline; j++) {
      const t = j / segmentsPerSpline;
      const tNext = (j + 1) / segmentsPerSpline;

      const x1 = 0.5 * (
        2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t * t +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t * t * t
      );

      const y1 = 0.5 * (
        2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t * t +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t * t * t
      );

      const x2 = 0.5 * (
        2 * p1.x +
        (-p0.x + p2.x) * tNext +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tNext * tNext +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * tNext * tNext * tNext
      );

      const y2 = 0.5 * (
        2 * p1.y +
        (-p0.y + p2.y) * tNext +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tNext * tNext +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * tNext * tNext * tNext
      );

      vertices.push({ x: x1, y: y1, ...strokeColor });
      vertices.push({ x: x2, y: y2, ...strokeColor });
    }
  }

  if (entity.geometry.closed && splinePoints.length > 1) {
    addSegment(splinePoints[splinePoints.length - 1], splinePoints[0]);
  }

  return vertices;
}

export function convertEllipseEntity(
  entity: Entity,
  theme: 'dark' | 'light' = 'dark',
  segments: number = 64,
): Vertex[] {
  if (!entity.geometry.center || (!entity.geometry.majorAxisEndPoint && !entity.geometry.majorAxis)) return [];

  const strokeColor = getEntityStrokeColor(entity, theme);

  const center = entity.geometry.center;
  const majorAxis = entity.geometry.majorAxisEndPoint || entity.geometry.majorAxis;
  const ratio = entity.geometry.ratio || entity.geometry.minorAxisRatio || 1.0;

  const mx = majorAxis.x;
  const my = majorAxis.y;

  const minX = -my * ratio;
  const minY = mx * ratio;

  const startParam = entity.geometry.startAngle || 0;
  const endParam = entity.geometry.endAngle !== undefined ? entity.geometry.endAngle : 2 * Math.PI;

  let deltaAngle = endParam - startParam;
  if (deltaAngle <= 0) deltaAngle += 2 * Math.PI;

  const vertices: Vertex[] = [];
  const isDashed = entity.linetype === 'dashed';

  const activeSegments = Math.max(8, Math.ceil(segments * (deltaAngle / (2 * Math.PI))));

  for (let i = 0; i < activeSegments; i++) {
    const t1 = startParam + (deltaAngle * i) / activeSegments;
    const t2 = startParam + (deltaAngle * (i + 1)) / activeSegments;

    const p1 = {
      x: center.x + mx * Math.cos(t1) + minX * Math.sin(t1),
      y: center.y + my * Math.cos(t1) + minY * Math.sin(t1),
    };
    const p2 = {
      x: center.x + mx * Math.cos(t2) + minX * Math.sin(t2),
      y: center.y + my * Math.cos(t2) + minY * Math.sin(t2),
    };

    if (isDashed) {
      addDashedSegment(vertices, p1, p2, strokeColor);
    } else {
      vertices.push({ x: p1.x, y: p1.y, ...strokeColor });
      vertices.push({ x: p2.x, y: p2.y, ...strokeColor });
    }
  }

  return vertices;
}
