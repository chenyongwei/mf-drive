import { Vertex } from './WebGPUEngine';
import { getChannelColor } from './PartFillGenerator.colors';
import { chainEntities } from './PartFillGenerator.chain';
import { calculatePolygonArea } from './PartFillGenerator.geometry';
import { triangulatePolygon } from './PartFillGenerator.triangulation';
import { pointInPolygon } from '../../utils/geometryUtils';
import {
  ChannelType,
  Contour,
  PartFillData,
  Point,
} from './PartFillGenerator.types';

export function generatePartFill(
  outerContour: Contour,
  innerContours: Contour[] = [],
  channel: ChannelType = ChannelType.CHANNEL_1,
): Vertex[] {
  const color = getChannelColor(channel);
  const vertices: Vertex[] = [];

  if (!outerContour.closed || outerContour.points.length < 3) {
    return vertices;
  }

  const outerTriangles = triangulatePolygon(outerContour.points);

  for (let i = 0; i < outerTriangles.length; i += 3) {
    const p1 = outerContour.points[outerTriangles[i]];
    const p2 = outerContour.points[outerTriangles[i + 1]];
    const p3 = outerContour.points[outerTriangles[i + 2]];

    const centroid = {
      x: (p1.x + p2.x + p3.x) / 3,
      y: (p1.y + p2.y + p3.y) / 3,
    };

    let isInHole = false;
    for (const hole of innerContours) {
      if (hole.closed && pointInPolygon(centroid, hole.points)) {
        isInHole = true;
        break;
      }
    }

    if (!isInHole) {
      vertices.push({ x: p1.x, y: p1.y, ...color });
      vertices.push({ x: p2.x, y: p2.y, ...color });
      vertices.push({ x: p3.x, y: p3.y, ...color });
    }
  }

  return vertices;
}

export function generatePartFillFromEntities(
  entities: any[],
  partColor: string,
  position?: { x: number; y: number },
  rotation?: number,
): PartFillData {
  let color = { r: 1.0, g: 1.0, b: 1.0, a: 0.6 };

  if (partColor.startsWith('#')) {
    const r = parseInt(partColor.slice(1, 3), 16) / 255;
    const g = parseInt(partColor.slice(3, 5), 16) / 255;
    const b = parseInt(partColor.slice(5, 7), 16) / 255;
    color = { r, g, b, a: 0.6 };
  } else if (partColor.includes('CHANNEL')) {
    const enumValue = partColor as ChannelType;
    if (Object.values(ChannelType).includes(enumValue)) {
      color = getChannelColor(enumValue);
    }
  }

  interface ContourInfo {
    contour: Contour;
    area: number;
    parent: ContourInfo | null;
    isOuter: boolean;
  }

  const allContours: ContourInfo[] = [];
  const looseEntities: any[] = [];

  const addContour = (contour: Contour) => {
    const area = calculatePolygonArea(contour.points);
    if (area > 0) {
      allContours.push({ contour, area, parent: null, isOuter: true });
    }
  };

  for (const entity of entities) {
    const entityType = (entity.type || '').toUpperCase();

    if (entityType === 'POLYLINE' || entityType === 'LWPOLYLINE') {
      const points = entity.geometry?.points;
      if (points && Array.isArray(points) && points.length >= 3) {
        const contourPoints = points.map((p: any) => ({ x: p.x, y: p.y }));
        addContour({ points: contourPoints, closed: true });
      }
      continue;
    }

    if (entityType === 'CIRCLE') {
      const center = entity.geometry?.center;
      const radius = entity.geometry?.radius;
      if (center && radius) {
        const segments = 32;
        const points: Point[] = [];
        for (let i = 0; i < segments; i++) {
          const angle = (i / segments) * 2 * Math.PI;
          points.push({
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle),
          });
        }
        addContour({ points, closed: true });
      }
      continue;
    }

    if (entityType === 'SPLINE') {
      const splinePoints = entity.geometry?.controlPoints || entity.geometry?.points;
      if (splinePoints && Array.isArray(splinePoints) && splinePoints.length >= 3) {
        const contourPoints = splinePoints.map((p: any) => ({ x: p.x, y: p.y }));
        addContour({ points: contourPoints, closed: true });
      }
      continue;
    }

    if (entityType === 'LINE' || entityType === 'ARC') {
      looseEntities.push(entity);
    }
  }

  if (looseEntities.length > 0) {
    const chainedContours = chainEntities(looseEntities);
    for (const contour of chainedContours) {
      addContour(contour);
    }
  }

  allContours.sort((a, b) => b.area - a.area);

  for (let i = 0; i < allContours.length; i++) {
    const current = allContours[i];
    const samplePoint = current.contour.points[0];

    for (let j = 0; j < i; j++) {
      const possibleParent = allContours[j];
      if (pointInPolygon(samplePoint, possibleParent.contour.points)) {
        current.isOuter = false;
        current.parent = possibleParent.isOuter ? possibleParent : possibleParent.parent;
        break;
      }
    }
  }

  const outerVertices: Vertex[] = [];
  const holeVertices: Vertex[] = [];

  const transformAndPush = (vList: Vertex[], points: Point[], triangles: number[]) => {
    let rad = 0;
    let cos = 1;
    let sin = 0;
    let offsetX = 0;
    let offsetY = 0;
    if (position || rotation) {
      rad = (rotation || 0) * Math.PI / 180;
      cos = Math.cos(rad);
      sin = Math.sin(rad);
      offsetX = position?.x || 0;
      offsetY = position?.y || 0;
    }

    for (let i = 0; i < triangles.length; i += 3) {
      const p1 = points[triangles[i]];
      const p2 = points[triangles[i + 1]];
      const p3 = points[triangles[i + 2]];

      const transform = (p: Point) => {
        if (position || rotation) {
          const rx = p.x * cos - p.y * sin;
          const ry = p.x * sin + p.y * cos;
          return { x: rx + offsetX, y: ry + offsetY };
        }
        return { x: p.x, y: p.y };
      };

      const tp1 = transform(p1);
      const tp2 = transform(p2);
      const tp3 = transform(p3);

      vList.push({ x: tp1.x, y: tp1.y, ...color });
      vList.push({ x: tp2.x, y: tp2.y, ...color });
      vList.push({ x: tp3.x, y: tp3.y, ...color });
    }
  };

  for (const c of allContours) {
    const triangles = generateTriangleFan(c.contour.points);

    if (c.isOuter) {
      transformAndPush(outerVertices, c.contour.points, triangles);
    } else if (c.parent && c.parent.isOuter) {
      transformAndPush(holeVertices, c.contour.points, triangles);
    }
  }

  return { outer: outerVertices, holes: holeVertices };
}

function generateTriangleFan(points: Point[]): number[] {
  const triangles: number[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    triangles.push(0, i, i + 1);
  }
  return triangles;
}
