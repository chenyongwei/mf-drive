import { Vertex } from './WebGPUEngine';
import { parseColor } from './EntityToVertices.color';
import { Entity } from './EntityToVertices.types';

export function generatePartFill(
  entities: Entity[],
  partColor: string,
  theme: 'dark' | 'light' = 'dark',
): Vertex[] {
  const color = parseColor(partColor, theme);
  const allVertices: Vertex[] = [];

  entities.forEach((entity) => {
    const entityType = (entity.type || '').toUpperCase();
    if (entityType === 'POLYLINE' || entityType === 'LWPOLYLINE') {
      const points = entity.geometry?.points;
      if (points && points.length >= 3 && entity.geometry?.closed) {
        allVertices.push(...generatePolygonFill(points, color));
      }
      return;
    }

    if (entityType === 'CIRCLE') {
      const center = entity.geometry?.center;
      const radius = entity.geometry?.radius;
      if (center && radius) {
        const points = [];
        for (let i = 0; i < 32; i++) {
          const angle = (i / 32) * Math.PI * 2;
          points.push({
            x: center.x + Math.cos(angle) * radius,
            y: center.y + Math.sin(angle) * radius,
          });
        }
        allVertices.push(...generatePolygonFill(points, color));
      }
    }
  });

  return allVertices;
}

function generatePolygonFill(
  points: any[],
  color: { r: number; g: number; b: number; a: number },
): Vertex[] {
  if (points.length < 3) return [];
  const vertices: Vertex[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    vertices.push({ x: points[0].x, y: points[0].y, ...color });
    vertices.push({ x: points[i].x, y: points[i].y, ...color });
    vertices.push({ x: points[i + 1].x, y: points[i + 1].y, ...color });
  }
  return vertices;
}
