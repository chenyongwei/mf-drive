import type { BoundingBox, Point } from '../../../types';

import type { Circle, LineSegment } from './types';

export function createBBox(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): BoundingBox {
  return { minX, minY, maxX, maxY };
}

export function bboxFromPoint(point: Point): BoundingBox {
  return {
    minX: point.x,
    minY: point.y,
    maxX: point.x,
    maxY: point.y,
  };
}

export function bboxFromPoints(points: Point[]): BoundingBox {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;

  for (let index = 1; index < points.length; index += 1) {
    minX = Math.min(minX, points[index].x);
    minY = Math.min(minY, points[index].y);
    maxX = Math.max(maxX, points[index].x);
    maxY = Math.max(maxY, points[index].y);
  }

  return { minX, minY, maxX, maxY };
}

export function bboxFromLine(line: LineSegment): BoundingBox {
  return {
    minX: Math.min(line.start.x, line.end.x),
    minY: Math.min(line.start.y, line.end.y),
    maxX: Math.max(line.start.x, line.end.x),
    maxY: Math.max(line.start.y, line.end.y),
  };
}

export function bboxFromCircle(circle: Circle): BoundingBox {
  return {
    minX: circle.center.x - circle.radius,
    minY: circle.center.y - circle.radius,
    maxX: circle.center.x + circle.radius,
    maxY: circle.center.y + circle.radius,
  };
}

export function bboxFromArc(
  center: Point,
  radius: number,
  startAngle: number,
  endAngle: number
): BoundingBox {
  let minX = center.x - radius;
  let minY = center.y - radius;
  let maxX = center.x + radius;
  let maxY = center.y + radius;

  const endpoints = [
    {
      x: center.x + radius * Math.cos(startAngle),
      y: center.y + radius * Math.sin(startAngle),
    },
    {
      x: center.x + radius * Math.cos(endAngle),
      y: center.y + radius * Math.sin(endAngle),
    },
  ];

  endpoints.forEach((point) => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  const normalizeAngle = (angle: number) => {
    let normalized = angle;
    while (normalized < 0) normalized += 2 * Math.PI;
    while (normalized >= 2 * Math.PI) normalized -= 2 * Math.PI;
    return normalized;
  };

  const start = normalizeAngle(startAngle);
  const end = normalizeAngle(endAngle);

  const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  angles.forEach((angle) => {
    const inArc = start < end ? angle >= start && angle <= end : angle >= start || angle <= end;

    if (inArc) {
      const point = {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      };
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  });

  return { minX, minY, maxX, maxY };
}
