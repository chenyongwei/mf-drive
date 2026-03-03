import type { Point } from '../../../types';

import { lineDirection } from '../angle';

import { rotatePoints, rotatePoint, scalePoint, shearPoint, translatePoint } from './basic';
import { reflectPointAcrossLine } from './reflection';
import type { Transformation } from './types';

export function transformPoint(
  point: Point,
  transformations: Transformation[]
): Point {
  let result = point;

  for (const transform of transformations) {
    switch (transform.type) {
      case 'translate':
        result = translatePoint(result, transform.translation);
        break;
      case 'scale':
        result = scalePoint(result, transform.scale, transform.origin);
        break;
      case 'rotate':
        result = rotatePoint(result, transform.rotation);
        break;
      case 'mirror':
        result = reflectPointAcrossLine(result, transform.lineStart, transform.lineEnd);
        break;
      case 'shear':
        result = shearPoint(result, transform.shear);
        break;
    }
  }

  return result;
}

export function transformPoints(
  points: Point[],
  transformations: Transformation[]
): Point[] {
  return points.map((point) => transformPoint(point, transformations));
}

export function alignPointsToAngle(points: Point[], targetAngle: number): Point[] {
  if (points.length < 2) {
    return points;
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  const currentAngle = lineDirection(firstPoint, lastPoint);
  const rotationAngle = targetAngle - currentAngle;

  return rotatePoints(points, { angle: rotationAngle, origin: firstPoint });
}

export function createTransformMatrix(
  transformations: Transformation[]
): number[] {
  let matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  const multiply = (a: number[], b: number[]): number[] => {
    return [
      a[0] * b[0] + a[3] * b[1] + a[6] * b[2],
      a[1] * b[0] + a[4] * b[1] + a[7] * b[2],
      a[2] * b[0] + a[5] * b[1] + a[8] * b[2],
      a[0] * b[3] + a[3] * b[4] + a[6] * b[5],
      a[1] * b[3] + a[4] * b[4] + a[7] * b[5],
      a[2] * b[3] + a[5] * b[4] + a[8] * b[5],
      a[0] * b[6] + a[3] * b[7] + a[6] * b[8],
      a[1] * b[6] + a[4] * b[7] + a[7] * b[8],
      a[2] * b[6] + a[5] * b[7] + a[8] * b[8],
    ];
  };

  for (const transform of transformations) {
    let m: number[] = [];

    switch (transform.type) {
      case 'translate':
        m = [1, 0, 0, 0, 1, 0, transform.translation.dx, transform.translation.dy, 1];
        break;
      case 'scale': {
        const origin = transform.origin || { x: 0, y: 0 };
        const toOrigin = [1, 0, 0, 0, 1, 0, -origin.x, -origin.y, 1];
        const scaleMat = [transform.scale.sx, 0, 0, 0, transform.scale.sy, 0, 0, 0, 1];
        const fromOrigin = [1, 0, 0, 0, 1, 0, origin.x, origin.y, 1];
        m = multiply(multiply(fromOrigin, scaleMat), toOrigin);
        break;
      }
      case 'rotate': {
        const origin = transform.rotation.origin || { x: 0, y: 0 };
        const cos = Math.cos(transform.rotation.angle);
        const sin = Math.sin(transform.rotation.angle);
        const toOrigin = [1, 0, 0, 0, 1, 0, -origin.x, -origin.y, 1];
        const rotateMat = [cos, sin, 0, -sin, cos, 0, 0, 0, 1];
        const fromOrigin = [1, 0, 0, 0, 1, 0, origin.x, origin.y, 1];
        m = multiply(multiply(fromOrigin, rotateMat), toOrigin);
        break;
      }
      case 'mirror': {
        const dx = transform.lineEnd.x - transform.lineStart.x;
        const dy = transform.lineEnd.y - transform.lineStart.y;
        const lenSq = dx * dx + dy * dy;
        const a = (dx * dx - dy * dy) / lenSq;
        const b = (2 * dx * dy) / lenSq;
        const x2 = transform.lineStart.x;
        const y2 = transform.lineStart.y;

        m = [
          a,
          b,
          0,
          b,
          -a,
          0,
          x2 * (1 - a) - b * y2,
          y2 * (1 + a) - b * x2,
          1,
        ];
        break;
      }
      case 'shear': {
        const origin = transform.shear.origin || { x: 0, y: 0 };
        const toOrigin = [1, 0, 0, 0, 1, 0, -origin.x, -origin.y, 1];
        const shearMat = [1, transform.shear.ky, 0, transform.shear.kx, 1, 0, 0, 0, 1];
        const fromOrigin = [1, 0, 0, 0, 1, 0, origin.x, origin.y, 1];
        m = multiply(multiply(fromOrigin, shearMat), toOrigin);
        break;
      }
    }

    matrix = multiply(matrix, m);
  }

  return matrix;
}
