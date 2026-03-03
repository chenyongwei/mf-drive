import type { BoundingBox, Contour, Point } from '../../../types';

import { pointsEqual } from '../distance';
import { polygonArea, polygonOrientation } from '../polygon';

import { getEntityEndpoints } from './endpoints';
import { buildGraph } from './graph';
import { findClosedLoops } from './loops';
import type { ContourDetectionResult, Entity, EntityGraph } from './types';

export function validateContour(loop: string[], graph: EntityGraph): boolean {
  if (loop.length < 3) return false;

  const firstEntity = graph.entities.get(loop[0]);
  const lastEntity = graph.entities.get(loop[loop.length - 1]);

  if (!firstEntity || !lastEntity) return false;

  const firstEndpoints = getEntityEndpoints(firstEntity);
  const lastEndpoints = getEntityEndpoints(lastEntity);

  if (
    !firstEndpoints.start ||
    !firstEndpoints.end ||
    !lastEndpoints.start ||
    !lastEndpoints.end
  ) {
    return false;
  }

  return (
    pointsEqual(lastEndpoints.end, firstEndpoints.start) ||
    pointsEqual(lastEndpoints.end, firstEndpoints.end) ||
    pointsEqual(lastEndpoints.start, firstEndpoints.start) ||
    pointsEqual(lastEndpoints.start, firstEndpoints.end)
  );
}

export function extractVerticesFromLoop(loop: string[], graph: EntityGraph): Point[] {
  const vertices: Point[] = [];

  loop.forEach((entityId) => {
    const entity = graph.entities.get(entityId);
    if (!entity) return;

    if (entity.type === 'LINE' && entity.geometry?.start) {
      vertices.push(entity.geometry.start);
    } else if (
      (entity.type === 'POLYLINE' || entity.type === 'LWPOLYLINE') &&
      entity.geometry?.points
    ) {
      vertices.push(...entity.geometry.points);
    } else if (entity.type === 'SPLINE') {
      const points = entity.geometry?.controlPoints || entity.geometry?.points;
      if (points && Array.isArray(points)) {
        vertices.push(...points);
      }
    }
  });

  const uniqueVertices: Point[] = [];
  vertices.forEach((vertex, index) => {
    if (index === 0 || !pointsEqual(vertex, vertices[index - 1])) {
      uniqueVertices.push(vertex);
    }
  });

  return uniqueVertices;
}

export function filterNestedContours(contours: Contour[]): Contour[] {
  if (contours.length === 0) return [];

  const sortedContours = [...contours].sort((a, b) => b.area - a.area);
  const filtered: Contour[] = [];

  sortedContours.forEach((contour) => {
    const isNested = filtered.some((outer) => {
      return (
        contour.bbox.minX >= outer.bbox.minX &&
        contour.bbox.maxX <= outer.bbox.maxX &&
        contour.bbox.minY >= outer.bbox.minY &&
        contour.bbox.maxY <= outer.bbox.maxY &&
        contour.area < outer.area * 0.9
      );
    });

    if (!isNested) {
      filtered.push(contour);
    }
  });

  return filtered;
}

function calculateBoundingBox(entities: Entity[]): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  entities.forEach((entity) => {
    if (entity.type === 'LINE' && entity.geometry?.start && entity.geometry?.end) {
      minX = Math.min(minX, entity.geometry.start.x, entity.geometry.end.x);
      minY = Math.min(minY, entity.geometry.start.y, entity.geometry.end.y);
      maxX = Math.max(maxX, entity.geometry.start.x, entity.geometry.end.x);
      maxY = Math.max(maxY, entity.geometry.start.y, entity.geometry.end.y);
    } else if (
      (entity.type === 'POLYLINE' || entity.type === 'LWPOLYLINE') &&
      entity.geometry?.points
    ) {
      entity.geometry.points.forEach((point: Point) => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    } else if ((entity.type === 'CIRCLE' || entity.type === 'ARC') && entity.geometry?.center) {
      const radius = entity.geometry.radius || 0;
      minX = Math.min(minX, entity.geometry.center.x - radius);
      minY = Math.min(minY, entity.geometry.center.y - radius);
      maxX = Math.max(maxX, entity.geometry.center.x + radius);
      maxY = Math.max(maxY, entity.geometry.center.y + radius);
    }
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
  };
}

export function detectContours(entities: Entity[]): ContourDetectionResult {
  if (entities.length === 0) {
    return { contours: [], numClosed: 0, numOpen: 0 };
  }

  const graph = buildGraph(entities);
  const loops = findClosedLoops(graph);

  const contours: Contour[] = [];
  let numClosed = 0;
  let numOpen = 0;

  loops.forEach((loop, index) => {
    const isValid = validateContour(loop, graph);

    const vertices = extractVerticesFromLoop(loop, graph);
    const bbox = calculateBoundingBox(loop.map((id) => graph.entities.get(id)!).filter(Boolean));
    const area = polygonArea(vertices);

    const contour: Contour = {
      id: `contour-${index}`,
      isClosed: isValid,
      isOuter: false,
      direction: polygonOrientation(vertices),
      holes: [],
      vertices,
      entities: loop,
      bbox,
      area,
    };

    contours.push(contour);

    if (isValid) {
      numClosed += 1;
    } else {
      numOpen += 1;
    }
  });

  const filteredContours = filterNestedContours(contours);

  return {
    contours: filteredContours,
    numClosed,
    numOpen,
  };
}
