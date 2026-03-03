import type { Point } from '../types/NestingTypes';

export interface AlignmentGuide {
  type: 'horizontal' | 'vertical' | 'distance';
  position: number;
  startPoint: Point;
  endPoint: Point;
  distance?: number;
  strength?: 'strong' | 'weak';
  targetPartId?: string;
}

export interface AlignmentGuideOptions {
  showDistance?: boolean;
  maxDistance?: number;
  stickyTargetPartId?: string | null;
  stickyDistanceMargin?: number;
}
