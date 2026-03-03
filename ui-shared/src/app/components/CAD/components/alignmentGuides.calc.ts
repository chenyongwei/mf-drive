import type { NestingPart } from '../types/NestingTypes';
import {
  findClosestContourConnection,
  type PartForEdgeDetection,
} from '../utils/ParallelEdgeDetection';
import type { AlignmentGuide, AlignmentGuideOptions } from './AlignmentGuides.types';

export function calculateAlignmentGuides(
  draggedPart: NestingPart,
  allParts: NestingPart[],
  tolerance: number = 10,
  options: AlignmentGuideOptions = {},
): AlignmentGuide[] {
  const {
    showDistance = true,
    maxDistance = tolerance * 3,
    stickyTargetPartId = null,
    stickyDistanceMargin = 0.8,
  } = options;
  const guides: AlignmentGuide[] = [];
  const distanceCandidates: AlignmentGuide[] = [];
  const strongAlignmentTolerance = Math.min(2, tolerance);

  const toWorldBBox = (part: NestingPart) => ({
    minX: part.boundingBox.minX + part.position.x,
    minY: part.boundingBox.minY + part.position.y,
    maxX: part.boundingBox.maxX + part.position.x,
    maxY: part.boundingBox.maxY + part.position.y,
  });

  const dragBbox = toWorldBBox(draggedPart);
  const dragCenter = {
    x: (dragBbox.minX + dragBbox.maxX) / 2,
    y: (dragBbox.minY + dragBbox.maxY) / 2,
  };
  const draggedPartView: PartForEdgeDetection = {
    id: draggedPart.id,
    position: draggedPart.position,
    rotation: draggedPart.rotation,
    boundingBox: draggedPart.boundingBox,
    mirroredX: draggedPart.mirroredX,
    mirroredY: draggedPart.mirroredY,
    entities: draggedPart.entities,
  };

  for (const part of allParts) {
    if (part.id === draggedPart.id) continue;

    const bbox = toWorldBBox(part);
    const center = {
      x: (bbox.minX + bbox.maxX) / 2,
      y: (bbox.minY + bbox.maxY) / 2,
    };

    if (Math.abs(dragCenter.y - center.y) < strongAlignmentTolerance) {
      guides.push({
        type: 'horizontal',
        position: dragCenter.y,
        startPoint: { x: dragCenter.x, y: dragCenter.y },
        endPoint: { x: center.x, y: center.y },
        strength: 'strong',
      });
    }

    if (Math.abs(dragCenter.x - center.x) < strongAlignmentTolerance) {
      guides.push({
        type: 'vertical',
        position: dragCenter.x,
        startPoint: { x: dragCenter.x, y: dragCenter.y },
        endPoint: { x: center.x, y: center.y },
        strength: 'strong',
      });
    }

    if (showDistance) {
      const targetPartView: PartForEdgeDetection = {
        id: part.id,
        position: part.position,
        rotation: part.rotation,
        boundingBox: part.boundingBox,
        mirroredX: part.mirroredX,
        mirroredY: part.mirroredY,
        entities: part.entities,
      };
      const closestConnection = findClosestContourConnection(
        draggedPartView,
        targetPartView,
        maxDistance,
      );

      if (
        closestConnection &&
        closestConnection.distance > 1e-4 &&
        closestConnection.distance <= maxDistance + 1e-4
      ) {
        distanceCandidates.push({
          type: 'distance',
          position: 0,
          startPoint: closestConnection.sourcePoint,
          endPoint: closestConnection.targetPoint,
          distance: closestConnection.distance,
          targetPartId: part.id,
        });
      }
    }
  }

  if (showDistance && distanceCandidates.length > 0) {
    distanceCandidates.sort(
      (a, b) =>
        (a.distance ?? Number.POSITIVE_INFINITY) -
        (b.distance ?? Number.POSITIVE_INFINITY),
    );

    const bestCandidate = distanceCandidates[0];
    let selectedDistanceGuide = bestCandidate;

    if (stickyTargetPartId) {
      const stickyCandidate = distanceCandidates.find(
        (candidate) => candidate.targetPartId === stickyTargetPartId,
      );
      if (
        stickyCandidate &&
        stickyCandidate.distance !== undefined &&
        bestCandidate.distance !== undefined &&
        stickyCandidate.distance <= bestCandidate.distance + stickyDistanceMargin
      ) {
        selectedDistanceGuide = stickyCandidate;
      }
    }

    guides.push(selectedDistanceGuide);
  }

  return guides;
}
