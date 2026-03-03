import type { Entity } from '../../../../lib/webgpu/EntityToVertices';

export interface Point2D {
  x: number;
  y: number;
}

export const TWO_PI = 2 * Math.PI;
const ELLIPSE_BASE_SEGMENTS = 96;

export function normalizeType(entity: Entity): string {
  return (entity.type || '').toUpperCase();
}

function normalizeAngle(angle: number): number {
  let normalized = angle % TWO_PI;
  if (normalized < 0) normalized += TWO_PI;
  return normalized;
}

export function distanceToSegment(
  worldX: number,
  worldY: number,
  start: Point2D,
  end: Point2D
): number {
  const l2 = Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2);
  if (l2 === 0) {
    return Math.hypot(worldX - start.x, worldY - start.y);
  }
  const t = Math.max(
    0,
    Math.min(
      1,
      ((worldX - start.x) * (end.x - start.x) +
        (worldY - start.y) * (end.y - start.y)) /
        l2
    )
  );
  const projX = start.x + t * (end.x - start.x);
  const projY = start.y + t * (end.y - start.y);
  return Math.hypot(worldX - projX, worldY - projY);
}

export function distanceToPolyline(
  worldX: number,
  worldY: number,
  points: Point2D[],
  closed: boolean
): number {
  if (!points || points.length < 2) return Infinity;

  let minDist = Infinity;
  for (let i = 0; i < points.length - 1; i += 1) {
    const dist = distanceToSegment(worldX, worldY, points[i], points[i + 1]);
    if (dist < minDist) minDist = dist;
  }

  if (closed) {
    const dist = distanceToSegment(
      worldX,
      worldY,
      points[points.length - 1],
      points[0]
    );
    if (dist < minDist) minDist = dist;
  }

  return minDist;
}

function distanceToAxisAlignedBBox(
  x: number,
  y: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): number {
  const dx = x < minX ? minX - x : x > maxX ? x - maxX : 0;
  const dy = y < minY ? minY - y : y > maxY ? y - maxY : 0;
  if (dx === 0 && dy === 0) {
    return 0;
  }
  return Math.hypot(dx, dy);
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toPointRecord(value: unknown): { x?: unknown; y?: unknown } | null {
  if (value === null || typeof value !== 'object') {
    return null;
  }
  return value as { x?: unknown; y?: unknown };
}

function toPoint(value: unknown): Point2D | null {
  const candidate = toPointRecord(value);
  if (!candidate) {
    return null;
  }
  const x = toFiniteNumber(candidate.x, Number.NaN);
  const y = toFiniteNumber(candidate.y, Number.NaN);
  if (Number.isNaN(x) || Number.isNaN(y)) {
    return null;
  }
  return { x, y };
}

function worldToLocalPoint(
  worldX: number,
  worldY: number,
  anchor: Point2D,
  rotation: number
): Point2D {
  const dx = worldX - anchor.x;
  const dy = worldY - anchor.y;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: dx * cos + dy * sin,
    y: -dx * sin + dy * cos,
  };
}

export function distanceToTextEntity(
  worldX: number,
  worldY: number,
  entity: Entity
): number {
  const geo = entity.geometry;
  if (!geo || !geo.position) {
    return Infinity;
  }

  const anchor = toPoint(geo.position);
  if (!anchor) {
    return Infinity;
  }

  const attrs =
    entity.attributes && typeof entity.attributes === 'object'
      ? (entity.attributes as Record<string, unknown>)
      : null;
  const textData =
    attrs?.textData && typeof attrs.textData === 'object'
      ? (attrs.textData as Record<string, unknown>)
      : null;
  const textRender =
    attrs?.textRender && typeof attrs.textRender === 'object'
      ? (attrs.textRender as Record<string, unknown>)
      : null;

  const rotation = toFiniteNumber(textData?.rotation ?? geo.rotation, 0);
  const localPoint = worldToLocalPoint(worldX, worldY, anchor, rotation);

  const localBBox =
    textRender?.localBBox && typeof textRender.localBBox === 'object'
      ? (textRender.localBBox as Record<string, unknown>)
      : null;
  const hasLocalBBox =
    localBBox &&
    Number.isFinite(Number(localBBox.minX)) &&
    Number.isFinite(Number(localBBox.minY)) &&
    Number.isFinite(Number(localBBox.maxX)) &&
    Number.isFinite(Number(localBBox.maxY));

  const bboxDistance = hasLocalBBox
    ? distanceToAxisAlignedBBox(
        localPoint.x,
        localPoint.y,
        Number(localBBox!.minX),
        Number(localBBox!.minY),
        Number(localBBox!.maxX),
        Number(localBBox!.maxY)
      )
    : (() => {
        const text = String(geo.text ?? '');
        const height = toFiniteNumber(geo.height, 1);
        const width = Math.max(height * 0.6, text.length * height * 0.6);
        return distanceToAxisAlignedBBox(
          localPoint.x,
          localPoint.y,
          0,
          -height,
          width,
          0
        );
      })();

  const renderPaths = Array.isArray(textRender?.paths) ? textRender.paths : [];
  let pathDistance = Infinity;
  renderPaths.forEach((path) => {
    if (!path || typeof path !== 'object') {
      return;
    }
    const pointList = Array.isArray((path as { points?: unknown[] }).points)
      ? ((path as { points?: unknown[] }).points ?? [])
          .map((point) => toPoint(point))
          .filter((point): point is Point2D => Boolean(point))
      : [];
    if (pointList.length >= 2) {
      pathDistance = Math.min(
        pathDistance,
        distanceToPolyline(localPoint.x, localPoint.y, pointList, false)
      );
    } else if (pointList.length === 1) {
      pathDistance = Math.min(
        pathDistance,
        Math.hypot(localPoint.x - pointList[0].x, localPoint.y - pointList[0].y)
      );
    }
  });

  return Math.min(pathDistance, bboxDistance);
}

export function isAngleWithinArc(
  angle: number,
  startAngle: number,
  endAngle: number
): boolean {
  const normalizedAngle = normalizeAngle(angle);
  const normalizedStart = normalizeAngle(startAngle);
  const normalizedEnd = normalizeAngle(endAngle);

  if (normalizedStart > normalizedEnd) {
    return normalizedAngle >= normalizedStart || normalizedAngle <= normalizedEnd;
  }
  return normalizedAngle >= normalizedStart && normalizedAngle <= normalizedEnd;
}

export function buildEllipseApproximation(
  geo: any
): { points: Point2D[]; isClosed: boolean } | null {
  const center = geo.center;
  const majorAxis = geo.majorAxisEndPoint || geo.majorAxis;
  if (!center || !majorAxis) return null;

  const ratio = geo.ratio || geo.minorAxisRatio || 1;
  const startAngle = geo.startAngle ?? 0;
  const rawEndAngle = geo.endAngle ?? TWO_PI;

  let deltaAngle = rawEndAngle - startAngle;
  if (deltaAngle <= 0) {
    deltaAngle += TWO_PI;
  }

  const isClosed = Math.abs(deltaAngle - TWO_PI) < 0.001;
  const segmentCount = Math.max(
    24,
    Math.ceil(ELLIPSE_BASE_SEGMENTS * (deltaAngle / TWO_PI))
  );

  const mx = majorAxis.x;
  const my = majorAxis.y;
  const minX = -my * ratio;
  const minY = mx * ratio;

  const points: Point2D[] = [];
  for (let i = 0; i <= segmentCount; i += 1) {
    const t = startAngle + (deltaAngle * i) / segmentCount;
    points.push({
      x: center.x + mx * Math.cos(t) + minX * Math.sin(t),
      y: center.y + my * Math.cos(t) + minY * Math.sin(t),
    });
  }

  return { points, isClosed };
}
