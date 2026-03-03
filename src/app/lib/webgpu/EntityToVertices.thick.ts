import { Vertex } from './WebGPUEngine';
import { calculateAdaptiveSegments, MIN_CIRCLE_SEGMENTS } from './EntityToVertices.shapes';
import { Entity } from './EntityToVertices.types';

export function convertToThickVertices(
  entities: Entity[],
  theme: 'dark' | 'light' = 'dark',
  zoom: number = 1.0,
): Vertex[] {
  const allVertices: Vertex[] = [];

  for (const entity of entities) {
    const isSelected = !!entity.isSelected;
    const isHovered = !!entity.isHovered;
    if (!isSelected && !isHovered) continue;

    const thickness = (isHovered ? 1.5 : 0.5) / zoom;

    const color = isSelected
      ? { r: 74 / 255, g: 158 / 255, b: 1, a: 1 }
      : theme === 'light'
        ? { r: 1, g: 0.0, b: 0.0, a: 1 }
        : { r: 1, g: 1.0, b: 0.0, a: 1 };

    const entityType = (entity.type || '').toUpperCase();
    if (entityType === 'LINE' && entity.geometry?.start && entity.geometry?.end) {
      allVertices.push(...generateThickLine(entity.geometry.start, entity.geometry.end, thickness, color));
      continue;
    }

    if ((entityType === 'POLYLINE' || entityType === 'LWPOLYLINE') && entity.geometry?.points) {
      const points = entity.geometry.points;
      for (let i = 0; i < points.length - 1; i++) {
        allVertices.push(...generateThickLine(points[i], points[i + 1], thickness, color));
      }
      if (entity.geometry.closed && points.length > 1) {
        allVertices.push(...generateThickLine(points[points.length - 1], points[0], thickness, color));
      }
      continue;
    }

    if ((entityType === 'ARC' || entityType === 'CIRCLE') && entity.geometry?.center && typeof entity.geometry?.radius === 'number') {
      const { center, radius } = entity.geometry;
      const startAngle = entityType === 'ARC' ? entity.geometry.startAngle ?? 0 : 0;
      const endAngle = entityType === 'ARC' ? entity.geometry.endAngle ?? 2 * Math.PI : 2 * Math.PI;

      let deltaAngle = endAngle - startAngle;
      if (entityType === 'ARC' && deltaAngle <= 0) {
        deltaAngle += 2 * Math.PI;
      } else if (entityType === 'CIRCLE') {
        deltaAngle = 2 * Math.PI;
      }

      const baseSegments = calculateAdaptiveSegments(radius);
      const segments = Math.max(MIN_CIRCLE_SEGMENTS, Math.ceil((baseSegments * deltaAngle) / (2 * Math.PI)));

      allVertices.push(...generateThickArc(center, radius, startAngle, deltaAngle, segments, thickness, color));
    }
  }

  return allVertices;
}

function generateThickLine(
  p1: any,
  p2: any,
  thickness: number,
  color: { r: number; g: number; b: number; a: number },
): Vertex[] {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return [];

  const nx = (dx / length) * thickness;
  const ny = (dy / length) * thickness;

  const px = -ny;
  const py = nx;

  const v1 = { x: p1.x - px, y: p1.y - py, ...color };
  const v2 = { x: p1.x + px, y: p1.y + py, ...color };
  const v3 = { x: p2.x + px, y: p2.y + py, ...color };
  const v4 = { x: p2.x - px, y: p2.y - py, ...color };

  return [v1, v2, v3, v1, v3, v4];
}

function generateThickArc(
  center: { x: number; y: number },
  radius: number,
  startAngle: number,
  deltaAngle: number,
  segments: number,
  thickness: number,
  color: { r: number; g: number; b: number; a: number },
): Vertex[] {
  if (radius <= 0 || segments <= 0 || deltaAngle === 0) {
    return [];
  }

  const vertices: Vertex[] = [];

  for (let i = 0; i < segments; i++) {
    const angle1 = startAngle + (deltaAngle * i) / segments;
    const angle2 = startAngle + (deltaAngle * (i + 1)) / segments;

    const p1 = {
      x: center.x + Math.cos(angle1) * radius,
      y: center.y + Math.sin(angle1) * radius,
    };
    const p2 = {
      x: center.x + Math.cos(angle2) * radius,
      y: center.y + Math.sin(angle2) * radius,
    };

    vertices.push(...generateThickLine(p1, p2, thickness, color));
  }

  return vertices;
}
