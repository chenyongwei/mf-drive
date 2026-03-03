import { Vertex } from './WebGPUEngine';
import { getEntityStrokeColor } from './EntityToVertices.color';
import {
  calculateAdaptiveSegments,
  convertCircleEntity,
  convertEllipseEntity,
  convertLineEntity,
  convertPolylineEntity,
  convertSplineEntity,
  MIN_CIRCLE_SEGMENTS,
} from './EntityToVertices.shapes';
import { Entity, VertexConversionOptions } from './EntityToVertices.types';

export function convertEntityToVertices(
  entity: Entity,
  theme: 'dark' | 'light' = 'dark',
): Vertex[] {
  const entityType = (entity.type || '').toUpperCase();

  switch (entityType) {
    case 'LINE':
      return convertLineEntity(entity, theme);
    case 'CIRCLE':
    case 'ARC':
      return convertCircleEntity(entity, theme);
    case 'POLYLINE':
    case 'LWPOLYLINE':
      return convertPolylineEntity(entity, theme);
    case 'SPLINE':
      return convertSplineEntity(entity, theme);
    case 'ELLIPSE':
      return convertEllipseEntity(entity, theme);
    case 'SOLID':
    case '3DFACE':
    case 'TRACE':
    case 'FACE':
    case 'POINT':
    case 'TEXT':
    case 'MTEXT':
    case 'DIMENSION':
    case 'HATCH':
    case 'INSERT':
      return [];
    default:
      return [];
  }
}

export function convertEntitiesToTypedArray(
  entities: Entity[],
  theme: 'dark' | 'light' = 'dark',
  options?: VertexConversionOptions,
): Float32Array {
  let totalVertexCount = 0;
  for (const entity of entities) {
    const type = (entity.type || '').toUpperCase();
    switch (type) {
      case 'LINE':
        if (entity.geometry?.start && entity.geometry?.end) totalVertexCount += 2;
        break;
      case 'CIRCLE':
      case 'ARC': {
        if (entity.geometry?.center && entity.geometry?.radius) {
          const r = entity.geometry.radius;
          const segs = calculateAdaptiveSegments(r, options?.detailScale);
          totalVertexCount += segs * 2;
        }
        break;
      }
      case 'POLYLINE':
      case 'LWPOLYLINE':
        if (entity.geometry?.points) {
          const count = entity.geometry.points.length;
          if (count > 0) {
            totalVertexCount += (count - 1) * 2;
            if (entity.geometry.closed) totalVertexCount += 2;
          }
        }
        break;
      case 'SPLINE': {
        const sp = entity.geometry?.controlPoints || entity.geometry?.points;
        if (sp && sp.length >= 2) {
          totalVertexCount += (sp.length - 1) * 2;
          if (entity.geometry.closed) totalVertexCount += 2;
        }
        break;
      }
      case 'ELLIPSE':
        totalVertexCount += 128;
        break;
    }
  }

  const data = new Float32Array(totalVertexCount * 6);
  let offset = 0;

  for (const entity of entities) {
    const type = (entity.type || '').toUpperCase();
    const c = getEntityStrokeColor(entity, theme);

    switch (type) {
      case 'LINE': {
        const geo = entity.geometry;
        if (geo?.start && geo?.end) {
          offset = writeV(data, offset, geo.start.x, geo.start.y, c);
          offset = writeV(data, offset, geo.end.x, geo.end.y, c);
        }
        break;
      }
      case 'CIRCLE':
      case 'ARC': {
        const geo = entity.geometry;
        if (geo?.center && geo?.radius) {
          const cen = geo.center;
          const r = geo.radius;
          const isArc = type === 'ARC';
          const startAngle = geo.startAngle ?? 0;
          const endAngle = geo.endAngle ?? 2 * Math.PI;

          let deltaAngle = endAngle - startAngle;
          if (isArc && deltaAngle <= 0) {
            deltaAngle += 2 * Math.PI;
          }
          if (!isArc) {
            deltaAngle = 2 * Math.PI;
          }

          const baseSegs = calculateAdaptiveSegments(r, options?.detailScale);
          const segs = isArc
            ? Math.max(MIN_CIRCLE_SEGMENTS, Math.ceil(baseSegs * (deltaAngle / (2 * Math.PI))))
            : baseSegs;

          for (let i = 0; i < segs; i++) {
            const a1 = startAngle + (deltaAngle * i) / segs;
            const a2 = startAngle + (deltaAngle * (i + 1)) / segs;
            offset = writeV(data, offset, cen.x + r * Math.cos(a1), cen.y + r * Math.sin(a1), c);
            offset = writeV(data, offset, cen.x + r * Math.cos(a2), cen.y + r * Math.sin(a2), c);
          }
        }
        break;
      }
      case 'POLYLINE':
      case 'LWPOLYLINE': {
        const pts = entity.geometry?.points;
        if (pts && pts.length > 1) {
          for (let i = 0; i < pts.length - 1; i++) {
            offset = writeV(data, offset, pts[i].x, pts[i].y, c);
            offset = writeV(data, offset, pts[i + 1].x, pts[i + 1].y, c);
          }
          if (entity.geometry.closed) {
            offset = writeV(data, offset, pts[pts.length - 1].x, pts[pts.length - 1].y, c);
            offset = writeV(data, offset, pts[0].x, pts[0].y, c);
          }
        }
        break;
      }
      case 'SPLINE': {
        const splinePoints = entity.geometry?.controlPoints || entity.geometry?.points;
        if (splinePoints && splinePoints.length >= 2) {
          for (let i = 0; i < splinePoints.length - 1; i++) {
            offset = writeV(data, offset, splinePoints[i].x, splinePoints[i].y, c);
            offset = writeV(data, offset, splinePoints[i + 1].x, splinePoints[i + 1].y, c);
          }
          if (entity.geometry.closed && splinePoints.length > 1) {
            offset = writeV(data, offset, splinePoints[splinePoints.length - 1].x, splinePoints[splinePoints.length - 1].y, c);
            offset = writeV(data, offset, splinePoints[0].x, splinePoints[0].y, c);
          }
        }
        break;
      }
      case 'ELLIPSE': {
        const geo = entity.geometry;
        if (geo?.center && (geo?.majorAxisEndPoint || geo?.majorAxis)) {
          const center = geo.center;
          const majorAxis = geo.majorAxisEndPoint || geo.majorAxis;
          const ratio = geo.ratio || geo.minorAxisRatio || 1.0;
          const mx = majorAxis.x;
          const my = majorAxis.y;
          const minX = -my * ratio;
          const minY = mx * ratio;
          const startParam = geo.startAngle || 0;
          const endParam = geo.endAngle !== undefined ? geo.endAngle : 2 * Math.PI;
          let deltaAngle = endParam - startParam;
          if (deltaAngle <= 0) deltaAngle += 2 * Math.PI;
          const segs = 64;
          for (let i = 0; i < segs; i++) {
            const t1 = startParam + (deltaAngle * i) / segs;
            const t2 = startParam + (deltaAngle * (i + 1)) / segs;
            const x1 = center.x + mx * Math.cos(t1) + minX * Math.sin(t1);
            const y1 = center.y + my * Math.cos(t1) + minY * Math.sin(t1);
            const x2 = center.x + mx * Math.cos(t2) + minX * Math.sin(t2);
            const y2 = center.y + my * Math.cos(t2) + minY * Math.sin(t2);
            offset = writeV(data, offset, x1, y1, c);
            offset = writeV(data, offset, x2, y2, c);
          }
        }
        break;
      }
    }
  }

  return offset === data.length ? data : data.subarray(0, offset);
}

export function convertEntitiesToVertices(
  entities: Entity[],
  theme: 'dark' | 'light' = 'dark',
): Vertex[] {
  const allVertices: Vertex[] = [];

  for (const entity of entities) {
    const vertices = convertEntityToVertices(entity, theme);
    allVertices.push(...vertices);
  }

  return allVertices;
}

function writeV(
  data: Float32Array,
  offset: number,
  x: number,
  y: number,
  c: { r: number; g: number; b: number; a: number },
): number {
  data[offset + 0] = x;
  data[offset + 1] = y;
  data[offset + 2] = c.r;
  data[offset + 3] = c.g;
  data[offset + 4] = c.b;
  data[offset + 5] = c.a;
  return offset + 6;
}
