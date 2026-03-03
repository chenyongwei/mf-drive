/**
 * Collision Detection Engine for WebGPU CAD Interfaces.
 */

import {
  boundingBoxesIntersect,
  calculateBoundingBox,
  isPolygonStrictlyInsidePolygon,
  pointInPolygon,
  polygonsIntersect,
  simplifyPolygon,
} from './CollisionDetectionEngine.geometry';
import { SpatialGrid } from './CollisionDetectionEngine.spatialGrid';
import {
  BoundingBox,
  CollisionResult,
  Part,
  Point,
  Polygon,
} from './CollisionDetectionEngine.types';

export type {
  BoundingBox,
  CollisionResult,
  Part,
  Point,
  Polygon,
} from './CollisionDetectionEngine.types';

export {
  boundingBoxesIntersect,
  calculateBoundingBox,
  pointInPolygon,
  polygonsIntersect,
  simplifyPolygon,
} from './CollisionDetectionEngine.geometry';

export class CollisionDetectionEngine {
  private parts: Map<string, Part> = new Map();
  private spatialIndex: SpatialGrid | null = null;

  constructor(private bounds?: { width: number; height: number }) {
    if (bounds) {
      this.spatialIndex = new SpatialGrid(bounds.width, bounds.height, 100);
    }
  }

  addPart(part: Part): void {
    this.parts.set(part.id, part);
    this.spatialIndex?.addPart(part);
  }

  removePart(partId: string): void {
    this.parts.delete(partId);
    this.spatialIndex?.removePart(partId);
  }

  updatePartTransform(
    partId: string,
    position: Point,
    rotation: number,
    mirroredX?: boolean,
    mirroredY?: boolean,
  ): void {
    const part = this.parts.get(partId);
    if (!part) {
      return;
    }
    part.position = position;
    part.rotation = rotation;
    part.mirroredX = mirroredX;
    part.mirroredY = mirroredY;
    this.spatialIndex?.updatePart(part);
  }

  checkRectangleCollision(
    partId: string,
    newPosition: Point,
    excludePartIds: string[] = [],
  ): CollisionResult {
    const part = this.parts.get(partId);
    if (!part) {
      return { hasCollision: false, collidingParts: [] };
    }

    const newBoundingBox = this.calculateTransformedBoundingBox(part, newPosition);
    const collidingParts: string[] = [];
    const collisionDetails: CollisionResult['collisionDetails'] = {};

    const candidates = this.spatialIndex
      ? this.spatialIndex.query(newBoundingBox).map(id => this.parts.get(id)!).filter(Boolean)
      : Array.from(this.parts.values());

    for (const other of candidates) {
      if (other.id === partId || excludePartIds.includes(other.id)) {
        continue;
      }

      if (boundingBoxesIntersect(newBoundingBox, other.boundingBox)) {
        collidingParts.push(other.id);
        collisionDetails[other.id] = {
          type: 'rectangle',
          precision: 'simplified',
        };
      }
    }

    return {
      hasCollision: collidingParts.length > 0,
      collidingParts,
      collisionDetails,
    };
  }

  checkPolygonCollision(
    partId: string,
    newPosition: Point,
    newRotation: number,
    usePrecise: boolean = false,
    excludePartIds: string[] = [],
  ): CollisionResult {
    const part = this.parts.get(partId);
    if (!part) {
      return { hasCollision: false, collidingParts: [] };
    }

    const pivot = {
      x: (part.boundingBox.minX + part.boundingBox.maxX) / 2,
      y: (part.boundingBox.minY + part.boundingBox.maxY) / 2,
    };

    const contour = usePrecise ? part.outerContour : (part.simplifiedContour || part.outerContour);
    const transformedContour = this.transformPolygon(
      contour.points,
      newPosition,
      newRotation,
      part.mirroredX,
      part.mirroredY,
      pivot,
    );

    const newBoundingBox = this.calculateTransformedBoundingBox(part, newPosition);
    const collidingParts: string[] = [];
    const collisionDetails: CollisionResult['collisionDetails'] = {};

    const candidates = this.spatialIndex
      ? this.spatialIndex.query(newBoundingBox).map(id => this.parts.get(id)!).filter(Boolean)
      : Array.from(this.parts.values());

    for (const other of candidates) {
      if (other.id === partId || excludePartIds.includes(other.id)) {
        continue;
      }

      const otherPivot = {
        x: (other.boundingBox.minX + other.boundingBox.maxX) / 2,
        y: (other.boundingBox.minY + other.boundingBox.maxY) / 2,
      };

      const otherContour = usePrecise ? other.outerContour : (other.simplifiedContour || other.outerContour);
      const otherTransformed = this.transformPolygon(
        otherContour.points,
        other.position,
        other.rotation,
        other.mirroredX,
        other.mirroredY,
        otherPivot,
      );

      if (!polygonsIntersect(transformedContour, otherTransformed)) {
        continue;
      }

      const nestedInsideOther =
        (other.innerContours?.length ?? 0) > 0 &&
        this.checkNestedNesting(partId, other.id, newPosition, newRotation);
      const otherNestedInsidePart =
        (part.innerContours?.length ?? 0) > 0 &&
        this.checkNestedNesting(other.id, partId, other.position, other.rotation);

      if (nestedInsideOther || otherNestedInsidePart) {
        continue;
      }

      collidingParts.push(other.id);
      collisionDetails[other.id] = {
        type: 'polygon',
        precision: usePrecise ? 'precise' : 'simplified',
      };
    }

    return {
      hasCollision: collidingParts.length > 0,
      collidingParts,
      collisionDetails,
    };
  }

  checkNestedNesting(
    partId: string,
    hostPartId: string,
    position: Point,
    rotation: number,
  ): boolean {
    const part = this.parts.get(partId);
    const hostPart = this.parts.get(hostPartId);

    if (!part || !hostPart || !hostPart.innerContours || hostPart.innerContours.length === 0) {
      return false;
    }

    const partPivot = {
      x: (part.boundingBox.minX + part.boundingBox.maxX) / 2,
      y: (part.boundingBox.minY + part.boundingBox.maxY) / 2,
    };

    const hostPivot = {
      x: (hostPart.boundingBox.minX + hostPart.boundingBox.maxX) / 2,
      y: (hostPart.boundingBox.minY + hostPart.boundingBox.maxY) / 2,
    };

    const transformedPart = this.transformPolygon(
      part.outerContour.points,
      position,
      rotation,
      part.mirroredX,
      part.mirroredY,
      partPivot,
    );

    for (const innerContour of hostPart.innerContours) {
      const hostInnerTransformed = this.transformPolygon(
        innerContour.points,
        hostPart.position,
        hostPart.rotation,
        hostPart.mirroredX,
        hostPart.mirroredY,
        hostPivot,
      );

      const allPointsInside = isPolygonStrictlyInsidePolygon(transformedPart, hostInnerTransformed);
      if (allPointsInside) {
        return true;
      }
    }

    return false;
  }

  private transformPolygon(
    points: Point[],
    position: Point,
    rotation: number,
    mirroredX?: boolean,
    mirroredY?: boolean,
    pivot?: Point,
  ): Point[] {
    const px = pivot?.x || 0;
    const py = pivot?.y || 0;

    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    return points.map(point => {
      const x = point.x - px;
      const y = point.y - py;

      const rotatedX = cos * x - sin * y;
      const rotatedY = sin * x + cos * y;

      let finalX = rotatedX;
      let finalY = rotatedY;
      if (mirroredX) finalX = -finalX;
      if (mirroredY) finalY = -finalY;

      return {
        x: finalX + px + position.x,
        y: finalY + py + position.y,
      };
    });
  }

  private calculateTransformedBoundingBox(part: Part, position: Point): BoundingBox {
    return {
      minX: part.boundingBox.minX + position.x,
      minY: part.boundingBox.minY + position.y,
      maxX: part.boundingBox.maxX + position.x,
      maxY: part.boundingBox.maxY + position.y,
    };
  }
}
