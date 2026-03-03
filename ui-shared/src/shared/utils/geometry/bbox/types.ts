import type { Point } from '../../../types';

export interface LineSegment {
  start: Point;
  end: Point;
}

export interface Circle {
  center: Point;
  radius: number;
}
