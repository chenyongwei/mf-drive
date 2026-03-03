import type { Point } from '../../../types';

export interface Translation {
  dx: number;
  dy: number;
}

export interface Scale {
  sx: number;
  sy: number;
}

export interface Rotation {
  angle: number;
  origin?: Point;
}

export interface Shear {
  kx: number;
  ky: number;
  origin?: Point;
}

export type Transformation =
  | { type: 'translate'; translation: Translation }
  | { type: 'scale'; scale: Scale; origin?: Point }
  | { type: 'rotate'; rotation: Rotation }
  | { type: 'mirror'; lineStart: Point; lineEnd: Point }
  | { type: 'shear'; shear: Shear };
