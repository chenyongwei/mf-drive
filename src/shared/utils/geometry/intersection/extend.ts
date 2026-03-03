import type { Point } from '../../../types';

import { getLineCircleIntersection } from './circles';
import { getLineIntersection } from './lines';
import type { Circle, LineSegment } from './types';

export function extendLineToBoundary(
  line: LineSegment,
  boundary:
    | { type: 'LINE'; geometry: LineSegment }
    | { type: 'CIRCLE' | 'ARC'; geometry: Circle },
  extendFromStart: boolean
): Point | null {
  const origin = extendFromStart ? line.start : line.end;
  const other = extendFromStart ? line.end : line.start;

  const dx = origin.x - other.x;
  const dy = origin.y - other.y;

  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return null;

  const dirX = dx / length;
  const dirY = dy / length;

  const extendedLine: LineSegment = {
    start: origin,
    end: {
      x: origin.x + dirX * 100000,
      y: origin.y + dirY * 100000,
    },
  };

  if (boundary.type === 'LINE') {
    return getLineIntersection(extendedLine, boundary.geometry);
  }

  const intersections = getLineCircleIntersection(extendedLine, boundary.geometry);
  if (intersections.length > 0) {
    return intersections[0];
  }

  return null;
}
