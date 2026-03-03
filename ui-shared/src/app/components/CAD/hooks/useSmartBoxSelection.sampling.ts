import {
  ARC_SEGMENTS_PER_TURN,
  TWO_PI,
  type Point2D,
} from "./useSmartBoxSelection.types";

export function sampleCircleArcScreenPoints(
  center: { x: number; y: number },
  radius: number,
  startAngle: number,
  endAngle: number,
  worldToScreen: (worldX: number, worldY: number) => Point2D,
): Point2D[] {
  if (!Number.isFinite(radius) || radius <= 0) {
    return [];
  }
  if (!Number.isFinite(startAngle) || !Number.isFinite(endAngle)) {
    return [];
  }
  if (!Number.isFinite(center.x) || !Number.isFinite(center.y)) {
    return [];
  }

  let delta = endAngle - startAngle;
  if (delta <= 0) {
    delta += TWO_PI;
  }

  const isFull = Math.abs(delta - TWO_PI) < 1e-6;
  const segments = Math.max(
    16,
    Math.ceil(ARC_SEGMENTS_PER_TURN * (isFull ? 1 : delta / TWO_PI)),
  );

  const points: Point2D[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = startAngle + (delta * i) / segments;
    const x = center.x + radius * Math.cos(t);
    const y = center.y + radius * Math.sin(t);
    points.push(worldToScreen(x, y));
  }
  return points;
}

export function sampleEllipseScreenPoints(
  geo: any,
  worldToScreen: (worldX: number, worldY: number) => Point2D,
): { points: Point2D[]; closed: boolean } | null {
  const center = geo?.center;
  const majorAxis = geo?.majorAxisEndPoint || geo?.majorAxis;
  if (!center || !majorAxis) {
    return null;
  }
  if (
    !Number.isFinite(center.x) ||
    !Number.isFinite(center.y) ||
    !Number.isFinite(majorAxis.x) ||
    !Number.isFinite(majorAxis.y)
  ) {
    return null;
  }

  const ratioRaw = Number(geo?.ratio ?? geo?.minorAxisRatio ?? 1);
  const ratio = Number.isFinite(ratioRaw) ? ratioRaw : 1;
  const startAngle = Number(geo?.startAngle ?? 0);
  const endAngle = Number(geo?.endAngle ?? TWO_PI);
  if (!Number.isFinite(startAngle) || !Number.isFinite(endAngle)) {
    return null;
  }

  let delta = endAngle - startAngle;
  if (delta <= 0) {
    delta += TWO_PI;
  }
  const closed = Math.abs(delta - TWO_PI) < 1e-6;
  const segments = Math.max(
    24,
    Math.ceil(ARC_SEGMENTS_PER_TURN * (closed ? 1 : delta / TWO_PI)),
  );

  const mx = majorAxis.x;
  const my = majorAxis.y;
  const minorX = -my * ratio;
  const minorY = mx * ratio;

  const points: Point2D[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = startAngle + (delta * i) / segments;
    const x = center.x + mx * Math.cos(t) + minorX * Math.sin(t);
    const y = center.y + my * Math.cos(t) + minorY * Math.sin(t);
    points.push(worldToScreen(x, y));
  }

  return { points, closed };
}
