import { Point } from './PartFillGenerator.types';

export function triangulatePolygon(points: Point[]): number[] {
  if (points.length < 3) {
    return [];
  }

  if (points.length === 3) {
    return [0, 1, 2];
  }

  let workingPoints = [...points];
  let windingSum = 0;
  const n = workingPoints.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    windingSum += (workingPoints[j].x - workingPoints[i].x) * (workingPoints[j].y + workingPoints[i].y);
  }

  if (windingSum > 0) {
    workingPoints = workingPoints.reverse();
  }

  const indices = workingPoints.map((_, i) => i);
  const triangles: number[] = [];
  const maxIterations = n * n;
  let iteration = 0;

  while (indices.length > 3 && iteration < maxIterations) {
    iteration++;
    let earFound = false;

    for (let i = 0; i < indices.length; i++) {
      const prevIdx = (i - 1 + indices.length) % indices.length;
      const nextIdx = (i + 1) % indices.length;

      const prev = indices[prevIdx];
      const curr = indices[i];
      const next = indices[nextIdx];

      const prevPoint = workingPoints[prev];
      const currPoint = workingPoints[curr];
      const nextPoint = workingPoints[next];

      if (!isEar(prevPoint, currPoint, nextPoint, workingPoints, indices)) {
        continue;
      }

      triangles.push(prev, curr, next);
      indices.splice(i, 1);
      earFound = true;
      break;
    }

    if (!earFound && indices.length >= 3) {
      triangles.push(indices[0], indices[1], indices[2]);
      indices.splice(1, 1);
    }
  }

  if (indices.length === 3) {
    triangles.push(indices[0], indices[1], indices[2]);
  }

  if (windingSum > 0) {
    return triangles.map(idx => n - 1 - idx);
  }

  return triangles;
}

function isEar(
  prev: Point,
  curr: Point,
  next: Point,
  points: Point[],
  remainingIndices: number[],
): boolean {
  const v1x = prev.x - curr.x;
  const v1y = prev.y - curr.y;
  const v2x = next.x - curr.x;
  const v2y = next.y - curr.y;
  const crossProduct = v1x * v2y - v1y * v2x;

  if (crossProduct <= 0) {
    return false;
  }

  for (const idx of remainingIndices) {
    const point = points[idx];
    if (point === prev || point === curr || point === next) {
      continue;
    }

    if (pointInTriangle(point, prev, curr, next)) {
      return false;
    }
  }

  return true;
}

function pointInTriangle(point: Point, a: Point, b: Point, c: Point): boolean {
  const denominator = ((b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y));

  const ua = ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) / denominator;
  const ub = ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) / denominator;
  const uc = 1 - ua - ub;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1 && uc >= 0 && uc <= 1;
}
